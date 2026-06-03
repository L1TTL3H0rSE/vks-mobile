import { LogOut, Mic, MicOff, Video, VideoOff } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

type RoomControlsProps = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  onCamera: () => void;
  onMicrophone: () => void;
  onDisconnect: () => void;
};

export function RoomControls({
  cameraEnabled,
  microphoneEnabled,
  onCamera,
  onMicrophone,
  onDisconnect,
}: RoomControlsProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityLabel="Микрофон"
        style={[styles.button, microphoneEnabled ? styles.active : styles.inactive]}
        onPress={onMicrophone}
      >
        {microphoneEnabled ? <Mic color="#fff" size={22} /> : <MicOff color="#fff" size={22} />}
      </Pressable>
      <Pressable
        accessibilityLabel="Камера"
        style={[styles.button, cameraEnabled ? styles.active : styles.inactive]}
        onPress={onCamera}
      >
        {cameraEnabled ? <Video color="#fff" size={22} /> : <VideoOff color="#fff" size={22} />}
      </Pressable>
      <Pressable
        accessibilityLabel="Выйти"
        style={[styles.button, styles.leave]}
        onPress={onDisconnect}
      >
        <LogOut color="#fff" size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    padding: 16,
  },
  button: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  active: {
    backgroundColor: "#2563eb",
  },
  inactive: {
    backgroundColor: "#6b7280",
  },
  leave: {
    backgroundColor: "#dc2626",
  },
});
