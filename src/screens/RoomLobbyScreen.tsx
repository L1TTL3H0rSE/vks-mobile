import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import Toast from "react-native-toast-message";
import { idApi } from "@/api/idApi";
import { vksApi } from "@/api/vksApi";
import { useAuthStore } from "@/auth/authStore";
import { AppButton } from "@/components/AppButton";
import { LocalPreviewCard } from "@/components/LocalPreviewCard";
import { Screen, StateView } from "@/components/ui";
import { useLiveKitStore } from "@/livekit/livekitStore";
import { spacing } from "@/theme/tokens";

type RoomLobbyScreenProps = {
  roomId: string;
  autoJoin?: boolean;
};

export function RoomLobbyScreen({
  roomId,
  autoJoin = false,
}: RoomLobbyScreenProps) {
  const autoJoinStarted = useRef(false);
  const user = useAuthStore((state) => state.user);
  const connect = useLiveKitStore((state) => state.connect);
  const isConnecting = useLiveKitStore((state) => state.isConnecting);
  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await vksApi.getRoomById(roomId)).data,
    enabled: !!roomId,
  });
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => idApi.readPublicProfile(user?.id ?? ""),
    enabled: !!user?.id,
  });

  const joinRoom = useMutation({
    mutationFn: async () => (await vksApi.getRoomToken(roomId)).data,
    onSuccess: async (token) => {
      await connect(token.url, token.token, roomId);
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
          action={
            <AppButton
              title="Повторить"
              onPress={() => void roomQuery.refetch()}
            />
          }
        />
      </Screen>
    );
  }

  const room = roomQuery.data;

  return (
    <Screen style={{ padding: spacing.xl }}>
      <LocalPreviewCard
        profile={profileQuery.data}
        roomName={room?.name ?? "Комната"}
        user={user}
        joinLoading={joinRoom.isPending || isConnecting}
        onJoin={() => joinRoom.mutate()}
        onSettings={() => router.push("/settings")}
      />
    </Screen>
  );
}
