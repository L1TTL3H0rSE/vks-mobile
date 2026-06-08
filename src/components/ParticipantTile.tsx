import { VideoTrack } from "@livekit/react-native";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import type { TrackReference } from "@livekit/components-react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import ImageColors from "react-native-image-colors";
import {
  IconExpand,
  IconMicrophone,
  IconMicrophoneSlash,
  IconMore,
  IconRepeatCircle,
} from "@/components/icons";
import type { ParticipantSnapshot } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getAverageAvatarColor } from "@/utils/avatarColor";

type VideoSource = "camera" | "screen";

type ParticipantTileProps = {
  participant: ParticipantSnapshot;
  displayName?: string;
  avatarUrl?: string;
  pinned?: boolean;
  compact?: boolean;
  fill?: boolean;
  primary?: boolean;
  canManage?: boolean;
  onPress?: () => void;
  onMenuPress?: () => void;
  onMutePress?: () => void;
};

export function ParticipantTile({
  participant,
  displayName,
  avatarUrl,
  pinned,
  compact,
  fill,
  primary,
  canManage,
  onPress,
  onMenuPress,
  onMutePress,
}: ParticipantTileProps) {
  const screenTrack = participant.screenShareEnabled
    ? participant.screen?.videoTrack
    : undefined;
  const cameraTrack = participant.camEnabled ? participant.cam?.videoTrack : undefined;
  const [selectedSource, setSelectedSource] = useState<VideoSource>(
    screenTrack ? "screen" : "camera",
  );
  const [fullscreen, setFullscreen] = useState(false);
  const activeSource =
    selectedSource === "screen" && screenTrack
      ? "screen"
      : cameraTrack
        ? "camera"
        : screenTrack
          ? "screen"
          : "camera";
  const canSwapStreams = !!primary && !!screenTrack && !!cameraTrack;
  const canFullscreen = !!primary;
  const name = displayName ?? participant.name ?? participant.identity;
  const [averageColor, setAverageColor] = useState("#D9D0CA");
  const showParticipantMenu = !!onMenuPress && !participant.isLocal;
  const showAdminMute = !!canManage && !participant.isLocal && participant.micEnabled;

  useEffect(() => {
    let active = true;

    async function loadColor() {
      if (!avatarUrl) {
        setAverageColor("#D9D0CA");
        return;
      }

      try {
        const result = await ImageColors.getColors(avatarUrl, {
          cache: true,
          fallback: "#D9D0CA",
          key: avatarUrl,
          quality: "low",
          pixelSpacing: 8,
        });
        if (active) setAverageColor(getAverageAvatarColor(result));
      } catch {
        if (active) setAverageColor("#D9D0CA");
      }
    }

    void loadColor();
    return () => {
      active = false;
    };
  }, [avatarUrl]);

  useEffect(() => {
    setSelectedSource(screenTrack ? "screen" : "camera");
  }, [participant.identity, screenTrack]);

  function renderMedia(source: VideoSource, fullscreenMode = false) {
    const publication = source === "screen" ? participant.screen : participant.cam;
    const track = source === "screen" ? screenTrack : cameraTrack;

    if (publication && track) {
      const trackRef: TrackReference = {
        participant: participant.liveKitParticipant,
        publication,
        source:
          source === "screen" ? Track.Source.ScreenShare : Track.Source.Camera,
      };
      const videoKey = `${participant.identity}-${source}-${publication.trackSid}`;

      return (
        <VideoTrack
          key={videoKey}
          mirror={participant.isLocal && source === "camera"}
          objectFit={source === "screen" || fullscreenMode ? "contain" : "cover"}
          style={styles.video}
          trackRef={trackRef}
        />
      );
    }

    return (
      <View style={[styles.placeholder, { backgroundColor: averageColor }]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.avatar,
              compact && !fullscreenMode ? styles.compactAvatar : null,
            ]}
          />
        ) : (
          <Text
            style={[
              styles.initial,
              compact && !fullscreenMode ? styles.compactInitial : null,
            ]}
          >
            {name.slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
    );
  }

  function renderChrome(fullscreenMode = false) {
    return (
      <>
        {canFullscreen ? (
          <Pressable
            accessibilityLabel={
              fullscreenMode ? "Закрыть полноэкранный режим" : "На весь экран"
            }
            style={({ pressed }) => [
              styles.topAction,
              pressed ? styles.pressed : null,
            ]}
            onPress={(event) => {
              event.stopPropagation();
              setFullscreen((value) => !value);
            }}
          >
            <IconExpand color={colors.textLight} size={compact ? 16 : 18} />
          </Pressable>
        ) : null}

        <View style={styles.bottomControls}>
          <View style={[styles.namePill, compact ? styles.compactNamePill : null]}>
            <Text numberOfLines={1} style={[styles.name, compact ? styles.compactName : null]}>
              {name}
              {participant.isLocal ? " (вы)" : ""}
            </Text>
            {!participant.micEnabled ? (
              <IconMicrophoneSlash color={colors.textLight} size={compact ? 16 : 18} />
            ) : null}
          </View>

          <View style={styles.actionGroup}>
            {showAdminMute && !fullscreenMode ? (
              <Pressable
                accessibilityLabel="Отключить микрофон участника"
                style={({ pressed }) => [styles.circleButton, pressed ? styles.pressed : null]}
                onPress={(event) => {
                  event.stopPropagation();
                  onMutePress?.();
                }}
              >
                <IconMicrophone color={colors.textLight} size={compact ? 16 : 18} />
              </Pressable>
            ) : null}
            {showParticipantMenu && !fullscreenMode ? (
              <Pressable
                accessibilityLabel="Меню участника"
                style={({ pressed }) => [styles.circleButton, pressed ? styles.pressed : null]}
                onPress={(event) => {
                  event.stopPropagation();
                  onMenuPress?.();
                }}
              >
                <IconMore color={colors.textLight} size={compact ? 18 : 20} />
              </Pressable>
            ) : null}
            {canSwapStreams ? (
              <Pressable
                accessibilityLabel="Переключить камеру и экран"
                style={({ pressed }) => [styles.circleButton, pressed ? styles.pressed : null]}
                onPress={(event) => {
                  event.stopPropagation();
                  setSelectedSource((source) =>
                    source === "screen" ? "camera" : "screen",
                  );
                }}
              >
                <IconRepeatCircle color={colors.textLight} size={compact ? 18 : 20} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Pressable
        style={[
          styles.tile,
          compact ? styles.compactTile : null,
          fill ? styles.fillTile : null,
          participant.isSpeaking && !pinned ? styles.speaking : null,
          pinned ? styles.pinned : null,
        ]}
        onPress={onPress}
      >
        {renderMedia(activeSource)}
        {renderChrome()}
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
        visible={fullscreen}
      >
        <View style={styles.fullscreenTile}>
          {renderMedia(activeSource, true)}
          {renderChrome(true)}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tile: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  compactTile: {
    minWidth: 180,
  },
  fillTile: {
    aspectRatio: undefined,
    height: "100%",
  },
  fullscreenTile: {
    backgroundColor: colors.darkSurface,
    flex: 1,
    position: "relative",
  },
  speaking: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  pinned: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  video: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  initial: {
    color: colors.textLight,
    fontSize: 40,
    fontWeight: "800",
  },
  compactInitial: {
    fontSize: 28,
  },
  avatar: {
    borderRadius: 34,
    height: 68,
    width: 68,
  },
  compactAvatar: {
    borderRadius: 26,
    height: 52,
    width: 52,
  },
  topAction: {
    alignItems: "center",
    backgroundColor: "#212121B2",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 36,
  },
  bottomControls: {
    alignItems: "center",
    bottom: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    left: spacing.md,
    position: "absolute",
    right: spacing.md,
  },
  namePill: {
    alignItems: "center",
    backgroundColor: "#212121B2",
    borderRadius: radius.pill,
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm,
    height: 36,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  compactNamePill: {
    height: 32,
    paddingHorizontal: spacing.sm,
  },
  name: {
    ...typography.captionStrong,
    color: colors.textLight,
    flexShrink: 1,
  },
  compactName: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionGroup: {
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.sm,
  },
  circleButton: {
    alignItems: "center",
    backgroundColor: "#212121B2",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  pressed: {
    opacity: 0.76,
  },
});
