import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export function LobbyScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Kosygin VCS</Text>
      <Text style={styles.text}>Lobby scaffold ready for port.</Text>
      <Link href="/settings" style={styles.link}>
        Settings
      </Link>
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
    fontSize: 28,
    fontWeight: "700",
  },
  text: {
    color: "#4b5563",
    fontSize: 16,
    marginTop: 8,
  },
  link: {
    color: "#2563eb",
    fontSize: 16,
    marginTop: 24,
  },
});
