import { VideoView } from "@livekit/react-native";
import { Mic, MicOff, Video, VideoOff } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ParticipantSnapshot } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";

type ParticipantTileProps = {
  participant: ParticipantSnapshot;
  displayName?: string;
  avatarUrl?: string;
  pinned?: boolean;
  compact?: boolean;
  onPress?: () => void;
};

export function ParticipantTile({
  participant,
  displayName,
  avatarUrl,
  pinned,
  compact,
  onPress,
}: ParticipantTileProps) {
  const videoTrack = participant.cam?.videoTrack ?? participant.screen?.videoTrack;
  const name = displayName ?? participant.name ?? participant.identity;

  return (
    <Pressable
      style={[styles.tile, compact ? styles.compactTile : null, pinned ? styles.pinned : null]}
      onPress={onPress}
    >
      {videoTrack ? (
        <VideoView objectFit="cover" style={styles.video} videoTrack={videoTrack} />
      ) : (
        <View style={styles.placeholder}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
          <Text style={[styles.initial, compact ? styles.compactInitial : null]}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
          )}
        </View>
      )}
      <View style={styles.footer}>
        <Text numberOfLines={1} style={[styles.name, compact ? styles.compactName : null]}>
          {name}
          {participant.isLocal ? " (вы)" : ""}
        </Text>
        {pinned ? <Text style={styles.pin}>Закреплен</Text> : null}
        <View style={styles.icons}>
          {participant.micEnabled ? (
            <Mic color="#fff" size={15} />
          ) : (
            <MicOff color="#fff" size={15} />
          )}
          {participant.camEnabled ? (
            <Video color="#fff" size={15} />
          ) : (
            <VideoOff color="#fff" size={15} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  compactTile: {
    aspectRatio: 1,
    minHeight: 116,
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
    borderRadius: 44,
    height: 88,
    width: 88,
  },
  footer: {
    alignItems: "center",
    backgroundColor: colors.darkOverlay,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    left: 0,
    padding: spacing.sm,
    position: "absolute",
    right: 0,
  },
  name: {
    ...typography.captionStrong,
    color: colors.textLight,
    flex: 1,
  },
  compactName: {
    fontSize: 12,
    lineHeight: 16,
  },
  pin: {
    color: colors.primaryOutline,
    fontSize: 11,
    fontWeight: "700",
  },
  icons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
});
