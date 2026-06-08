import Slider from "@react-native-community/slider";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { forwardRef, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Profile } from "@/api/types";
import {
  IconCallRemove,
  IconCameraSlash,
  IconClose,
  IconMicrophoneSlash,
  IconPin,
  IconScreenShareSlashed,
  IconVolume,
} from "@/components/icons";
import type {
  ParticipantLocalSettings,
  ParticipantSnapshot,
} from "@/livekit/livekitStore";
import { colors, spacing } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

type ParticipantActionSheetProps = {
  participant: ParticipantSnapshot | null;
  profile?: Profile;
  settings: ParticipantLocalSettings;
  pinned?: boolean;
  canManageRoom?: boolean;
  onClose: () => void;
  onTogglePin: (identity: string | null) => void;
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
      pinned,
      canManageRoom,
      onClose,
      onTogglePin,
      onToggleMute,
      onVolumeChange,
      onKick,
      onSoftMicrophoneDisable,
      onSoftCameraDisable,
      onSoftScreenDisable,
    },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheetModal | null>(null);
    const setSheetRef = useCallback(
      (node: BottomSheetModal | null) => {
        sheetRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );
    const closeSheet = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);
    const showAdminActions = !!canManageRoom && !!participant && !participant.isLocal;
    const snapPoints = useMemo(
      () => [showAdminActions ? "88%" : "56%"],
      [showAdminActions],
    );
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.2}
          pressBehavior="close"
          style={[props.style, styles.backdrop]}
        >
          <BlurView intensity={16} style={StyleSheet.absoluteFill} tint="dark" />
        </BottomSheetBackdrop>
      ),
      [],
    );
    const displayName = participant
      ? getProfileName(profile, participant.name || participant.identity)
      : "";
    const avatarUrl = getProfileAvatarUrl(profile);

    return (
      <BottomSheetModal
        ref={setSheetRef}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={null}
        index={0}
        onDismiss={onClose}
        snapPoints={snapPoints}
      >
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
              <Pressable accessibilityLabel="Закрыть" style={styles.close} onPress={closeSheet}>
                <IconClose color={colors.secondary} size={18} />
              </Pressable>
            </View>

            <View style={styles.inner}>
              <Text style={styles.sectionLabel}>Настройки пользователя</Text>

              <View style={styles.group}>
                <SwitchRow
                  icon={<IconPin color={colors.secondary} size={20} />}
                  label="Закрепить только для меня"
                  value={!!pinned}
                  onPress={() => onTogglePin(pinned ? null : participant.identity)}
                />
              </View>

              {showAdminActions ? (
                <>
                  <Divider />
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
                        icon={<IconScreenShareSlashed color={colors.secondary} size={20} />}
                        label="Отключить трансляцию"
                        onPress={() => onSoftScreenDisable(participant.identity)}
                      />
                    ) : null}
                  </View>
                </>
              ) : null}

              <Divider />
              <View style={styles.group}>
                <SwitchRow
                  icon={<IconMicrophoneSlash color={colors.secondary} size={20} />}
                  label="Заглушить пользователя"
                  value={settings.muted}
                  onPress={() => onToggleMute(participant.identity)}
                />
                <VolumeRow
                  disabled={settings.muted}
                  icon={<IconMicrophoneSlash color={colors.secondary} size={20} />}
                  label="Громкость микрофона"
                  value={settings.micVolume}
                  onChange={(value) => onVolumeChange(participant.identity, "mic", value)}
                />
                <VolumeRow
                  disabled={settings.muted}
                  icon={<IconVolume color={colors.secondary} size={20} />}
                  label="Громкость трансляции"
                  value={settings.streamVolume}
                  onChange={(value) => onVolumeChange(participant.identity, "stream", value)}
                />
              </View>

              {showAdminActions ? (
                <>
                  <Divider />
                  <View style={styles.group}>
                    <ActionRow
                      danger
                      icon={<IconCallRemove color={colors.errorActive} size={20} />}
                      label="Исключить из встречи"
                      onPress={() => onKick(participant.identity)}
                    />
                  </View>
                </>
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
    <Pressable
      style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]}
      onPress={onPress}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowText, danger ? styles.dangerText : null]}>{label}</Text>
    </Pressable>
  );
}

function SwitchRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]}
      onPress={onPress}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowText}>{label}</Text>
      <View style={[styles.tinySwitch, value ? styles.tinySwitchActive : null]}>
        <View style={[styles.tinySwitchThumb, value ? styles.tinySwitchThumbActive : null]} />
      </View>
    </Pressable>
  );
}

function VolumeRow({
  icon,
  label,
  value,
  disabled,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <View style={[styles.volumeRow, disabled ? styles.disabled : null]}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.volumeContent}>
        <Text style={styles.rowText}>{label}</Text>
        <Slider
          disabled={disabled}
          maximumTrackTintColor={colors.backgroundSecondary}
          maximumValue={1}
          minimumTrackTintColor={colors.primary}
          minimumValue={0}
          onValueChange={onChange}
          thumbTintColor={disabled ? colors.textPlaceholder : colors.primary}
          value={value}
        />
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#000000",
  },
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheet: {
    gap: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profile: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 14,
    minWidth: 0,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.placeholder,
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
    gap: spacing.xs,
    justifyContent: "center",
    minWidth: 0,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  profileLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  close: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  inner: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: spacing.xl,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  group: {
    gap: spacing.md,
  },
  divider: {
    backgroundColor: colors.secondaryBorder,
    borderRadius: 10,
    height: 1,
    width: "100%",
  },
  listRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
    paddingLeft: spacing.sm,
  },
  rowIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  rowText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  dangerText: {
    color: colors.errorActive,
  },
  tinySwitch: {
    alignItems: "center",
    backgroundColor: colors.placeholder,
    borderColor: colors.placeholder,
    borderRadius: 16,
    borderWidth: 1,
    height: 16,
    justifyContent: "center",
    paddingHorizontal: 2,
    width: 32,
  },
  tinySwitchActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tinySwitchThumb: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 6,
    height: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: 12,
  },
  tinySwitchThumbActive: {
    alignSelf: "flex-end",
  },
  volumeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  volumeContent: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.76,
  },
});
