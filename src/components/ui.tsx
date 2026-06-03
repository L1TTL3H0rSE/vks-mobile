import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, shadow, spacing, typography } from "@/theme/tokens";

type SurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, style }: SurfaceProps) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }: SurfaceProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StateView({
  title,
  text,
  loading,
  action,
}: {
  title: string;
  text?: string;
  loading?: boolean;
  action?: ReactNode;
}) {
  return (
    <View style={styles.state}>
      {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
      <Text style={styles.stateTitle}>{title}</Text>
      {text ? <Text style={styles.stateText}>{text}</Text> : null}
      {action}
    </View>
  );
}

type IconCircleButtonProps = PressableProps & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "muted" | "danger" | "light";
  size?: number;
};

export function IconCircleButton({
  children,
  tone = "primary",
  size = 44,
  style,
  disabled,
  ...props
}: IconCircleButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconButton,
        iconToneStyles[tone],
        { height: size, width: size, borderRadius: size / 2 },
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.card,
  },
  state: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  stateTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  stateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.5,
  },
});

const iconToneStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.darkSurface,
  },
  muted: {
    backgroundColor: colors.secondary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  light: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.primaryOutline,
    borderWidth: 1,
  },
});
