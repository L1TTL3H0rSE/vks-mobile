import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/auth/authStore";
import { idApi } from "@/api/idApi";
import { vksApi } from "@/api/vksApi";
import type { Room } from "@/api/types";
import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { IconLogout } from "@/components/icons";
import { LocalPreviewCard } from "@/components/LocalPreviewCard";
import { RoomFormModal } from "@/components/RoomFormModal";
import { RoomList } from "@/components/RoomList";
import { IconCircleButton, Screen, StateView } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/theme/tokens";

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
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => idApi.readPublicProfile(user?.id ?? ""),
    enabled: isAuthenticated && !!user?.id,
  });

  const createRoom = useMutation({
    mutationFn: async () =>
      vksApi.createRoom({ name: roomName.trim(), hidden: true }),
    onSuccess: async () => {
      setCreateVisible(false);
      setRoomName("");
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
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <LocalPreviewCard
              profile={profileQuery.data}
              user={user}
              onSettings={() => router.push("/settings")}
            />

            <View style={styles.roomsPanel}>
              <View style={styles.panelTop}>
                <View style={styles.panelText}>
                  <Text style={styles.sectionTitle}>
                    {roomsQuery.data?.length
                      ? canCreate
                        ? "Ваши комнаты"
                        : "Доступные комнаты"
                      : canCreate
                        ? "Создайте комнату для занятий"
                        : "Доступные комнаты"}
                  </Text>
                  <Text style={styles.panelDescription}>
                    {roomsQuery.data?.length
                      ? canCreate
                        ? "Комнаты, доступные для ваших студентов. Можно создать дополнительные"
                        : "Комнаты, доступные для вас. Если нужной нет, присоединяйтесь по ссылке от преподавателя"
                      : canCreate
                        ? "У вас пока нет созданных комнат. Добавьте новую и отправьте ссылку студентам"
                        : "У вас нет доступных комнат. Вы сможете присоединиться к конференции только по прямой ссылке"}
                  </Text>
                </View>
                <IconCircleButton
                  accessibilityLabel="Выйти"
                  tone="light"
                  size={34}
                  onPress={() => void logout()}
                >
                  <IconLogout color={colors.primaryDark} size={17} />
                </IconCircleButton>
              </View>
              {canCreate ? (
                <AppButton
                  title="Создать"
                  style={styles.createButton}
                  onPress={() => setCreateVisible(true)}
                />
              ) : null}
              {roomsQuery.isLoading ? (
                <StateView title="Загрузка комнат" loading />
              ) : roomsQuery.isError ? (
                <StateView
                  title="Не удалось загрузить комнаты"
                  text="Проверьте подключение и попробуйте еще раз"
                  action={<AppButton title="Повторить" onPress={() => void roomsQuery.refetch()} />}
                />
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
            </View>

            <View style={styles.footer}>
              <View style={styles.logoRow}>
                <View style={styles.logoMark} />
                <Text style={styles.logoText}>УНИВЕРСИТЕТ{"\n"}КОСЫГИНА</Text>
              </View>
              <Text style={styles.footerText}>
                119071, г. Москва, ул. Малая Калужская, д.1
              </Text>
              <Text style={styles.footerText}>
                © 2022-2024 ФГБОУ ВО РГУ им. А.Н. Косыгина
              </Text>
              <FooterSection
                title="Наши сервисы"
                items={["Расписание", "Онлайн образование", "Рейтинг активности"]}
              />
              <FooterSection
                title="О нас"
                items={[
                  "Документация университета",
                  "Пользовательское соглашение",
                  "Политика конфиденциальности",
                ]}
              />
              <FooterSection title="Социальные сети" items={["VK", "Telegram", "Rutube"]} />
              <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Техподдержка</Text>
                <Text style={styles.footerText}>Почта: cit@rguk.ru</Text>
                <Text style={styles.footerText}>Телеграмм: @kosygineco</Text>
              </View>
            </View>
          </ScrollView>
          <RoomFormModal
            visible={createVisible}
            title="Создать комнату"
            name={roomName}
            loading={createRoom.isPending}
            onNameChange={setRoomName}
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

function FooterSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.footerSection}>
      <Text style={styles.footerTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.footerText}>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  roomsPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.lg,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  panelTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  panelText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  panelDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  createButton: {
    width: "100%",
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
  footer: {
    backgroundColor: colors.surface,
    gap: spacing.lg,
    marginHorizontal: -spacing.xl,
    marginBottom: -spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  logoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  logoMark: {
    borderBottomColor: "transparent",
    borderBottomWidth: 12,
    borderLeftColor: colors.primary,
    borderLeftWidth: 22,
    borderTopColor: "transparent",
    borderTopWidth: 12,
    height: 0,
    width: 0,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  footerText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  footerSection: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footerTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
