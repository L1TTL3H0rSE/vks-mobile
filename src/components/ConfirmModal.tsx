import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { IconClose } from "@/components/icons";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { AppButton } from "./AppButton";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmTitle: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  visible,
  title,
  description,
  confirmTitle,
  loading,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{description}</Text>
            </View>
            <Pressable accessibilityLabel="Закрыть" style={styles.closeButton} onPress={onClose}>
              <IconClose color={colors.secondary} size={18} />
            </Pressable>
          </View>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.actions}>
            <Pressable
              disabled={loading}
              style={({ pressed }) => [styles.textAction, pressed ? styles.pressed : null]}
              onPress={onConfirm}
            >
              <Text style={styles.dangerText}>{confirmTitle}</Text>
            </Pressable>
            <AppButton title="Отменить" loading={loading} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.24)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.xxxl,
    maxWidth: 514,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    width: "100%",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textAction: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dangerText: {
    ...typography.button,
    color: colors.errorActive,
  },
  pressed: {
    opacity: 0.76,
  },
});
