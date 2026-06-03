import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { vksApi } from "@/api/vksApi";
import { AppButton } from "@/components/AppButton";

type RoomLobbyScreenProps = {
  roomId: string;
  autoJoin?: boolean;
};

export function RoomLobbyScreen({ roomId, autoJoin = false }: RoomLobbyScreenProps) {
  const autoJoinStarted = useRef(false);
  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await vksApi.getRoomById(roomId)).data,
    enabled: !!roomId,
  });

  const joinRoom = useMutation({
    mutationFn: async () => (await vksApi.getRoomToken(roomId)).data,
    onSuccess: (token) => {
      Toast.show({
        type: "success",
        text1: "Токен комнаты получен",
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
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.text}>Загрузка комнаты</Text>
      </View>
    );
  }

  if (roomQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Комната недоступна</Text>
        <Text style={styles.text}>
          {roomQuery.error instanceof Error
            ? roomQuery.error.message
            : "Ошибка при загрузке информации о комнате"}
        </Text>
        <AppButton title="Повторить" onPress={() => void roomQuery.refetch()} />
      </View>
    );
  }

  const room = roomQuery.data;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{room?.name ?? "Комната"}</Text>
        <Text style={styles.text}>
          {room?.hidden ? "Вход по ссылке" : "Доступная комната"}
        </Text>
        <AppButton
          title="Войти"
          loading={joinRoom.isPending}
          onPress={() => joinRoom.mutate()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  center: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    maxWidth: 440,
    padding: 20,
    width: "100%",
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
  },
  text: {
    color: "#4b5563",
    fontSize: 16,
  },
});
