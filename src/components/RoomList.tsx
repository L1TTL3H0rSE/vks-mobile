import * as Clipboard from "expo-clipboard";
import { Link, router } from "expo-router";
import { Copy, Play, Search, Trash2 } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import type { Room } from "@/api/types";
import { IconCircleButton } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getRoomLink } from "@/utils/links";

type RoomListProps = {
  rooms: Room[];
  search: string;
  onSearchChange: (value: string) => void;
  onDelete: (room: Room) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function RoomList({
  rooms,
  search,
  onSearchChange,
  onDelete,
  refreshing,
  onRefresh,
}: RoomListProps) {
  async function copyRoomLink(room: Room) {
    await Clipboard.setStringAsync(getRoomLink(room.id));
    Toast.show({
      type: "success",
      text1: "Ссылка скопирована",
      text2: "Отправьте ссылку участникам встречи",
    });
  }

  function joinRoom(room: Room) {
    router.push({
      pathname: "/rooms/[roomId]",
      params: room.can_manage
        ? { roomId: room.id, join: "true" }
        : { roomId: room.id },
    });
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchBox}>
        <Search color={colors.textSecondary} size={19} />
        <TextInput
          autoCapitalize="none"
          clearButtonMode="while-editing"
          onChangeText={onSearchChange}
          placeholder="Найти комнату"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.search}
          value={search}
        />
      </View>
      <FlatList
        contentContainerStyle={rooms.length === 0 ? styles.emptyList : styles.list}
        data={rooms}
        keyExtractor={(room) => room.id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable style={styles.itemMain} onPress={() => joinRoom(item)}>
              <Text numberOfLines={1} style={styles.itemTitle}>
                {item.name}
              </Text>
              <Text style={styles.itemMeta}>
                {item.hidden ? "Доступ по ссылке" : "Доступная комната"}
              </Text>
            </Pressable>
            <View style={styles.actions}>
              <IconCircleButton
                accessibilityLabel="Войти"
                size={38}
                onPress={() => joinRoom(item)}
              >
                <Play color={colors.textLight} size={18} />
              </IconCircleButton>
              <IconCircleButton
                accessibilityLabel="Скопировать ссылку"
                tone="light"
                size={38}
                onPress={() => void copyRoomLink(item)}
              >
                <Copy color={colors.primaryDark} size={18} />
              </IconCircleButton>
              {item.can_manage ? (
                <IconCircleButton
                  accessibilityLabel="Удалить"
                  tone="danger"
                  size={38}
                  onPress={() => onDelete(item)}
                >
                  <Trash2 color={colors.textLight} size={18} />
                </IconCircleButton>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Комнат нет</Text>
            <Text style={styles.emptyText}>
              {search.trim()
                ? "Попробуйте изменить поиск"
                : "Доступные комнаты появятся здесь"}
            </Text>
            <Link href="/settings" style={styles.emptyLink}>
              Настройки
            </Link>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: spacing.lg,
    minHeight: 0,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  search: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: 0,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  item: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    paddingVertical: spacing.sm,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  empty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  emptyLink: {
    ...typography.button,
    color: colors.primary,
    marginTop: spacing.lg,
  },
});
