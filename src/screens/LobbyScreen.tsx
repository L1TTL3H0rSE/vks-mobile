import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Settings, LogOut, Plus } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/auth/authStore";
import { vksApi } from "@/api/vksApi";
import type { Room } from "@/api/types";
import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RoomFormModal } from "@/components/RoomFormModal";
import { RoomList } from "@/components/RoomList";
import { Card, IconCircleButton, Screen, StateView } from "@/components/ui";
import { colors, spacing, typography } from "@/theme/tokens";

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
    <Screen style={styles.screen}>
      {isLoading ? (
        <StateView title="Загрузка" text="Проверяем сессию" loading />
      ) : isAuthenticated ? (
        <>
          <Card style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Мобильная ВКС</Text>
              <Text style={styles.title}>Kosygin VCS</Text>
              <Text style={styles.text}>
                {user?.name ?? user?.username ?? "Вы авторизованы"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <IconCircleButton
                accessibilityLabel="Настройки"
                tone="light"
                onPress={() => router.push("/settings")}
              >
                <Settings color={colors.primaryDark} size={20} />
              </IconCircleButton>
              {canCreate ? (
                <IconCircleButton
                  accessibilityLabel="Создать"
                  onPress={() => setCreateVisible(true)}
                >
                  <Plus color={colors.textLight} size={22} />
                </IconCircleButton>
              ) : null}
              <IconCircleButton
                accessibilityLabel="Выйти"
                tone="light"
                onPress={() => void logout()}
              >
                <LogOut color={colors.primaryDark} size={20} />
              </IconCircleButton>
            </View>
          </Card>
          {roomsQuery.isLoading ? (
            <StateView title="Загрузка комнат" loading />
          ) : roomsQuery.isError ? (
            <StateView
              title="Не удалось загрузить комнаты"
              text="Проверьте подключение и попробуйте еще раз"
              action={<AppButton title="Повторить" onPress={() => void roomsQuery.refetch()} />}
            />
          ) : (
            <Card style={styles.roomsCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Комнаты</Text>
                <Text style={styles.sectionMeta}>{roomsQuery.data?.length ?? 0}</Text>
              </View>
              <RoomList
                rooms={roomsQuery.data ?? []}
                search={search}
                onSearchChange={setSearch}
                onDelete={setDeleteTarget}
                refreshing={roomsQuery.isRefetching}
                onRefresh={() => void roomsQuery.refetch()}
              />
            </Card>
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
        <ScrollView contentContainerStyle={styles.loginContent}>
          <Text style={styles.title}>Kosygin VCS</Text>
          <Text style={styles.text}>Войдите, чтобы увидеть доступные комнаты</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={() => void login()}>
            <Text style={styles.primaryButtonText}>Войти через Keycloak</Text>
          </Pressable>
          <View style={styles.loginSettings}>
            <AppButton
              title="Настройки"
              variant="ghost"
              onPress={() => router.push("/settings")}
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  eyebrow: {
    ...typography.captionStrong,
    color: colors.primary,
    textTransform: "uppercase",
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  roomsCard: {
    flex: 1,
    gap: spacing.md,
    minHeight: 0,
    padding: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionMeta: {
    ...typography.captionStrong,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    color: colors.primaryDark,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  primaryButton: {
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  error: {
    ...typography.captionStrong,
    color: colors.errorActive,
    marginTop: spacing.md,
    textAlign: "center",
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  loginSettings: {
    alignItems: "center",
    marginTop: spacing.md,
  },
});
