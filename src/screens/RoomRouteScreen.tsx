import { useLocalSearchParams } from "expo-router";
import { RoomLobbyScreen } from "./RoomLobbyScreen";
import { RoomScreen } from "./RoomScreen";
import { useLiveKitStore } from "@/livekit/livekitStore";

export function RoomRouteScreen() {
  const { roomId, join } = useLocalSearchParams<{
    roomId: string;
    join?: string;
  }>();
  const isConnected = useLiveKitStore(
    (state) => state.connectionState === "connected",
  );
  const connectedRoomId = useLiveKitStore((state) => state.connectedRoomId);

  if (isConnected && connectedRoomId === roomId) {
    return <RoomScreen roomId={roomId} />;
  }

  return <RoomLobbyScreen roomId={roomId} autoJoin={join === "true"} />;
}
