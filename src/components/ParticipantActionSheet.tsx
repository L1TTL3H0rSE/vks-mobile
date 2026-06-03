import Slider from "@react-native-community/slider";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useMemo } from "react";
import type { ReactNode } from "react";
import { Image, Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { Profile } from "@/api/types";
import {
  IconCallRemove,
  IconCameraSlash,
  IconClose,
  IconMicrophoneSlash,
} from "@/components/icons";
import type {
  ParticipantLocalSettings,
  ParticipantSnapshot,
} from "@/livekit/livekitStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type ParticipantActionSheetProps = {
  participant: ParticipantSnapshot | null;
  profile?: Profile;
  settings: ParticipantLocalSettings;
  canManageRoom?: boolean;
  onClose: () => void;
  onToggleMute: (identity: string) => void;
  onVolumeChange: (identity: string, kind: "mic" | "stream", value: number) => void;
  onKick: (identity: string) => void;
  onSoftMicrophoneDisable: (identity: string) => void;
  onSoftCameraDisable: (identity: string) => void;
  onSoftScreenDisable: (identity: string) => void;
};

export const ParticipantActionSheet = forwardRef<
  BottomSheetModal,
  ParticipantActionSheetProps
>(
  (
    {
      participant,
      profile,
      settings,
      canManageRoom,
      onClose,
      onToggleMute,
      onVolumeChange,
      onKick,
      onSoftMicrophoneDisable,
      onSoftCameraDisable,
      onSoftScreenDisable,
    },
    ref,
  ) => {
    const snapPoints = useMemo(() => ["82%"], []);
    const displayName = participant
      ? getProfileName(profile, participant.name || participant.identity)
      : "";
    const avatarUrl = getProfileAvatarUrl(profile);
    const showAdminActions = !!canManageRoom && !!participant && !participant.isLocal;

    return (
      <BottomSheetModal ref={ref} index={0} snapPoints={snapPoints} onDismiss={onClose}>
        {participant ? (
          <BottomSheetScrollView contentContainerStyle={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.profile}>
                <View style={styles.avatar}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.profileText}>
                  <Text numberOfLines={2} style={styles.name}>
                    {displayName}
                    {participant.isLocal ? " (вы)" : ""}
                  </Text>
                  <Pressable
                    onPress={() =>
                      Linking.openURL(`https://id.rguk.ru/profile/${participant.identity}`)
                    }
                  >
                    <Text style={styles.profileLink}>Открыть профиль</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable accessibilityLabel="Закрыть" style={styles.close} onPress={onClose}>
                <IconClose color={colors.secondary} size={18} />
              </Pressable>
            </View>

            <View style={styles.inner}>
              <Text style={styles.sectionLabel}>Настройки пользователя</Text>

              {showAdminActions ? (
                <View style={styles.group}>
                  {participant.micEnabled ? (
                    <ActionRow
                      icon={<IconMicrophoneSlash color={colors.secondary} size={20} />}
                      label="Отключить микрофон"
                      onPress={() => onSoftMicrophoneDisable(participant.identity)}
                    />
                  ) : null}
                  {participant.camEnabled ? (
                    <ActionRow
                      icon={<IconCameraSlash color={colors.secondary} size={20} />}
                      label="Отключить камеру"
                      onPress={() => onSoftCameraDisable(participant.identity)}
                    />
                  ) : null}
                  {participant.screenShareEnabled ? (
                    <ActionRow
                      icon={<IconCameraSlash color={colors.secondary} size={20} />}
                      label="Отключить трансляцию"
                      onPress={() => onSoftScreenDisable(participant.identity)}
                    />
                  ) : null}
                </View>
              ) : null}

              <View style={styles.group}>
                <View style={styles.switchRow}>
                  <View style={styles.rowIcon}>
                    <IconMicrophoneSlash color={colors.secondary} size={20} />
                  </View>
                  <Text style={styles.rowText}>Заглушить</Text>
                  <Switch
                    onValueChange={() => onToggleMute(participant.identity)}
                    thumbColor={settings.muted ? colors.primary : colors.surface}
                    trackColor={{ false: colors.secondaryLight, true: colors.primaryOutline }}
                    value={settings.muted}
                  />
                </View>
                <VolumeRow
                  disabled={settings.muted}
                  label="Громкость микрофона"
                  value={settings.micVolume}
                  onChange={(value) => onVolumeChange(participant.identity, "mic", value)}
                />
                <VolumeRow
                  disabled={settings.muted}
                  label="Громкость трансляции"
                  value={settings.streamVolume}
                  onChange={(value) => onVolumeChange(participant.identity, "stream", value)}
                />
              </View>

              {showAdminActions ? (
                <View style={styles.group}>
                  <ActionRow
                    danger
                    icon={<IconCallRemove color={colors.errorActive} size={20} />}
                    label="Исключить из встречи"
                    onPress={() => onKick(participant.identity)}
                  />
                </View>
              ) : null}
            </View>
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={styles.sheet}>
            <View />
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

ParticipantActionSheet.displayName = "ParticipantActionSheet";

function ActionRow({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.actionRow, pressed ? styles.pressed : null]} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowText, danger ? styles.dangerText : null]}>{label}</Text>
    </Pressable>
  );
}

function VolumeRow({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <View style={[styles.volumeRow, disabled ? styles.disabled : null]}>
      <Text style={styles.rowText}>{label}</Text>
      <Slider
        disabled={disabled}
        maximumTrackTintColor={colors.secondaryLight}
        maximumValue={1}
        minimumTrackTintColor={colors.primary}
        minimumValue={0}
        onValueChange={onChange}
        thumbTintColor={disabled ? colors.textPlaceholder : colors.primary}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profile: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 64,
  },
  avatarImage: {
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  avatarText: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: "800",
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  profileLink: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  close: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  inner: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    gap: spacing.xl,
    padding: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  group: {
    gap: spacing.sm,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  rowIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  rowText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  dangerText: {
    color: colors.errorActive,
  },
  volumeRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.76,
  },
});
