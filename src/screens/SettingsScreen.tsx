import { router } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useAuthStore } from "@/auth/authStore";
import { AppButton } from "@/components/AppButton";
import { env } from "@/config/env";
import { useLiveKitStore } from "@/livekit/livekitStore";

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cameraEnabled = useLiveKitStore((state) => state.cameraEnabled);
  const microphoneEnabled = useLiveKitStore((state) => state.microphoneEnabled);
  const toggleCamera = useLiveKitStore((state) => state.toggleCamera);
  const toggleMicrophone = useLiveKitStore((state) => state.toggleMicrophone);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Настройки</Text>
        <Text style={styles.subtitle}>
          Параметры применяются к следующему подключению и сохраняются на устройстве.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Аккаунт</Text>
        <InfoRow label="Пользователь" value={user?.name ?? user?.username ?? "Неизвестно"} />
        <InfoRow label="Email" value={user?.email ?? "Не указан"} />
        <View style={styles.actions}>
          <AppButton title="Выйти" variant="secondary" onPress={() => void logout()} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Медиа по умолчанию</Text>
        <SettingSwitch
          label="Камера"
          description="Включать камеру после входа в комнату"
          value={cameraEnabled}
          onChange={() => void toggleCamera()}
        />
        <SettingSwitch
          label="Микрофон"
          description="Включать микрофон после входа в комнату"
          value={microphoneEnabled}
          onChange={() => void toggleMicrophone()}
        />
        <Text style={styles.note}>
          Android или iOS запросят доступ к камере и микрофону при первом включении.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Подключения</Text>
        <InfoRow label="VKS API" value={env.vksApiUrl} />
        <InfoRow label="ID API" value={env.idApiUrl} />
        <InfoRow label="Keycloak" value={`${env.keycloakUrl}/realms/${env.keycloakRealm}`} />
        <InfoRow label="Redirect URI" value={env.keycloakRedirectUrl} />
      </View>

      <AppButton title="Назад" variant="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function SettingSwitch({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        onValueChange={onChange}
        thumbColor={value ? "#2563eb" : "#f3f4f6"}
        trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    color: "#111827",
    fontSize: 15,
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  switchText: {
    flex: 1,
    gap: 3,
  },
  switchLabel: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  switchDescription: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  note: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    alignItems: "flex-start",
  },
});
