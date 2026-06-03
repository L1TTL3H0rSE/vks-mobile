import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { router, usePathname } from "expo-router";
import { useMemo, useRef } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { idApi } from "@/api/idApi";
import { useAuthStore } from "@/auth/authStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { getProfileAvatarUrl, getProfileName } from "@/utils/profile";

export function Navbar() {
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const menuRef = useRef<BottomSheetModal>(null);
  const isConferenceRoute = pathname.startsWith("/rooms/");
  const isAuthenticated = status === "authenticated";
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => idApi.readPublicProfile(user?.id ?? ""),
    enabled: isAuthenticated && !!user?.id,
  });
  const profile = profileQuery.data;
  const avatarUrl = getProfileAvatarUrl(profile);
  const displayName = getProfileName(profile, user?.name ?? user?.username ?? "Пользователь");
  const snapPoints = useMemo(() => ["34%"], []);

  if (isConferenceRoute || !isAuthenticated) return null;

  const openUrl = async (url: string) => {
    menuRef.current?.dismiss();
    await Linking.openURL(url);
  };

  const handleLogout = async () => {
    menuRef.current?.dismiss();
    await logout();
    router.replace("/");
  };

  return (
    <>
      <View style={styles.navbar}>
        <Pressable
          accessibilityLabel="На главную"
          style={styles.logoButton}
          onPress={() => router.push("/")}
        >
          <LogoMark />
        </Pressable>
        <Pressable
          accessibilityLabel="Меню профиля"
          style={styles.avatarButton}
          onPress={() => menuRef.current?.present()}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          )}
        </Pressable>
      </View>

      <BottomSheetModal ref={menuRef} index={0} snapPoints={snapPoints}>
        <BottomSheetView style={styles.sheet}>
          <View style={styles.profileRow}>
            <View style={styles.sheetAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.sheetAvatarImage} />
              ) : (
                <Text style={styles.sheetAvatarText}>
                  {displayName.slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.profileText}>
              <Text numberOfLines={1} style={styles.profileName}>
                {displayName}
              </Text>
              <Text numberOfLines={1} style={styles.profileMeta}>
                {user?.email ?? user?.username ?? ""}
              </Text>
            </View>
          </View>

          <View style={styles.menu}>
            <MenuItem
              label="Профиль"
              onPress={() => openUrl(`https://id.rguk.ru/profile/${user?.id ?? ""}`)}
            />
            <MenuItem label="Сервисы" onPress={() => openUrl("https://lk.rguk.ru/services")} />
            <MenuItem label="Поддержка" onPress={() => openUrl("https://t.me/kosygineco")} />
            <MenuItem danger label="Выйти" onPress={() => void handleLogout()} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

function MenuItem({
  label,
  danger,
  onPress,
}: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.menuItem, pressed ? styles.pressed : null]} onPress={onPress}>
      <Text style={[styles.menuText, danger ? styles.dangerText : null]}>{label}</Text>
    </Pressable>
  );
}

function LogoMark() {
  return (
    <View style={styles.logo}>
      <View style={styles.logoLeft} />
      <View style={styles.logoRightTop} />
      <View style={styles.logoRightBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  logoButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  logo: {
    height: 32,
    position: "relative",
    width: 28,
  },
  logoLeft: {
    backgroundColor: colors.primary,
    height: 32,
    left: 0,
    position: "absolute",
    top: 0,
    width: 7,
  },
  logoRightTop: {
    borderBottomColor: "transparent",
    borderBottomWidth: 9,
    borderLeftColor: colors.primary,
    borderLeftWidth: 17,
    borderTopColor: "transparent",
    borderTopWidth: 9,
    left: 10,
    position: "absolute",
    top: 3,
  },
  logoRightBottom: {
    borderBottomColor: "transparent",
    borderBottomWidth: 9,
    borderLeftColor: colors.primaryDark,
    borderLeftWidth: 17,
    borderTopColor: "transparent",
    borderTopWidth: 9,
    left: 10,
    position: "absolute",
    top: 14,
    transform: [{ scaleY: -1 }],
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    width: 36,
  },
  avatarImage: {
    height: 32,
    width: 32,
    borderRadius: 16,
  },
  avatarText: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  sheet: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  sheetAvatar: {
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.primaryOutline,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    overflow: "hidden",
    width: 56,
  },
  sheetAvatarImage: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  sheetAvatarText: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: "800",
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  profileMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    borderBottomColor: colors.secondaryBorder,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  dangerText: {
    color: colors.errorActive,
  },
  pressed: {
    backgroundColor: colors.primaryLight,
  },
});
