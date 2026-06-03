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

type LiveKitState = {
  connectionState: ConnectionState;
  local: ParticipantSnapshot | null;
  participants: ParticipantSnapshot[];
  messages: ChatMessage[];
  isConnecting: boolean;
  lastError: string | null;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  pinnedIdentity: string | null;
  getRoom: () => Room | null;
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  setPinnedIdentity: (identity: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
};

type SetLiveKitState = (
  state: Partial<LiveKitState> | ((state: LiveKitState) => Partial<LiveKitState>),
) => void;

function snapshotParticipant(participant: Participant): ParticipantSnapshot {
  const cam = participant.getTrackPublication(Track.Source.Camera);
  const audio = participant.getTrackPublication(Track.Source.Microphone);
  const screen = participant.getTrackPublication(Track.Source.ScreenShare);
  const canPublish = participant.permissions?.canPublish ?? true;

  return {
    sid: participant.sid,
    identity: participant.identity,
    name: participant.name,
    metadata: participant.metadata,
    isLocal: participant.isLocal,
    isSpeaking: participant.isSpeaking,
    audioLevel: participant.audioLevel,
    micEnabled: canPublish ? !(audio?.isMuted ?? true) : false,
    camEnabled: canPublish ? !(cam?.isMuted ?? true) : false,
    screenShareEnabled: canPublish ? !(screen?.isMuted ?? true) : false,
    canPublish,
    cam,
    screen,
    audio,
  };
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

function refreshParticipants(set: SetLiveKitState) {
  set(collectParticipants(room));
}

function wireRoomEvents(target: Room, set: SetLiveKitState) {
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
      cameraEnabled: false,
      microphoneEnabled: false,
      pinnedIdentity: null,

      getRoom: () => room,

      async connect(url: string, token: string) {
        set({ isConnecting: true, lastError: null });

        try {
          if (room) {
            await get().disconnect();
          }

          const nextRoom = new Room();
          room = nextRoom;
          wireRoomEvents(nextRoom, set);
          await nextRoom.connect(url, token);
          set({
            connectionState: nextRoom.state,
            isConnecting: false,
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
        set({ cameraEnabled: enabled });
        const localParticipant: LocalParticipant | undefined =
          room?.localParticipant;
        if (localParticipant) {
          await localParticipant.setCameraEnabled(enabled);
          refreshParticipants(set);
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
      }),
    },
  ),
);
