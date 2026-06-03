import { Modal, StyleSheet, Text, View } from "react-native";
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.actions}>
            <AppButton title="Отмена" variant="ghost" onPress={onClose} />
            <AppButton
              title={confirmTitle}
              variant="danger"
              loading={loading}
              onPress={onConfirm}
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
  description: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
});
