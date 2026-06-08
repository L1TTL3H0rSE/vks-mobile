import {
  mediaDevices,
  RTCView,
  type MediaStream,
} from "@livekit/react-native-webrtc";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useQuery } from "@tanstack/react-query";
import { idApi } from "@/api/idApi";
import { useAuthStore } from "@/auth/authStore";
import { AppButton } from "@/components/AppButton";
import { IconArrowDown, IconClose } from "@/components/icons";
import { IconCircleButton } from "@/components/ui";
import { useLiveKitStore } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type VideoDevice = {
  deviceId: string;
  label?: string;
  kind: string;
};

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const selectedVideoDeviceId = useLiveKitStore(
    (state) => state.selectedVideoDeviceId,
  );
  const setSelectedVideoDeviceId = useLiveKitStore(
    (state) => state.setSelectedVideoDeviceId,
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectOpen, setSelectOpen] = useState(false);
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => idApi.readPublicProfile(user?.id ?? ""),
    enabled: !!user?.id,
  });
  const profile = profileQuery.data;
  const displayName = getProfileName(
    profile,
    user?.name ?? user?.username ?? "Пользователь",
  );
  const avatarUrl = getProfileAvatarUrl(profile);
  const selectedDevice = useMemo(
    () =>
      devices.find((device) => device.deviceId === selectedVideoDeviceId) ??
      devices[0],
    [devices, selectedVideoDeviceId],
  );

  useEffect(() => {
    let active = true;

    async function loadDevices() {
      try {
        const result = (await mediaDevices.enumerateDevices()) as VideoDevice[];
        const videoDevices = result.filter(
          (device) => device.kind === "videoinput",
        );
        if (!active) return;

        setDevices(videoDevices);
        if (!selectedVideoDeviceId && videoDevices[0]) {
          void setSelectedVideoDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Не удалось получить список камер",
          text2: error instanceof Error ? error.message : String(error),
        });
      }
    }

    void loadDevices();
    return () => {
      active = false;
    };
  }, [selectedVideoDeviceId, setSelectedVideoDeviceId]);

  useEffect(() => {
    let cancelled = false;
    let preview: MediaStream | null = null;

    async function startPreview() {
      try {
        const nextStream = await mediaDevices.getUserMedia({
          audio: false,
          video: selectedDevice?.deviceId
            ? { deviceId: selectedDevice.deviceId }
            : { facingMode: "user" },
        });
        if (cancelled) {
          stopStream(nextStream);
          return;
        }
        preview = nextStream;
        setStream(nextStream);
      } catch (error) {
        setStream(null);
        Toast.show({
          type: "error",
          text1: "Камера недоступна",
          text2: error instanceof Error ? error.message : "Проверьте разрешения",
        });
      }
    }

    void startPreview();
    return () => {
      cancelled = true;
      if (preview) stopStream(preview);
    };
  }, [selectedDevice?.deviceId]);

  async function requestAccess() {
    try {
      const permissionStream = await mediaDevices.getUserMedia({
        audio: true,
        video: selectedDevice?.deviceId
          ? { deviceId: selectedDevice.deviceId }
          : { facingMode: "user" },
      });
      stopStream(permissionStream);
      const result = (await mediaDevices.enumerateDevices()) as VideoDevice[];
      setDevices(result.filter((device) => device.kind === "videoinput"));
      Toast.show({ type: "success", text1: "Доступ к медиа получен" });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Не удалось получить доступ",
        text2: error instanceof Error ? error.message : "Проверьте разрешения",
      });
    }
  }

  async function selectDevice(device: VideoDevice) {
    setSelectOpen(false);
    try {
      await setSelectedVideoDeviceId(device.deviceId);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Не удалось выбрать камеру",
        text2: error instanceof Error ? error.message : String(error),
      });
    }
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.preview}>
          {stream ? (
            <RTCView
              mirror
              objectFit="cover"
              streamURL={stream.toURL()}
              style={styles.video}
            />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.previewAvatar} />
          ) : (
            <View style={styles.initialCircle}>
              <Text style={styles.initial}>
                {displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.selectBlock}>
          <Text style={styles.label}>Видео</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.select,
              pressed ? styles.pressed : null,
            ]}
            onPress={() => setSelectOpen((value) => !value)}
          >
            <Text numberOfLines={1} style={styles.selectText}>
              {getDeviceLabel(selectedDevice, 0)}
            </Text>
            <IconArrowDown color={colors.textPlaceholder} size={20} />
          </Pressable>

          {selectOpen ? (
            <View style={styles.options}>
              {devices.length > 0 ? (
                devices.map((device, index) => (
                  <Pressable
                    key={device.deviceId}
                    style={({ pressed }) => [
                      styles.option,
                      device.deviceId === selectedDevice?.deviceId
                        ? styles.optionActive
                        : null,
                      pressed ? styles.pressed : null,
                    ]}
                    onPress={() => void selectDevice(device)}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.optionText,
                        device.deviceId === selectedDevice?.deviceId
                          ? styles.optionTextActive
                          : null,
                      ]}
                    >
                      {getDeviceLabel(device, index)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.option}>
                  <Text style={styles.optionText}>Камеры не найдены</Text>
                </View>
              )}
            </View>
          ) : null}
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

function getDeviceLabel(device: VideoDevice | undefined, index: number) {
  if (!device) return "Фронтальная камера";
  if (device.label) return device.label;
  return index === 0 ? "Фронтальная камера" : `Камера ${index + 1}`;
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
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
    paddingBottom: 120,
  },
  preview: {
    alignItems: "center",
    aspectRatio: 380 / 518,
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
  selectBlock: {
    gap: 6,
    width: "100%",
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  select: {
    alignItems: "center",
    borderColor: colors.secondaryBorder,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  selectText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  options: {
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  option: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  optionActive: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  optionTextActive: {
    color: colors.primary,
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.76,
  },
});
