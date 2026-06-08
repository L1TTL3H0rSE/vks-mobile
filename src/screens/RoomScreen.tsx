import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { vksApi } from "@/api/vksApi";
import { idApi } from "@/api/idApi";
import { ChatSheet } from "@/components/ChatSheet";
import { ParticipantActionSheet } from "@/components/ParticipantActionSheet";
import { ParticipantTile } from "@/components/ParticipantTile";
import { ParticipantsSheet } from "@/components/ParticipantsSheet";
import { RoomControls } from "@/components/RoomControls";
import { Card, Screen, StateView } from "@/components/ui";
import {
  defaultParticipantSettings,
  useLiveKitStore,
  type ParticipantSnapshot,
} from "@/livekit/livekitStore";
import { colors, spacing, typography } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type RoomScreenProps = {
  roomId: string;
};

export function RoomScreen({ roomId }: RoomScreenProps) {
  const insets = useSafeAreaInsets();
  const participantsSheetRef = useRef<BottomSheetModal>(null);
  const participantActionSheetRef = useRef<BottomSheetModal>(null);
  const chatSheetRef = useRef<BottomSheetModal>(null);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantSnapshot | null>(null);
  const rawParticipants = useLiveKitStore((state) => state.participants);
  const participants = useMemo(
    () => (Array.isArray(rawParticipants) ? rawParticipants : []),
    [rawParticipants],
  );
  const messages = useLiveKitStore((state) => state.messages);
  const local = useLiveKitStore((state) => state.local);
  const cameraEnabled = useLiveKitStore((state) => state.cameraEnabled);
  const microphoneEnabled = useLiveKitStore((state) => state.microphoneEnabled);
  const connectionState = useLiveKitStore((state) => state.connectionState);
  const pinnedIdentity = useLiveKitStore((state) => state.pinnedIdentity);
  const toggleCamera = useLiveKitStore((state) => state.toggleCamera);
  const toggleMicrophone = useLiveKitStore((state) => state.toggleMicrophone);
  const setPinnedIdentity = useLiveKitStore((state) => state.setPinnedIdentity);
  const sendMessage = useLiveKitStore((state) => state.sendMessage);
  const leaveRoom = useLiveKitStore((state) => state.leaveRoom);
  const participantSettings = useLiveKitStore((state) => state.participantSettings);
  const toggleParticipantMuted = useLiveKitStore((state) => state.toggleParticipantMuted);
  const setParticipantVolume = useLiveKitStore((state) => state.setParticipantVolume);
  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await vksApi.getRoomById(roomId)).data,
  });
  const room = roomQuery.data;
  const profileIds = useMemo(
    () => Array.from(new Set(participants.map((item) => item.identity))).sort(),
    [participants],
  );
  const profilesQuery = useQuery({
    queryKey: ["profiles", profileIds],
    queryFn: () => idApi.readPublicProfiles(profileIds),
    enabled: profileIds.length > 0,
  });
  const profiles = useMemo(() => {
    const items = Array.isArray(profilesQuery.data) ? profilesQuery.data : [];
    return new Map(items.map((profile) => [profile.user_id, profile]));
  }, [profilesQuery.data]);

  const displayParticipants = useMemo(() => {
    const sorted = [...participants].sort((a, b) => {
      if (a.identity === pinnedIdentity) return -1;
      if (b.identity === pinnedIdentity) return 1;
      if (a.screenShareEnabled && !b.screenShareEnabled) return -1;
      if (!a.screenShareEnabled && b.screenShareEnabled) return 1;
      if (a.isSpeaking && !b.isSpeaking) return -1;
      if (!a.isSpeaking && b.isSpeaking) return 1;
      if (a.camEnabled && !b.camEnabled) return -1;
      if (!a.camEnabled && b.camEnabled) return 1;
      if (a.audioLevel !== b.audioLevel) return b.audioLevel - a.audioLevel;
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      return a.identity.localeCompare(b.identity);
    });

    if (!pinnedIdentity) return sorted;
    const pinned = participants.find((item) => item.identity === pinnedIdentity);
    if (!pinned) return sorted;
    return [pinned, ...sorted.filter((item) => item.identity !== pinnedIdentity)];
  }, [participants, pinnedIdentity]);
  const featuredParticipant = displayParticipants[0] ?? null;
  const secondaryParticipants = displayParticipants.slice(1);
  const selectedSettings = selectedParticipant
    ? (participantSettings[selectedParticipant.identity] ?? defaultParticipantSettings)
    : defaultParticipantSettings;

  function openParticipantMenu(participant: ParticipantSnapshot) {
    setSelectedParticipant(participant);
    requestAnimationFrame(() => participantActionSheetRef.current?.present());
  }

  const moderatorAction = useMutation({
    mutationFn: async ({
      action,
      identity,
    }: {
      action: "kick" | "mute" | "unmute" | "mic" | "cam" | "screen";
      identity: string;
    }) => {
      switch (action) {
        case "kick":
          return vksApi.kickUser(roomId, identity);
        case "mute":
          return vksApi.muteUser(roomId, identity);
        case "unmute":
          return vksApi.unmuteUser(roomId, identity);
        case "mic":
          return vksApi.softMicrophoneDisable(roomId, identity);
        case "cam":
          return vksApi.softCameraDisable(roomId, identity);
        case "screen":
          return vksApi.softScreenDisable(roomId, identity);
      }
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Действие выполнено" });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Не удалось выполнить действие",
        text2: err instanceof Error ? err.message : String(err),
      });
    },
  });

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        {featuredParticipant ? (
          <View style={styles.stage}>
            <ParticipantTile
              fill
              participant={featuredParticipant}
              displayName={getProfileName(
                profiles.get(featuredParticipant.identity),
                featuredParticipant.name || featuredParticipant.identity,
              )}
              avatarUrl={getProfileAvatarUrl(profiles.get(featuredParticipant.identity))}
              pinned={featuredParticipant.identity === pinnedIdentity}
              canManage={room?.can_manage}
              onPress={() =>
                setPinnedIdentity(
                  featuredParticipant.identity === pinnedIdentity
                    ? null
                    : featuredParticipant.identity,
                )
              }
              onMenuPress={() => openParticipantMenu(featuredParticipant)}
              onMutePress={() =>
                moderatorAction.mutate({ action: "mute", identity: featuredParticipant.identity })
              }
            />
          </View>
        ) : (
          <Card style={[styles.stage, styles.emptyStage]}>
            <StateView
              title="Подключение устанавливается"
              text="Участники появятся после подключения к комнате."
              loading={connectionState === "connecting"}
            />
          </Card>
        )}
        {secondaryParticipants.length > 0 ? (
          <ScrollView
            horizontal
            contentContainerStyle={styles.stripContent}
            showsHorizontalScrollIndicator={false}
            style={styles.strip}
          >
            {secondaryParticipants.map((participant) => (
              <View key={participant.sid || participant.identity} style={styles.stripTile}>
                <ParticipantTile
                  compact
                  participant={participant}
                  displayName={getProfileName(
                    profiles.get(participant.identity),
                    participant.name || participant.identity,
                  )}
                  avatarUrl={getProfileAvatarUrl(profiles.get(participant.identity))}
                  pinned={participant.identity === pinnedIdentity}
                  canManage={room?.can_manage}
                  onPress={() =>
                    setPinnedIdentity(
                      participant.identity === pinnedIdentity
                        ? null
                        : participant.identity,
                      )
                  }
                  onMenuPress={() => openParticipantMenu(participant)}
                  onMutePress={() =>
                    moderatorAction.mutate({ action: "mute", identity: participant.identity })
                  }
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyParticipants}>
            <Text style={styles.emptyTitle}>Вы пока один в комнате</Text>
            <Text style={styles.emptyText}>
              Когда подключатся другие участники, они появятся здесь.
            </Text>
          </View>
        )}
      </View>
      <View style={{ paddingBottom: insets.bottom }}>
        <RoomControls
          cameraEnabled={cameraEnabled}
          microphoneEnabled={microphoneEnabled}
          onCamera={() => void toggleCamera()}
          onMicrophone={() => void toggleMicrophone()}
          onDisconnect={() => void leaveRoom()}
          onParticipants={() => participantsSheetRef.current?.present()}
          onChat={() => chatSheetRef.current?.present()}
          onSettings={() => router.push("/settings")}
        />
      </View>
      <ParticipantsSheet
        ref={participantsSheetRef}
        participants={participants}
        profiles={profiles}
        pinnedIdentity={pinnedIdentity}
        canManageRoom={room?.can_manage}
        onPin={setPinnedIdentity}
        onParticipantMenu={openParticipantMenu}
      />
      <ParticipantActionSheet
        ref={participantActionSheetRef}
        canManageRoom={room?.can_manage}
        participant={selectedParticipant}
        profile={selectedParticipant ? profiles.get(selectedParticipant.identity) : undefined}
        settings={selectedSettings}
        onClose={() => setSelectedParticipant(null)}
        onToggleMute={toggleParticipantMuted}
        onVolumeChange={setParticipantVolume}
        onKick={(identity) => moderatorAction.mutate({ action: "kick", identity })}
        onSoftMicrophoneDisable={(identity) =>
          moderatorAction.mutate({ action: "mic", identity })
        }
        onSoftCameraDisable={(identity) =>
          moderatorAction.mutate({ action: "cam", identity })
        }
        onSoftScreenDisable={(identity) =>
          moderatorAction.mutate({ action: "screen", identity })
        }
      />
      <ChatSheet
        ref={chatSheetRef}
        messages={messages}
        localIdentity={local?.identity}
        profiles={profiles}
        onSend={(text) => void sendMessage(text)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.secondaryBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  endAction: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  stage: {
    flex: 1,
    minHeight: 260,
    width: "100%",
  },
  emptyStage: {
    justifyContent: "center",
    padding: 0,
  },
  strip: {
    flexGrow: 0,
    maxHeight: 178,
    marginHorizontal: -spacing.md,
  },
  stripTile: {
    width: 300,
  },
  stripContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  emptyParticipants: {
    alignItems: "center",
    minHeight: 96,
    gap: spacing.xs,
    justifyContent: "center",
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
