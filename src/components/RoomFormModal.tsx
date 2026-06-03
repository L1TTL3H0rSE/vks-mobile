import { Modal, StyleSheet, Text, TextInput, View } from "react-native";
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
            placeholderTextColor="#9ca3af"
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
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    gap: 14,
    maxWidth: 420,
    padding: 18,
    width: "100%",
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  input: {
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
});
