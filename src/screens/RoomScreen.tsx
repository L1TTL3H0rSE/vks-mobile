import { StyleSheet, Text, View } from "react-native";
import type { Room } from "@/api/types";

type RoomScreenProps = {
  room: Room;
};

export function RoomScreen({ room }: RoomScreenProps) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{room.name}</Text>
      <Text style={styles.text}>LiveKit room UI will render here.</Text>
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
  title: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
  },
  text: {
    color: "#4b5563",
    fontSize: 16,
    marginTop: 8,
  },
});
