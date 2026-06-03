import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { vksApi } from "@/api/vksApi";
import { AppButton } from "@/components/AppButton";
import { Card, Screen, StateView } from "@/components/ui";
import { useLiveKitStore } from "@/livekit/livekitStore";
import { colors, spacing, typography } from "@/theme/tokens";

type RoomLobbyScreenProps = {
  roomId: string;
  autoJoin?: boolean;
};

export function RoomLobbyScreen({ roomId, autoJoin = false }: RoomLobbyScreenProps) {
  const autoJoinStarted = useRef(false);
  const connect = useLiveKitStore((state) => state.connect);
  const isConnecting = useLiveKitStore((state) => state.isConnecting);
  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await vksApi.getRoomById(roomId)).data,
    enabled: !!roomId,
  });

  const joinRoom = useMutation({
    mutationFn: async () => (await vksApi.getRoomToken(roomId)).data,
    onSuccess: async (token) => {
      await connect(token.url, token.token);
      Toast.show({
        type: "success",
        text1: "Вы вошли в комнату",
        text2: token.roomName,
      });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Не удалось получить токен для входа",
        text2: err instanceof Error ? err.message : String(err),
      });
    },
  });

  useEffect(() => {
    if (!autoJoin || autoJoinStarted.current || !roomQuery.data) return;
    autoJoinStarted.current = true;
    joinRoom.mutate();
  }, [autoJoin, joinRoom, roomQuery.data]);

  if (roomQuery.isLoading) {
    return (
      <Screen>
        <StateView title="Загрузка комнаты" loading />
      </Screen>
    );
  }

  if (roomQuery.isError) {
    return (
      <Screen>
        <StateView
          title="Комната недоступна"
          text={
            roomQuery.error instanceof Error
              ? roomQuery.error.message
              : "Ошибка при загрузке информации о комнате"
          }
          action={<AppButton title="Повторить" onPress={() => void roomQuery.refetch()} />}
        />
      </Screen>
    );
  }

  const room = roomQuery.data;

  return (
    <Screen style={styles.screen}>
      <Card style={styles.card}>
        <View style={styles.preview}>
          <Text style={styles.previewInitial}>
            {(room?.name ?? "Комната").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.eyebrow}>
            {room?.hidden ? "Вход по ссылке" : "Открытая комната"}
          </Text>
        <Text style={styles.title}>{room?.name ?? "Комната"}</Text>
          <Text style={styles.text}>
            Камера и микрофон используют ваши сохраненные настройки.
          </Text>
        </View>
        <AppButton
          title="Войти"
          loading={joinRoom.isPending || isConnecting}
          onPress={() => joinRoom.mutate()}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    gap: spacing.lg,
    maxWidth: 440,
    width: "100%",
  },
  preview: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 48,
    height: 96,
    justifyContent: "center",
    width: 96,
  },
  previewInitial: {
    color: colors.primaryDark,
    fontSize: 42,
    fontWeight: "800",
  },
  eyebrow: {
    ...typography.captionStrong,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
