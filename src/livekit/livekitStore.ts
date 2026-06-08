import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ConnectionState,
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from "livekit-client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const KEEP_AWAKE_TAG = "vks-livekit";
let room: Room | null = null;

export type ParticipantSnapshot = {
  liveKitParticipant: Participant;
  sid: string;
  identity: string;
  name?: string;
  metadata?: string;
  isLocal: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  micEnabled: boolean;
  camEnabled: boolean;
  screenShareEnabled: boolean;
  canPublish: boolean;
  cam?: TrackPublication;
  screen?: TrackPublication;
  audio?: TrackPublication;
};

export type ChatMessage = {
  id: string;
  text: string;
  fromIdentity: string;
  fromSid: string;
  ts: number;
};

export type ParticipantLocalSettings = {
  muted: boolean;
  micVolume: number;
  streamVolume: number;
};

export const defaultParticipantSettings: ParticipantLocalSettings = {
  muted: false,
  micVolume: 1,
  streamVolume: 1,
};

type LiveKitState = {
  connectionState: ConnectionState;
  local: ParticipantSnapshot | null;
  participants: ParticipantSnapshot[];
  messages: ChatMessage[];
  isConnecting: boolean;
  lastError: string | null;
  connectedRoomId: string | null;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  pinnedIdentity: string | null;
  participantSettings: Record<string, ParticipantLocalSettings>;
  getRoom: () => Room | null;
  connect: (url: string, token: string, roomId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  setPinnedIdentity: (identity: string | null) => void;
  getParticipantSettings: (identity: string) => ParticipantLocalSettings;
  toggleParticipantMuted: (identity: string) => void;
  setParticipantVolume: (
    identity: string,
    kind: "mic" | "stream",
    value: number,
  ) => void;
  sendMessage: (text: string) => Promise<void>;
};

type SetLiveKitState = (
  state: Partial<LiveKitState> | ((state: LiveKitState) => Partial<LiveKitState>),
) => void;
type GetLiveKitState = () => LiveKitState;

function snapshotParticipant(participant: Participant): ParticipantSnapshot {
  const cam = participant.getTrackPublication(Track.Source.Camera);
  const audio = participant.getTrackPublication(Track.Source.Microphone);
  const screen = participant.getTrackPublication(Track.Source.ScreenShare);
  const canPublish = participant.permissions?.canPublish ?? true;
  const camEnabled = canPublish && isLiveVideoPublication(cam);
  const screenShareEnabled = canPublish && isLiveVideoPublication(screen);

  return {
    liveKitParticipant: participant,
    sid: participant.sid,
    identity: participant.identity,
    name: participant.name,
    metadata: participant.metadata,
    isLocal: participant.isLocal,
    isSpeaking: participant.isSpeaking,
    audioLevel: participant.audioLevel,
    micEnabled: canPublish ? !(audio?.isMuted ?? true) : false,
    camEnabled,
    screenShareEnabled,
    canPublish,
    cam,
    screen,
    audio,
  };
}

function isLiveVideoPublication(publication: TrackPublication | undefined) {
  if (!publication || publication.isMuted || !publication.videoTrack) return false;

  const mediaTrack = publication.videoTrack.mediaStreamTrack;
  return mediaTrack.readyState === "live" && mediaTrack.enabled;
}

function collectParticipants(target: Room | null) {
  if (!target) return { local: null, participants: [] };

  const participants = [
    snapshotParticipant(target.localParticipant),
    ...Array.from(target.remoteParticipants.values()).map(snapshotParticipant),
  ];

  participants.sort((a, b) => {
    if (a.isLocal && !b.isLocal) return -1;
    if (!a.isLocal && b.isLocal) return 1;
    if (a.isSpeaking && !b.isSpeaking) return -1;
    if (!a.isSpeaking && b.isSpeaking) return 1;
    if (a.camEnabled && !b.camEnabled) return -1;
    if (!a.camEnabled && b.camEnabled) return 1;
    return a.identity.localeCompare(b.identity);
  });

  return {
    local: participants.find((participant) => participant.isLocal) ?? null,
    participants,
  };
}

function applyPublicationVolume(
  publication: TrackPublication | undefined,
  volume: number,
  muted: boolean,
) {
  const track = (publication as { audioTrack?: { setVolume?: (value: number) => void } } | undefined)
    ?.audioTrack;
  track?.setVolume?.(muted ? 0 : volume);
}

function applyParticipantSettings(
  target: Room | null,
  identity: string,
  settings: ParticipantLocalSettings,
) {
  const participant =
    target?.localParticipant.identity === identity
      ? target.localParticipant
      : target?.remoteParticipants.get(identity);
  if (!participant) return;

  applyPublicationVolume(
    participant.getTrackPublication(Track.Source.Microphone),
    settings.micVolume,
    settings.muted,
  );

  applyPublicationVolume(
    participant.getTrackPublication(Track.Source.ScreenShareAudio),
    settings.streamVolume,
    settings.muted,
  );
}

function applyAllParticipantSettings(
  target: Room | null,
  settingsMap: Record<string, ParticipantLocalSettings>,
) {
  Object.entries(settingsMap).forEach(([identity, settings]) => {
    applyParticipantSettings(target, identity, settings);
  });
}

function refreshParticipants(set: SetLiveKitState) {
  set(collectParticipants(room));
}

function wireRoomEvents(target: Room, set: SetLiveKitState, get: GetLiveKitState) {
  target
    .on(RoomEvent.ConnectionStateChanged, (state) => {
      set({ connectionState: state });
    })
    .on(RoomEvent.ParticipantConnected, (_participant: RemoteParticipant) => {
      refreshParticipants(set);
    })
    .on(RoomEvent.ParticipantDisconnected, (_participant: RemoteParticipant) => {
      refreshParticipants(set);
    })
    .on(RoomEvent.TrackSubscribed, () => {
      applyAllParticipantSettings(target, get().participantSettings);
      refreshParticipants(set);
    })
    .on(RoomEvent.TrackUnsubscribed, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.TrackMuted, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.TrackUnmuted, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.LocalTrackPublished, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.LocalTrackUnpublished, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.ActiveSpeakersChanged, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.ParticipantMetadataChanged, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.ParticipantPermissionsChanged, () => {
      refreshParticipants(set);
    })
    .on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const parsed = JSON.parse(decodeUtf8(payload)) as {
          t?: string;
          text?: unknown;
          ts?: unknown;
        };
        if (parsed.t !== "chat") return;

        set((current) => ({
          messages: [
            ...current.messages,
            {
              id: `${Date.now()}-${current.messages.length}`,
              text: String(parsed.text ?? ""),
              fromIdentity: participant?.identity ?? "system",
              fromSid: participant?.sid ?? "system",
              ts: typeof parsed.ts === "number" ? parsed.ts : Date.now(),
            },
          ],
        }));
      } catch {}
    })
    .on(RoomEvent.Disconnected, () => {
      if (room !== target) return;
      room = null;
      set({
        connectionState: ConnectionState.Disconnected,
        isConnecting: false,
        connectedRoomId: null,
        local: null,
        participants: [],
        pinnedIdentity: null,
      });
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    });
}

function encodeUtf8(value: string) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value);
  }

  const encoded = encodeURIComponent(value);
  const bytes: number[] = [];

  for (let index = 0; index < encoded.length; index += 1) {
    if (encoded[index] === "%") {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(encoded.charCodeAt(index));
    }
  }

  return Uint8Array.from(bytes);
}

function decodeUtf8(value: Uint8Array) {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(value);
  }

  return decodeURIComponent(
    Array.from(value)
      .map((byte) => `%${byte.toString(16).padStart(2, "0")}`)
      .join(""),
  );
}

export const useLiveKitStore = create<LiveKitState>()(
  persist(
    (set, get) => ({
      connectionState: ConnectionState.Disconnected,
      local: null,
      participants: [],
      messages: [],
      isConnecting: false,
      lastError: null,
      connectedRoomId: null,
      cameraEnabled: false,
      microphoneEnabled: false,
      pinnedIdentity: null,
      participantSettings: {},

      getRoom: () => room,

      async connect(url: string, token: string, roomId: string) {
        set({ isConnecting: true, lastError: null, connectedRoomId: null });

        try {
          if (room) {
            await get().disconnect();
          }

          const nextRoom = new Room();
          room = nextRoom;
          wireRoomEvents(nextRoom, set, get);
          await nextRoom.connect(url, token);
          set({
            connectionState: nextRoom.state,
            isConnecting: false,
            connectedRoomId: roomId,
            messages: [],
            ...collectParticipants(nextRoom),
          });
          await nextRoom.localParticipant.setCameraEnabled(get().cameraEnabled);
          await nextRoom.localParticipant.setMicrophoneEnabled(
            get().microphoneEnabled,
          );
          refreshParticipants(set);
          await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          set({
            connectionState: ConnectionState.Disconnected,
            isConnecting: false,
            connectedRoomId: null,
            lastError: message,
          });
          await get().disconnect();
          throw error;
        }
      },

      async disconnect() {
        const currentRoom = room;
        room = null;
        if (currentRoom) {
          currentRoom.removeAllListeners();
          await currentRoom.disconnect();
        }
        await deactivateKeepAwake(KEEP_AWAKE_TAG);
        set({
          connectionState: ConnectionState.Disconnected,
          isConnecting: false,
          connectedRoomId: null,
          local: null,
          participants: [],
          pinnedIdentity: null,
        });
      },

      async leaveRoom() {
        await get().disconnect();
      },

      async toggleCamera() {
        const enabled = !get().cameraEnabled;
        const localParticipant: LocalParticipant | undefined =
          room?.localParticipant;

        if (!localParticipant) {
          set({ cameraEnabled: enabled, lastError: null });
          return;
        }

        try {
          await localParticipant.setCameraEnabled(enabled);
          set({ cameraEnabled: enabled, lastError: null });
          refreshParticipants(set);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          set({ cameraEnabled: get().cameraEnabled, lastError: message });
          refreshParticipants(set);
          throw error;
        }
      },

      async toggleMicrophone() {
        const enabled = !get().microphoneEnabled;
        set({ microphoneEnabled: enabled });
        const localParticipant: LocalParticipant | undefined =
          room?.localParticipant;
        if (localParticipant) {
          await localParticipant.setMicrophoneEnabled(enabled);
          refreshParticipants(set);
        }
      },

      setPinnedIdentity(identity: string | null) {
        set({ pinnedIdentity: identity });
      },

      getParticipantSettings(identity: string) {
        return get().participantSettings[identity] ?? defaultParticipantSettings;
      },

      toggleParticipantMuted(identity: string) {
        const current = get().getParticipantSettings(identity);
        const next = { ...current, muted: !current.muted };
        set((state) => ({
          participantSettings: {
            ...state.participantSettings,
            [identity]: next,
          },
        }));
        applyParticipantSettings(room, identity, next);
      },

      setParticipantVolume(identity: string, kind: "mic" | "stream", value: number) {
        const clamped = Math.max(0, Math.min(1, value));
        const current = get().getParticipantSettings(identity);
        const next = {
          ...current,
          [kind === "mic" ? "micVolume" : "streamVolume"]: clamped,
        };
        set((state) => ({
          participantSettings: {
            ...state.participantSettings,
            [identity]: next,
          },
        }));
        applyParticipantSettings(room, identity, next);
      },

      async sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || !room) return;

        const payload = encodeUtf8(
          JSON.stringify({ t: "chat", text: trimmed, ts: Date.now() }),
        );
        await room.localParticipant.publishData(payload, {
          reliable: true,
          topic: "chat",
        });
        set((current) => ({
          messages: [
            ...current.messages,
            {
              id: `${Date.now()}-${current.messages.length}`,
              text: trimmed,
              fromIdentity: room?.localParticipant.identity ?? "me",
              fromSid: room?.localParticipant.sid ?? "me",
              ts: Date.now(),
            },
          ],
        }));
      },
    }),
    {
      name: "vks.livekit.settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cameraEnabled: state.cameraEnabled,
        microphoneEnabled: state.microphoneEnabled,
        participantSettings: state.participantSettings,
      }),
    },
  ),
);
