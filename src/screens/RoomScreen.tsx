import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { vksApi } from "@/api/vksApi";
import { idApi } from "@/api/idApi";
import { ChatSheet } from "@/components/ChatSheet";
import { AppButton } from "@/components/AppButton";
import { ParticipantTile } from "@/components/ParticipantTile";
import { ParticipantsSheet } from "@/components/ParticipantsSheet";
import { RoomControls } from "@/components/RoomControls";
import { useLiveKitStore } from "@/livekit/livekitStore";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type RoomScreenProps = {
  roomId: string;
};

export function RoomScreen({ roomId }: RoomScreenProps) {
  const insets = useSafeAreaInsets();
  const participantsSheetRef = useRef<BottomSheetModal>(null);
  const chatSheetRef = useRef<BottomSheetModal>(null);
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
    if (!pinnedIdentity) return participants;
    const pinned = participants.find((item) => item.identity === pinnedIdentity);
    if (!pinned) return participants;
    return [pinned, ...participants.filter((item) => item.identity !== pinnedIdentity)];
  }, [participants, pinnedIdentity]);

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
  const closeRoom = useMutation({
    mutationFn: async () => vksApi.closeRoom(roomId),
    onSuccess: async () => {
      Toast.show({ type: "success", text1: "Встреча завершена" });
      await leaveRoom();
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Не удалось завершить встречу",
        text2: err instanceof Error ? err.message : String(err),
      });
    },
  });
  const columns = displayParticipants.length <= 1 ? 1 : 2;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.title}>
          {room?.name ?? `Комната ${roomId}`}
        </Text>
        <Text style={styles.text}>
          {participants.length} онлайн · {connectionState}
        </Text>
        {room?.can_manage ? (
          <View style={styles.headerAction}>
            <AppButton
              title="Завершить встречу"
              variant="danger"
              loading={closeRoom.isPending}
              onPress={() => closeRoom.mutate()}
            />
          </View>
        ) : null}
      </View>
      <FlatList
        key={columns}
        numColumns={columns}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        data={displayParticipants}
        keyExtractor={(participant) => participant.sid || participant.identity}
        renderItem={({ item }) => (
          <View style={styles.tileWrapper}>
            <ParticipantTile
              participant={item}
              displayName={getProfileName(
                profiles.get(item.identity),
                item.name || item.identity,
              )}
              avatarUrl={getProfileAvatarUrl(profiles.get(item.identity))}
              pinned={item.identity === pinnedIdentity}
              onPress={() =>
                setPinnedIdentity(
                  item.identity === pinnedIdentity ? null : item.identity,
                )
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Подключение устанавливается</Text>
            <Text style={styles.emptyText}>
              Участники появятся после подключения к комнате.
            </Text>
          </View>
        }
      />
      <View style={{ paddingBottom: insets.bottom }}>
        <RoomControls
          cameraEnabled={cameraEnabled}
          microphoneEnabled={microphoneEnabled}
          onCamera={() => void toggleCamera()}
          onMicrophone={() => void toggleMicrophone()}
          onDisconnect={() => void leaveRoom()}
          onParticipants={() => participantsSheetRef.current?.present()}
          onChat={() => chatSheetRef.current?.present()}
        />
      </View>
      <ParticipantsSheet
        ref={participantsSheetRef}
        participants={participants}
        profiles={profiles}
        pinnedIdentity={pinnedIdentity}
        canManageRoom={room?.can_manage}
        onPin={setPinnedIdentity}
        onKick={(identity) => moderatorAction.mutate({ action: "kick", identity })}
        onMute={(identity) => moderatorAction.mutate({ action: "mute", identity })}
        onUnmute={(identity) =>
          moderatorAction.mutate({ action: "unmute", identity })
        }
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    padding: 16,
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  text: {
    color: "#4b5563",
    fontSize: 14,
    marginTop: 8,
  },
  headerAction: {
    alignItems: "flex-start",
    marginTop: 12,
  },
  grid: {
    gap: 12,
    padding: 12,
    flexGrow: 1,
  },
  gridRow: {
    gap: 12,
  },
  tileWrapper: {
    flex: 1,
  },
  empty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
});
