import {
  mediaDevices,
  RTCView,
  type MediaStream,
} from "@livekit/react-native-webrtc";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { idApi } from "@/api/idApi";
import { useAuthStore } from "@/auth/authStore";
import { AppButton } from "@/components/AppButton";
import { IconCamera, IconClose, IconMicrophone } from "@/components/icons";
import { IconCircleButton } from "@/components/ui";
import { env } from "@/config/env";
import { useLiveKitStore } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cameraEnabled = useLiveKitStore((state) => state.cameraEnabled);
  const microphoneEnabled = useLiveKitStore((state) => state.microphoneEnabled);
  const toggleCamera = useLiveKitStore((state) => state.toggleCamera);
  const toggleMicrophone = useLiveKitStore((state) => state.toggleMicrophone);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => idApi.readPublicProfile(user?.id ?? ""),
    enabled: !!user?.id,
  });
  const profile = profileQuery.data;
  const displayName = getProfileName(profile, user?.name ?? user?.username ?? "Пользователь");
  const avatarUrl = getProfileAvatarUrl(profile);

  useEffect(() => {
    let cancelled = false;
    let preview: MediaStream | null = null;

    async function startPreview() {
      try {
        const nextStream = await mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
        if (cancelled) {
          stopStream(nextStream);
          return;
        }
        preview = nextStream;
        setStream(nextStream);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Камера недоступна",
          text2: error instanceof Error ? error.message : "Проверьте разрешения",
        });
      }
    }

    if (cameraEnabled) {
      void startPreview();
    } else {
      setStream(null);
    }

    return () => {
      cancelled = true;
      if (preview) stopStream(preview);
    };
  }, [cameraEnabled]);

  async function requestAccess() {
    try {
      const permissionStream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      stopStream(permissionStream);
      if (!cameraEnabled) await toggleCamera();
      if (!microphoneEnabled) await toggleMicrophone();
      Toast.show({ type: "success", text1: "Доступ к медиа получен" });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Не удалось получить доступ",
        text2: error instanceof Error ? error.message : "Проверьте разрешения",
      });
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <View style={styles.modal}>
      <View style={styles.header}>
        <Text style={styles.title}>Настройки</Text>
        <IconCircleButton
          accessibilityLabel="Закрыть"
          size={32}
          tone="light"
          onPress={() => router.back()}
        >
          <IconClose color={colors.secondary} size={18} />
        </IconCircleButton>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.preview}>
          {cameraEnabled && stream ? (
            <RTCView mirror objectFit="cover" streamURL={stream.toURL()} style={styles.video} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.previewAvatar} />
          ) : (
            <View style={styles.initialCircle}>
              <Text style={styles.initial}>{displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.account}>
          <Text numberOfLines={1} style={styles.accountName}>
            {displayName}
          </Text>
          <Text numberOfLines={1} style={styles.accountMeta}>
            {user?.email ?? user?.username ?? ""}
          </Text>
          <Pressable onPress={() => void onLogout()}>
            <Text style={styles.logoutText}>Выйти</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Видео</Text>
          <SettingRow
            icon={<IconCamera color={colors.primary} size={20} />}
            label={cameraEnabled ? "Фронтальная камера" : "Камера выключена"}
            value={cameraEnabled}
            onChange={() => void toggleCamera()}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Аудио</Text>
          <SettingRow
            icon={<IconMicrophone color={colors.primary} size={20} />}
            label={microphoneEnabled ? "Микрофон включен" : "Микрофон выключен"}
            value={microphoneEnabled}
            onChange={() => void toggleMicrophone()}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Подключения</Text>
          <InfoRow label="VKS API" value={env.vksApiUrl} />
          <InfoRow label="ID API" value={env.idApiUrl} />
          <InfoRow label="Keycloak" value={`${env.keycloakUrl}/realms/${env.keycloakRealm}`} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => void requestAccess()}>
          <Text style={styles.linkButton}>Запросить доступ</Text>
        </Pressable>
        <AppButton title="Закрыть" onPress={() => router.back()} />
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        onValueChange={onChange}
        thumbColor={value ? colors.primary : colors.surface}
        trackColor={{ false: colors.secondaryLight, true: colors.primaryOutline }}
        value={value}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} selectable style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
  stream.release();
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xxl,
    paddingBottom: 120,
  },
  preview: {
    alignItems: "center",
    aspectRatio: 327 / 518,
    backgroundColor: colors.placeholder,
    borderRadius: radius.lg,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  previewAvatar: {
    borderRadius: 56,
    height: 112,
    width: 112,
  },
  initialCircle: {
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 56,
    height: 112,
    justifyContent: "center",
    width: 112,
  },
  initial: {
    color: colors.primaryDark,
    fontSize: 42,
    fontWeight: "800",
  },
  account: {
    gap: spacing.xs,
  },
  accountName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  accountMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutText: {
    ...typography.captionStrong,
    color: colors.errorActive,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  settingRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  settingIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  infoRow: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    gap: spacing.xs,
    padding: spacing.md,
  },
  infoLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  footer: {
    alignItems: "center",
    backgroundColor: colors.surface,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    padding: spacing.xxl,
    position: "absolute",
    right: 0,
  },
  linkButton: {
    ...typography.button,
    color: colors.primary,
  },
});
