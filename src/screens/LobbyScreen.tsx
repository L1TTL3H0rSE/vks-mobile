import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, LogOut, Mic, Settings } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/auth/authStore";
import { vksApi } from "@/api/vksApi";
import type { Room } from "@/api/types";
import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RoomFormModal } from "@/components/RoomFormModal";
import { RoomList } from "@/components/RoomList";
import { IconCircleButton, Screen, StateView } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/theme/tokens";

const lobbyHero = require("../../assets/figma/lobby-hero.png");

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
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <ImageBackground
              imageStyle={styles.heroImage}
              resizeMode="cover"
              source={lobbyHero}
              style={styles.hero}
            >
              <View style={styles.heroShade} />
              <View style={styles.heroControls}>
                <View style={styles.callGroup}>
                  <IconCircleButton size={36}>
                    <Mic color={colors.textLight} size={18} />
                  </IconCircleButton>
                  <IconCircleButton size={36}>
                    <Camera color={colors.textLight} size={18} />
                  </IconCircleButton>
                </View>
                <IconCircleButton
                  accessibilityLabel="Настройки"
                  size={36}
                  style={styles.heroSettings}
                  onPress={() => router.push("/settings")}
                >
                  <Settings color={colors.textLight} size={18} />
                </IconCircleButton>
              </View>
            </ImageBackground>

            <View style={styles.roomsPanel}>
              <View style={styles.panelTop}>
                <View style={styles.panelText}>
                  <Text style={styles.sectionTitle}>Ваши комнаты</Text>
                  <Text style={styles.panelDescription}>
                    Комнаты, доступные для ваших студентов. Можно создать
                    дополнительные
                  </Text>
                </View>
                <IconCircleButton
                  accessibilityLabel="Выйти"
                  tone="light"
                  size={34}
                  onPress={() => void logout()}
                >
                  <LogOut color={colors.primaryDark} size={17} />
                </IconCircleButton>
              </View>
              {canCreate ? (
                <AppButton title="Создать" onPress={() => setCreateVisible(true)} />
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
            </View>
          </ScrollView>
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
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    aspectRatio: 335 / 531,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: spacing.md,
    width: "100%",
  },
  heroImage: {
    borderRadius: radius.lg,
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: radius.lg,
  },
  heroControls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  callGroup: {
    flexDirection: "row",
    gap: spacing.md,
  },
  heroSettings: {
    borderRadius: radius.md,
  },
  roomsPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.lg,
    overflow: "hidden",
    padding: spacing.xl,
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
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  panelDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
    gap: spacing.md,
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
});
