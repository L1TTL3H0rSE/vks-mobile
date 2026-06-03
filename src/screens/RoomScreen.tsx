import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { vksApi } from "@/api/vksApi";
import { ChatSheet } from "@/components/ChatSheet";
import { ParticipantTile } from "@/components/ParticipantTile";
import { ParticipantsSheet } from "@/components/ParticipantsSheet";
import { RoomControls } from "@/components/RoomControls";
import { useLiveKitStore } from "@/livekit/livekitStore";

type RoomScreenProps = {
  roomId: string;
};

export function RoomScreen({ roomId }: RoomScreenProps) {
  const insets = useSafeAreaInsets();
  const participantsSheetRef = useRef<BottomSheetModal>(null);
  const chatSheetRef = useRef<BottomSheetModal>(null);
  const participants = useLiveKitStore((state) => state.participants);
  const messages = useLiveKitStore((state) => state.messages);
  const local = useLiveKitStore((state) => state.local);
  const cameraEnabled = useLiveKitStore((state) => state.cameraEnabled);
  const microphoneEnabled = useLiveKitStore((state) => state.microphoneEnabled);
  const pinnedIdentity = useLiveKitStore((state) => state.pinnedIdentity);
  const toggleCamera = useLiveKitStore((state) => state.toggleCamera);
  const toggleMicrophone = useLiveKitStore((state) => state.toggleMicrophone);
  const setPinnedIdentity = useLiveKitStore((state) => state.setPinnedIdentity);
  const sendMessage = useLiveKitStore((state) => state.sendMessage);
  const disconnect = useLiveKitStore((state) => state.disconnect);
  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await vksApi.getRoomById(roomId)).data,
  });

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
      action: "kick" | "mic" | "cam" | "screen";
      identity: string;
    }) => {
      switch (action) {
        case "kick":
          return vksApi.kickUser(roomId, identity);
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
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.title}>
          Комната {roomId}
        </Text>
        <Text style={styles.text}>{participants.length} онлайн</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.grid}
        data={displayParticipants}
        keyExtractor={(participant) => participant.sid || participant.identity}
        renderItem={({ item }) => (
          <ParticipantTile
            participant={item}
            pinned={item.identity === pinnedIdentity}
            onPress={() =>
              setPinnedIdentity(item.identity === pinnedIdentity ? null : item.identity)
            }
          />
        )}
      />
      <View style={{ paddingBottom: insets.bottom }}>
        <RoomControls
          cameraEnabled={cameraEnabled}
          microphoneEnabled={microphoneEnabled}
          onCamera={() => void toggleCamera()}
          onMicrophone={() => void toggleMicrophone()}
          onDisconnect={() => void disconnect()}
          onParticipants={() => participantsSheetRef.current?.present()}
          onChat={() => chatSheetRef.current?.present()}
        />
      </View>
      <ParticipantsSheet
        ref={participantsSheetRef}
        participants={participants}
        pinnedIdentity={pinnedIdentity}
        canManageRoom={roomQuery.data?.can_manage}
        onPin={setPinnedIdentity}
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
  grid: {
    gap: 12,
    padding: 12,
  },
});
