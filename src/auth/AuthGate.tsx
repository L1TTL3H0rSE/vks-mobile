import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "./authStore";

export function AuthGate() {
  const status = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    if (status === "idle") {
      void restoreSession();
    }
  }, [restoreSession, status]);

  if (status !== "idle" && status !== "loading") return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator color="#2563eb" size="large" />
      <Text style={styles.text}>Загрузка сессии</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: "#f8fafd",
    justifyContent: "center",
    zIndex: 10,
  },
  text: {
    color: "#4b5563",
    fontSize: 16,
    marginTop: 12,
  },
});
