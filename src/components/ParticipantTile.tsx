import { VideoView } from "@livekit/react-native";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import ImageColors from "react-native-image-colors";
import {
  IconExpand,
  IconMicrophone,
  IconMicrophoneSlash,
  IconMore,
} from "@/components/icons";
import type { ParticipantSnapshot } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getAverageAvatarColor } from "@/utils/avatarColor";

type ParticipantTileProps = {
  participant: ParticipantSnapshot;
  displayName?: string;
  avatarUrl?: string;
  pinned?: boolean;
  compact?: boolean;
  fill?: boolean;
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
  canManage,
  onPress,
  onMenuPress,
  onMutePress,
}: ParticipantTileProps) {
  const videoTrack = participant.screen?.videoTrack ?? participant.cam?.videoTrack;
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

  return (
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
      {videoTrack ? (
        <VideoView objectFit="cover" style={styles.video} videoTrack={videoTrack} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: averageColor }]}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatar, compact ? styles.compactAvatar : null]}
            />
          ) : (
            <Text style={[styles.initial, compact ? styles.compactInitial : null]}>
              {name.slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>
      )}

      {participant.screenShareEnabled || pinned ? (
        <View style={styles.topAction}>
          <IconExpand color={colors.textLight} size={compact ? 16 : 18} />
        </View>
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
          {showAdminMute ? (
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
          {showParticipantMenu ? (
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
        </View>
      </View>
    </Pressable>
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
