import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Profile } from "@/api/types";
import { IconSend } from "@/components/icons";
import type { ChatMessage } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getProfileName } from "@/utils/profile";

type ChatSheetProps = {
  messages: ChatMessage[];
  localIdentity?: string;
  profiles: Map<string, Profile>;
  onSend: (text: string) => void;
};

export const ChatSheet = forwardRef<BottomSheetModal, ChatSheetProps>(
  ({ messages, localIdentity, profiles, onSend }, ref) => {
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
            const profileName = getProfileName(
              profiles.get(item.fromIdentity),
              item.fromIdentity,
            );
            return (
              <View style={[styles.message, mine ? styles.mine : styles.other]}>
                <Text style={styles.author}>{mine ? "Вы" : profileName}</Text>
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
            placeholderTextColor={colors.textPlaceholder}
            style={styles.input}
            value={text}
          />
          <Pressable style={styles.sendButton} onPress={submit}>
            <IconSend color={colors.textLight} size={19} />
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

ChatSheet.displayName = "ChatSheet";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  message: {
    borderRadius: radius.md,
    maxWidth: "86%",
    padding: spacing.md,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.backgroundSecondary,
  },
  other: {
    alignSelf: "flex-start",
    backgroundColor: colors.placeholder,
  },
  author: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  empty: {
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  inputRow: {
    alignItems: "center",
    borderTopColor: colors.secondaryBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
});
