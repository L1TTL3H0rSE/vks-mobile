import {
  mediaDevices,
  RTCView,
  type MediaStream,
} from "@livekit/react-native-webrtc";
import { Camera, CameraOff, Mic, MicOff, Settings } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Toast from "react-native-toast-message";
import type { Profile } from "@/api/types";
import type { AuthUser } from "@/auth/authStore";
import { IconCircleButton } from "@/components/ui";
import { useLiveKitStore } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type LocalPreviewCardProps = {
  user: AuthUser | null;
  profile?: Profile;
  roomName?: string;
  onSettings: () => void;
};

export function LocalPreviewCard({
  user,
  profile,
  roomName,
  onSettings,
}: LocalPreviewCardProps) {
  const cameraEnabled = useLiveKitStore((state) => state.cameraEnabled);
  const microphoneEnabled = useLiveKitStore((state) => state.microphoneEnabled);
  const toggleCamera = useLiveKitStore((state) => state.toggleCamera);
  const toggleMicrophone = useLiveKitStore((state) => state.toggleMicrophone);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { height, width } = useWindowDimensions();
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
          video: { facingMode: "user" },
        });
        if (cancelled) {
          stopStream(nextStream);
          return;
        }
        preview = nextStream;
        setStream(nextStream);
      } catch (error) {
        await toggleCamera();
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
  }, [cameraEnabled, toggleCamera]);

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
          text2: error instanceof Error ? error.message : "Проверьте разрешения",
        });
        return;
      }
    }
    await toggleMicrophone();
  }

  return (
    <View style={[styles.card, { height: cardHeight }]}>
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
            {displayName}
          </Text>
          <Text numberOfLines={1} style={styles.lobbyName}>
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
              <Mic color={colors.textLight} size={18} />
            ) : (
              <MicOff color={colors.textLight} size={18} />
            )}
          </IconCircleButton>
          <IconCircleButton
            accessibilityLabel="Камера"
            size={36}
            tone={cameraEnabled ? "primary" : "muted"}
            onPress={() => void toggleCamera()}
          >
            {cameraEnabled ? (
              <Camera color={colors.textLight} size={18} />
            ) : (
              <CameraOff color={colors.textLight} size={18} />
            )}
          </IconCircleButton>
        </View>
        <IconCircleButton
          accessibilityLabel="Настройки"
          size={36}
          style={styles.settingsButton}
          onPress={onSettings}
        >
          <Settings color={colors.textLight} size={18} />
        </IconCircleButton>
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
    bottom: 58,
    left: spacing.md,
    position: "absolute",
    right: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.textLight,
    textAlign: "center",
  },
  lobbyName: {
    ...typography.bodyStrong,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  roomName: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
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
  settingsButton: {
    borderRadius: radius.md,
  },
});
