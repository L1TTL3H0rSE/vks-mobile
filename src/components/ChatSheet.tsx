import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { Send } from "lucide-react-native";
import { forwardRef, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "@/livekit/livekitStore";

type ChatSheetProps = {
  messages: ChatMessage[];
  localIdentity?: string;
  onSend: (text: string) => void;
};

export const ChatSheet = forwardRef<BottomSheetModal, ChatSheetProps>(
  ({ messages, localIdentity, onSend }, ref) => {
    const [text, setText] = useState("");
    const snapPoints = useMemo(() => ["45%", "80%"], []);

    function submit() {
      const trimmed = text.trim();
      if (!trimmed) return;
      onSend(trimmed);
      setText("");
    }

    return (
      <BottomSheetModal ref={ref} index={0} snapPoints={snapPoints}>
        <BottomSheetView style={styles.header}>
          <Text style={styles.title}>Чат</Text>
        </BottomSheetView>
        <BottomSheetFlatList
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(message) => message.id}
          renderItem={({ item }) => {
            const mine = item.fromIdentity === localIdentity;
            return (
              <View style={[styles.message, mine ? styles.mine : styles.other]}>
                <Text style={styles.author}>{mine ? "Вы" : item.fromIdentity}</Text>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Сообщений пока нет</Text>
            </View>
          }
        />
        <BottomSheetView style={styles.inputRow}>
          <BottomSheetTextInput
            onChangeText={setText}
            onSubmitEditing={submit}
            placeholder="Сообщение"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={text}
          />
          <Pressable style={styles.sendButton} onPress={submit}>
            <Send color="#fff" size={19} />
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

ChatSheet.displayName = "ChatSheet";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
  },
  list: {
    gap: 8,
    padding: 16,
  },
  message: {
    borderRadius: 8,
    maxWidth: "86%",
    padding: 10,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#dbeafe",
  },
  other: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
  },
  author: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  messageText: {
    color: "#111827",
    fontSize: 15,
    marginTop: 3,
  },
  empty: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 15,
  },
  inputRow: {
    alignItems: "center",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    flex: 1,
    fontSize: 16,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
});
