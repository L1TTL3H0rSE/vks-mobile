import { BottomSheetFlatList, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { CameraOff, MicOff, MonitorX, PhoneOff } from "lucide-react-native";
import { forwardRef, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ParticipantSnapshot } from "@/livekit/livekitStore";

type ParticipantsSheetProps = {
  participants: ParticipantSnapshot[];
  pinnedIdentity: string | null;
  canManageRoom?: boolean;
  onPin: (identity: string | null) => void;
  onKick: (identity: string) => void;
  onSoftMicrophoneDisable: (identity: string) => void;
  onSoftCameraDisable: (identity: string) => void;
  onSoftScreenDisable: (identity: string) => void;
};

export const ParticipantsSheet = forwardRef<BottomSheetModal, ParticipantsSheetProps>(
  (
    {
      participants,
      pinnedIdentity,
      canManageRoom,
      onPin,
      onKick,
      onSoftMicrophoneDisable,
      onSoftCameraDisable,
      onSoftScreenDisable,
    },
    ref,
  ) => {
    const snapPoints = useMemo(() => ["45%", "80%"], []);

    return (
      <BottomSheetModal ref={ref} index={0} snapPoints={snapPoints}>
        <BottomSheetView style={styles.header}>
          <Text style={styles.title}>Участники</Text>
          <Text style={styles.subtitle}>{participants.length} онлайн</Text>
        </BottomSheetView>
        <BottomSheetFlatList
          contentContainerStyle={styles.list}
          data={participants}
          keyExtractor={(participant) => participant.sid || participant.identity}
          renderItem={({ item }) => {
            const pinned = item.identity === pinnedIdentity;

            return (
              <Pressable
                style={[styles.row, pinned ? styles.pinnedRow : null]}
                onPress={() => onPin(pinned ? null : item.identity)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.name || item.identity).slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text numberOfLines={1} style={styles.name}>
                    {item.name || item.identity}
                    {item.isLocal ? " (вы)" : ""}
                  </Text>
                  <Text style={styles.meta}>
                    {item.micEnabled ? "Микрофон включен" : "Микрофон выключен"}
                  </Text>
                </View>
                {canManageRoom && !item.isLocal ? (
                  <View style={styles.actions}>
                    <Pressable onPress={() => onSoftMicrophoneDisable(item.identity)}>
                      <MicOff color="#4b5563" size={19} />
                    </Pressable>
                    <Pressable onPress={() => onSoftCameraDisable(item.identity)}>
                      <CameraOff color="#4b5563" size={19} />
                    </Pressable>
                    <Pressable onPress={() => onSoftScreenDisable(item.identity)}>
                      <MonitorX color="#4b5563" size={19} />
                    </Pressable>
                    <Pressable onPress={() => onKick(item.identity)}>
                      <PhoneOff color="#dc2626" size={19} />
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      </BottomSheetModal>
    );
  },
);

ParticipantsSheet.displayName = "ParticipantsSheet";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    gap: 8,
    padding: 16,
  },
  row: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 12,
    padding: 10,
  },
  pinnedRow: {
    backgroundColor: "#eef2ff",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
});
