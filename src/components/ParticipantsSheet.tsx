import { BottomSheetFlatList, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Profile } from "@/api/types";
import {
  IconMicrophoneSlash,
  IconMore,
} from "@/components/icons";
import { IconCircleButton } from "@/components/ui";
import type { ParticipantSnapshot } from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type ParticipantsSheetProps = {
  participants: ParticipantSnapshot[];
  profiles: Map<string, Profile>;
  pinnedIdentity: string | null;
  canManageRoom?: boolean;
  onPin: (identity: string | null) => void;
  onParticipantMenu: (participant: ParticipantSnapshot) => void;
};

export const ParticipantsSheet = forwardRef<BottomSheetModal, ParticipantsSheetProps>(
  (
    {
      participants,
      profiles,
      pinnedIdentity,
      canManageRoom,
      onPin,
      onParticipantMenu,
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
            const profile = profiles.get(item.identity);
            const displayName = getProfileName(profile, item.name || item.identity);
            const avatarUrl = getProfileAvatarUrl(profile);

            return (
              <Pressable
                style={[styles.row, pinned ? styles.pinnedRow : null]}
                onPress={() => onPin(pinned ? null : item.identity)}
              >
                <View style={styles.avatar}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.info}>
                  <Text numberOfLines={1} style={styles.name}>
                    {displayName}
                    {item.isLocal ? " (вы)" : ""}
                  </Text>
                  <Text style={styles.meta}>
                    {item.micEnabled ? "Микрофон включен" : "Микрофон выключен"}
                  </Text>
                </View>
                {canManageRoom || !item.isLocal ? (
                  <IconCircleButton
                    accessibilityLabel="Меню участника"
                    tone="light"
                    size={32}
                    onPress={() => onParticipantMenu(item)}
                  >
                    <IconMore color={colors.primaryDark} size={18} />
                  </IconCircleButton>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  pinnedRow: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.primaryOutline,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarImage: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  avatarText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: "800",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.button,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
