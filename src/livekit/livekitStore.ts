import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
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

type LiveKitState = {
  connectionState: ConnectionState;
  local: ParticipantSnapshot | null;
  participants: ParticipantSnapshot[];
  isConnecting: boolean;
  lastError: string | null;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  getRoom: () => Room | null;
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
};

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

function refreshParticipants(set: (state: Partial<LiveKitState>) => void) {
  set(collectParticipants(room));
}

function wireRoomEvents(target: Room, set: (state: Partial<LiveKitState>) => void) {
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
    .on(RoomEvent.Disconnected, () => {
      set({
        connectionState: ConnectionState.Disconnected,
        isConnecting: false,
        ...collectParticipants(room),
      });
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    });
}

export const useLiveKitStore = create<LiveKitState>((set, get) => ({
  connectionState: ConnectionState.Disconnected,
  local: null,
  participants: [],
  isConnecting: false,
  lastError: null,
  cameraEnabled: false,
  microphoneEnabled: false,

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
    });
  },

  async toggleCamera() {
    const enabled = !get().cameraEnabled;
    set({ cameraEnabled: enabled });
    const localParticipant: LocalParticipant | undefined = room?.localParticipant;
    if (localParticipant) {
      await localParticipant.setCameraEnabled(enabled);
      refreshParticipants(set);
    }
  },

  async toggleMicrophone() {
    const enabled = !get().microphoneEnabled;
    set({ microphoneEnabled: enabled });
    const localParticipant: LocalParticipant | undefined = room?.localParticipant;
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(enabled);
      refreshParticipants(set);
    }
  },
}));
