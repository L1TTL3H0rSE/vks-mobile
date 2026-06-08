import { StyleSheet, View } from "react-native";
import {
  IconCallRemove,
  IconCamera,
  IconCameraSlash,
  IconMessage,
  IconMicrophone,
  IconMicrophoneSlash,
  IconSetting,
  IconUsers,
} from "@/components/icons";
import { colors, radius, spacing } from "@/theme/tokens";
import { IconCircleButton } from "@/components/ui";

type RoomControlsProps = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  bottomInset?: number;
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
  bottomInset = 0,
  onCamera,
  onMicrophone,
  onDisconnect,
  onParticipants,
  onChat,
  onSettings,
}: RoomControlsProps) {
  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(bottomInset, spacing.sm) }]}>
      <IconCircleButton
        accessibilityLabel="Микрофон"
        tone={microphoneEnabled ? "primary" : "muted"}
        size={36}
        onPress={onMicrophone}
      >
        {microphoneEnabled ? <IconMicrophone color={colors.textLight} size={20} /> : <IconMicrophoneSlash color={colors.textLight} size={20} />}
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Камера"
        tone={cameraEnabled ? "primary" : "muted"}
        size={36}
        onPress={onCamera}
      >
        {cameraEnabled ? <IconCamera color={colors.textLight} size={20} /> : <IconCameraSlash color={colors.textLight} size={20} />}
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Выйти"
        tone="danger"
        size={36}
        onPress={onDisconnect}
      >
        <IconCallRemove color={colors.textLight} size={20} />
      </IconCircleButton>
      <View style={styles.spacer} />
      <IconCircleButton
        accessibilityLabel="Участники"
        tone="primary"
        size={36}
        onPress={onParticipants}
      >
        <IconUsers color={colors.textLight} size={20} />
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Чат"
        tone="primary"
        size={36}
        onPress={onChat}
      >
        <IconMessage color={colors.textLight} size={20} />
      </IconCircleButton>
      <IconCircleButton
        accessibilityLabel="Настройки"
        tone="primary"
        size={36}
        onPress={onSettings}
      >
        <IconSetting color={colors.textLight} size={20} />
      </IconCircleButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  spacer: {
    flex: 1,
  },
});
