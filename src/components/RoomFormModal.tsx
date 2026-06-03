import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { IconClose } from "@/components/icons";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { AppButton } from "./AppButton";

type RoomFormModalProps = {
  visible: boolean;
  title: string;
  name: string;
  loading?: boolean;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function RoomFormModal({
  visible,
  title,
  name,
  loading,
  onNameChange,
  onSubmit,
  onClose,
}: RoomFormModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              accessibilityLabel="Закрыть"
              style={styles.closeButton}
              onPress={onClose}
            >
              <IconClose color={colors.textSecondary} size={20} />
            </Pressable>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Название дисциплины</Text>
            <TextInput
              autoFocus
              onChangeText={onNameChange}
              placeholder="Укажите название"
              placeholderTextColor={colors.textPlaceholder}
              style={styles.input}
              value={name}
            />
          </View>
          <View style={styles.actions}>
            <AppButton title="Отмена" variant="ghost" onPress={onClose} />
            <AppButton
              title="Создать"
              loading={loading}
              disabled={!name.trim()}
              onPress={onSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: colors.darkOverlay,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.xxl,
    maxWidth: 420,
    padding: spacing.xxl,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    ...typography.caption,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "flex-end",
  },
});
