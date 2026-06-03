import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export function RoomRouteScreen() {
  const { roomId, join } = useLocalSearchParams<{
    roomId: string;
    join?: string;
  }>();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Room scaffold</Text>
      <Text style={styles.text}>roomId: {roomId}</Text>
      {join === "true" ? <Text style={styles.text}>auto join requested</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
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
