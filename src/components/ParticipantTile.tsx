import { VideoView } from "@livekit/react-native";
import { Mic, MicOff, Video, VideoOff } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ParticipantSnapshot } from "@/livekit/livekitStore";

type ParticipantTileProps = {
  participant: ParticipantSnapshot;
  pinned?: boolean;
  onPress?: () => void;
};

export function ParticipantTile({ participant, pinned, onPress }: ParticipantTileProps) {
  const videoTrack = participant.cam?.videoTrack ?? participant.screen?.videoTrack;

  return (
    <Pressable
      style={[styles.tile, pinned ? styles.pinned : null]}
      onPress={onPress}
    >
      {videoTrack ? (
        <VideoView objectFit="cover" style={styles.video} videoTrack={videoTrack} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.initial}>
            {(participant.name ?? participant.identity).slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.name}>
          {participant.name || participant.identity}
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
    backgroundColor: "#111827",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  pinned: {
    borderColor: "#2563eb",
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
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
  },
  footer: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.76)",
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    left: 0,
    padding: 8,
    position: "absolute",
    right: 0,
  },
  name: {
    color: "#fff",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  pin: {
    color: "#bfdbfe",
    fontSize: 11,
    fontWeight: "700",
  },
  icons: {
    flexDirection: "row",
    gap: 6,
  },
});
