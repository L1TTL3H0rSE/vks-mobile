import {
  LogOut,
  MessageCircle,
  Mic,
  MicOff,
  Settings,
  Users,
  Video,
  VideoOff,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

type RoomControlsProps = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  onCamera: () => void;
  onMicrophone: () => void;
  onDisconnect: () => void;
  onParticipants: () => void;
  onChat: () => void;
  onSettings: () => void;
};

export function RoomControls({
  cameraEnabled,
  microphoneEnabled,
  onCamera,
  onMicrophone,
  onDisconnect,
  onParticipants,
  onChat,
  onSettings,
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
        accessibilityLabel="Участники"
        style={[styles.button, styles.secondary]}
        onPress={onParticipants}
      >
        <Users color="#fff" size={22} />
      </Pressable>
      <Pressable
        accessibilityLabel="Чат"
        style={[styles.button, styles.secondary]}
        onPress={onChat}
      >
        <MessageCircle color="#fff" size={22} />
      </Pressable>
      <Pressable
        accessibilityLabel="Настройки"
        style={[styles.button, styles.secondary]}
        onPress={onSettings}
      >
        <Settings color="#fff" size={22} />
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
  secondary: {
    backgroundColor: "#374151",
  },
  leave: {
    backgroundColor: "#dc2626",
  },
});
