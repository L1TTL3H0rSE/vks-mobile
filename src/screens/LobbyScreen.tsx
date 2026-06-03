import { Link } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/auth/authStore";

export function LobbyScreen() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = status === "idle" || status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Kosygin VCS</Text>
      {isLoading ? (
        <ActivityIndicator color="#2563eb" size="large" />
      ) : isAuthenticated ? (
        <>
          <Text style={styles.text}>
            {user?.name ?? user?.username ?? "Вы авторизованы"}
          </Text>
          <Link href="/settings" style={styles.link}>
            Настройки
          </Link>
          <Pressable style={styles.secondaryButton} onPress={() => void logout()}>
            <Text style={styles.secondaryButtonText}>Выйти</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.text}>Войдите, чтобы увидеть доступные комнаты</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={() => void login()}>
            <Text style={styles.primaryButtonText}>Войти через Keycloak</Text>
          </Pressable>
        </>
      )}
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
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
