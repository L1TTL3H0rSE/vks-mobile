import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/auth/authStore";
import { vksApi } from "@/api/vksApi";
import type { Room } from "@/api/types";
import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RoomFormModal } from "@/components/RoomFormModal";
import { RoomList } from "@/components/RoomList";

export function LobbyScreen() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = status === "idle" || status === "loading";
  const isAuthenticated = status === "authenticated";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createVisible, setCreateVisible] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomHidden, setRoomHidden] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const canCreate = useMemo(() => {
    if (!user) return false;
    const allowedRoles = [
      "/admins/vks",
      "/employees",
      "/employees/teachers",
      "/admins",
      "admins",
      "employees",
      "teachers",
    ];
    return allowedRoles.some((role) => user.roles.has(role));
  }, [user]);

  const roomsQuery = useQuery({
    queryKey: ["rooms", debouncedSearch],
    queryFn: async () => (await vksApi.getAvailableRooms(debouncedSearch)).data,
    enabled: isAuthenticated,
  });

  const createRoom = useMutation({
    mutationFn: async () =>
      vksApi.createRoom({ name: roomName.trim(), hidden: roomHidden }),
    onSuccess: async () => {
      setCreateVisible(false);
      setRoomName("");
      setRoomHidden(false);
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      Toast.show({ type: "success", text1: "Комната создана" });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Не удалось создать комнату",
        text2: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const deleteRoom = useMutation({
    mutationFn: async (room: Room) => vksApi.deleteRoom(room.id),
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      Toast.show({ type: "success", text1: "Комната удалена" });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Не удалось удалить комнату",
        text2: err instanceof Error ? err.message : String(err),
      });
    },
  });

  return (
    <View style={styles.screen}>
      {isLoading ? (
        <ActivityIndicator color="#2563eb" size="large" />
      ) : isAuthenticated ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Kosygin VCS</Text>
              <Text style={styles.text}>
                {user?.name ?? user?.username ?? "Вы авторизованы"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {canCreate ? (
                <AppButton title="Создать" onPress={() => setCreateVisible(true)} />
              ) : null}
              <AppButton title="Выйти" variant="secondary" onPress={() => void logout()} />
            </View>
          </View>
          {roomsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#2563eb" size="large" />
              <Text style={styles.text}>Загрузка комнат</Text>
            </View>
          ) : roomsQuery.isError ? (
            <View style={styles.center}>
              <Text style={styles.error}>Не удалось загрузить комнаты</Text>
              <AppButton title="Повторить" onPress={() => void roomsQuery.refetch()} />
            </View>
          ) : (
            <RoomList
              rooms={roomsQuery.data ?? []}
              search={search}
              onSearchChange={setSearch}
              onDelete={setDeleteTarget}
              refreshing={roomsQuery.isRefetching}
              onRefresh={() => void roomsQuery.refetch()}
            />
          )}
          <RoomFormModal
            visible={createVisible}
            title="Создать комнату"
            name={roomName}
            hidden={roomHidden}
            loading={createRoom.isPending}
            onNameChange={setRoomName}
            onHiddenChange={setRoomHidden}
            onClose={() => setCreateVisible(false)}
            onSubmit={() => createRoom.mutate()}
          />
          <ConfirmModal
            visible={!!deleteTarget}
            title="Удалить комнату"
            description={`Комната "${deleteTarget?.name ?? ""}" станет недоступна.`}
            confirmTitle="Удалить"
            loading={deleteRoom.isPending}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => {
              if (deleteTarget) deleteRoom.mutate(deleteTarget);
            }}
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>Kosygin VCS</Text>
          <Text style={styles.text}>Войдите, чтобы увидеть доступные комнаты</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={() => void login()}>
            <Text style={styles.primaryButtonText}>Войти через Keycloak</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
  },
  center: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end",
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  text: {
    color: "#4b5563",
    fontSize: 16,
    marginTop: 8,
  },
  primaryButton: {
    alignSelf: "center",
    backgroundColor: "#2563eb",
    borderRadius: 8,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
