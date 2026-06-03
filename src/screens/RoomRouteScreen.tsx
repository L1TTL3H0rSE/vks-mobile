import { useLocalSearchParams } from "expo-router";
import { RoomLobbyScreen } from "./RoomLobbyScreen";

export function RoomRouteScreen() {
  const { roomId, join } = useLocalSearchParams<{
    roomId: string;
    join?: string;
  }>();

  return <RoomLobbyScreen roomId={roomId} autoJoin={join === "true"} />;
}
