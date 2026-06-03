import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ParticipantTile } from "@/components/ParticipantTile";
import { RoomControls } from "@/components/RoomControls";
import { useLiveKitStore } from "@/livekit/livekitStore";

type RoomScreenProps = {
  roomId: string;
};

export function RoomScreen({ roomId }: RoomScreenProps) {
  const insets = useSafeAreaInsets();
  const participants = useLiveKitStore((state) => state.participants);
  const cameraEnabled = useLiveKitStore((state) => state.cameraEnabled);
  const microphoneEnabled = useLiveKitStore((state) => state.microphoneEnabled);
  const toggleCamera = useLiveKitStore((state) => state.toggleCamera);
  const toggleMicrophone = useLiveKitStore((state) => state.toggleMicrophone);
  const disconnect = useLiveKitStore((state) => state.disconnect);

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
        data={participants}
        keyExtractor={(participant) => participant.sid || participant.identity}
        renderItem={({ item }) => <ParticipantTile participant={item} />}
      />
      <View style={{ paddingBottom: insets.bottom }}>
        <RoomControls
          cameraEnabled={cameraEnabled}
          microphoneEnabled={microphoneEnabled}
          onCamera={() => void toggleCamera()}
          onMicrophone={() => void toggleMicrophone()}
          onDisconnect={() => void disconnect()}
        />
      </View>
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
