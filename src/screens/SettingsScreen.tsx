import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settings scaffold</Text>
      <Link href="/" style={styles.link}>
        Back to lobby
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
    fontSize: 24,
    fontWeight: "700",
  },
  link: {
    color: "#2563eb",
    fontSize: 16,
    marginTop: 24,
  },
});
