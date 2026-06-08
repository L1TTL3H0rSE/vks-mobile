import {
  mediaDevices,
  RTCView,
  type MediaStream,
} from "@livekit/react-native-webrtc";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Toast from "react-native-toast-message";
import type { Profile } from "@/api/types";
import type { AuthUser } from "@/auth/authStore";
import {
  IconCamera,
  IconCameraSlash,
  IconMicrophone,
  IconMicrophoneSlash,
  IconSetting,
} from "@/components/icons";
import { IconCircleButton } from "@/components/ui";
import { useLiveKitStore } from "@/livekit/livekitStore";
import { colors, radius, spacing } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type LocalPreviewCardProps = {
  user: AuthUser | null;
  profile?: Profile;
  roomName?: string;
  joinLoading?: boolean;
  onJoin?: () => void;
  onSettings: () => void;
};

export function LocalPreviewCard({
  user,
  profile,
  roomName,
  joinLoading,
  onJoin,
  onSettings,
}: LocalPreviewCardProps) {
  const cameraEnabled = useLiveKitStore((state) => state.cameraEnabled);
  const microphoneEnabled = useLiveKitStore((state) => state.microphoneEnabled);
  const selectedVideoDeviceId = useLiveKitStore(
    (state) => state.selectedVideoDeviceId,
  );
  const toggleCamera = useLiveKitStore((state) => state.toggleCamera);
  const toggleMicrophone = useLiveKitStore((state) => state.toggleMicrophone);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { height, width } = useWindowDimensions();
  const isRoomLobby = !!roomName;
  const cardHeight = Math.max(360, Math.min(600, height - 310, width * 1.58));
  const displayName = getProfileName(
    profile,
    user?.name ?? user?.username ?? "Пользователь",
  );
  const lobbyName = useMemo(() => {
    const parts = [profile?.last_name, profile?.first_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : displayName;
  }, [displayName, profile?.first_name, profile?.last_name]);
  const avatarUrl = getProfileAvatarUrl(profile);

  useEffect(() => {
    let cancelled = false;
    let preview: MediaStream | null = null;

    async function startPreview() {
      try {
        const nextStream = await mediaDevices.getUserMedia({
          audio: false,
          video: selectedVideoDeviceId
            ? { deviceId: selectedVideoDeviceId }
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
        await toggleCamera();
        Toast.show({
          type: "error",
          text1: "Камера недоступна",
          text2:
            error instanceof Error ? error.message : "Проверьте разрешения",
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
  }, [cameraEnabled, selectedVideoDeviceId, toggleCamera]);

  async function onMicrophonePress() {
    if (!microphoneEnabled) {
      try {
        const permissionStream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        stopStream(permissionStream);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Микрофон недоступен",
          text2:
            error instanceof Error ? error.message : "Проверьте разрешения",
        });
        return;
      }
    }
    await toggleMicrophone();
  }

  return (
    <View style={[styles.card, isRoomLobby ? styles.roomLobbyCard : { height: cardHeight }]}>
      {cameraEnabled && stream ? (
        <RTCView
          mirror
          objectFit="cover"
          streamURL={stream.toURL()}
          style={styles.video}
        />
      ) : (
        <View style={styles.placeholder}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.initialCircle}>
              <Text style={styles.initial}>
                {displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.gradient} />
      {roomName ? (
        <View style={styles.lobbyText}>
          <Text numberOfLines={1} style={styles.name}>
            {lobbyName}
          </Text>
          <Text numberOfLines={1} style={styles.roomName}>
            {roomName}
          </Text>
        </View>
      ) : null}
      <View style={styles.controls}>
        <View style={styles.callGroup}>
          <IconCircleButton
            accessibilityLabel="Микрофон"
            size={36}
            tone={microphoneEnabled ? "primary" : "muted"}
            onPress={() => void onMicrophonePress()}
          >
            {microphoneEnabled ? (
              <IconMicrophone color={colors.textLight} size={18} />
            ) : (
              <IconMicrophoneSlash color={colors.textLight} size={18} />
            )}
          </IconCircleButton>
          <IconCircleButton
            accessibilityLabel="Камера"
            size={36}
            tone={cameraEnabled ? "primary" : "muted"}
            onPress={() => void toggleCamera()}
          >
            {cameraEnabled ? (
              <IconCamera color={colors.textLight} size={18} />
            ) : (
              <IconCameraSlash color={colors.textLight} size={18} />
            )}
          </IconCircleButton>
        </View>
        <View style={styles.rightControls}>
          {onJoin ? (
            <Pressable
              accessibilityRole="button"
              disabled={joinLoading}
              style={({ pressed }) => [
                styles.joinButton,
                joinLoading ? styles.disabled : null,
                pressed && !joinLoading ? styles.pressed : null,
              ]}
              onPress={onJoin}
            >
              <Text style={styles.joinText}>
                {joinLoading ? "Подключение" : "Подключиться"}
              </Text>
            </Pressable>
          ) : null}
          <IconCircleButton
            accessibilityLabel="Настройки"
            size={36}
            style={styles.settingsButton}
            onPress={onSettings}
          >
            <IconSetting color={colors.textLight} size={18} />
          </IconCircleButton>
        </View>
      </View>
    </View>
  );
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
  stream.release();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  roomLobbyCard: {
    flex: 1,
    minHeight: 0,
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: colors.placeholder,
    justifyContent: "center",
  },
  avatar: {
    borderRadius: 54,
    height: 108,
    width: 108,
  },
  initialCircle: {
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 54,
    height: 108,
    justifyContent: "center",
    width: 108,
  },
  initial: {
    color: colors.primaryDark,
    fontSize: 42,
    fontWeight: "800",
  },
  gradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  lobbyText: {
    alignItems: "center",
    bottom: 72,
    left: spacing.md,
    position: "absolute",
    right: spacing.md,
  },
  name: {
    color: colors.textLight,
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 28,
    textAlign: "center",
  },
  roomName: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    opacity: 0.88,
    textAlign: "center",
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
    width: "100%",
  },
  callGroup: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rightControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  joinButton: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  joinText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  settingsButton: {
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.55,
  },
});
