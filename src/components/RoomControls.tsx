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
import { StyleSheet, View } from "react-native";
import { colors, spacing } from "@/theme/tokens";
import { IconCircleButton } from "@/components/ui";

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
      <IconCircleButton
        accessibilityLabel="Микрофон"
        tone={microphoneEnabled ? "primary" : "muted"}
        size={44}
        onPress={onMicrophone}
      >
        {microphoneEnabled ? <Mic color={colors.textLight} size={21} /> : <MicOff color={colors.textLight} size={21} />}
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Камера"
        tone={cameraEnabled ? "primary" : "muted"}
        size={44}
        onPress={onCamera}
      >
        {cameraEnabled ? <Video color={colors.textLight} size={21} /> : <VideoOff color={colors.textLight} size={21} />}
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Участники"
        tone="secondary"
        size={44}
        onPress={onParticipants}
      >
        <Users color={colors.textLight} size={21} />
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Чат"
        tone="secondary"
        size={44}
        onPress={onChat}
      >
        <MessageCircle color={colors.textLight} size={21} />
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Настройки"
        tone="secondary"
        size={44}
        onPress={onSettings}
      >
        <Settings color={colors.textLight} size={21} />
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Выйти"
        tone="danger"
        size={44}
        onPress={onDisconnect}
      >
        <LogOut color={colors.textLight} size={21} />
      </IconCircleButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderTopColor: colors.secondaryBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-around",
    padding: spacing.md,
  },
});
