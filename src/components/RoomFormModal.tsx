import { Modal, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { AppButton } from "./AppButton";

type RoomFormModalProps = {
  visible: boolean;
  title: string;
  name: string;
  hidden: boolean;
  loading?: boolean;
  onNameChange: (value: string) => void;
  onHiddenChange: (value: boolean) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function RoomFormModal({
  visible,
  title,
  name,
  hidden,
  loading,
  onNameChange,
  onHiddenChange,
  onSubmit,
  onClose,
}: RoomFormModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            autoFocus
            onChangeText={onNameChange}
            placeholder="Название комнаты"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.input}
            value={name}
          />
          <AppButton
            title={hidden ? "Доступ по ссылке" : "Открытая комната"}
            variant="secondary"
            onPress={() => onHiddenChange(!hidden)}
          />
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
    borderRadius: radius.md,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.xl,
    width: "100%",
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  input: {
    ...typography.body,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "flex-end",
  },
});
