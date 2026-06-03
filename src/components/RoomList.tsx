import * as Clipboard from "expo-clipboard";
import { Link, router } from "expo-router";
import { Copy, Play, Trash2 } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import type { Room } from "@/api/types";
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
      <TextInput
        autoCapitalize="none"
        clearButtonMode="while-editing"
        onChangeText={onSearchChange}
        placeholder="Найти"
        placeholderTextColor="#9ca3af"
        style={styles.search}
        value={search}
      />
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
              <Pressable
                accessibilityLabel="Войти"
                style={styles.iconButton}
                onPress={() => joinRoom(item)}
              >
                <Play color="#fff" size={18} />
              </Pressable>
              <Pressable
                accessibilityLabel="Скопировать ссылку"
                style={styles.iconButton}
                onPress={() => void copyRoomLink(item)}
              >
                <Copy color="#fff" size={18} />
              </Pressable>
              {item.can_manage ? (
                <Pressable
                  accessibilityLabel="Удалить"
                  style={[styles.iconButton, styles.deleteButton]}
                  onPress={() => onDelete(item)}
                >
                  <Trash2 color="#fff" size={18} />
                </Pressable>
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
    gap: 12,
    minHeight: 0,
  },
  search: {
    backgroundColor: "#fff",
    borderColor: "#dbe3ef",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  item: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  itemMeta: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 22,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
  },
  empty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
  emptyLink: {
    color: "#2563eb",
    fontSize: 15,
    marginTop: 16,
  },
});
