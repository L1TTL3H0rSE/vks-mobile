import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

type AppButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
};

export function AppButton({
  title,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#2563eb"} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primary: {
    backgroundColor: "#2563eb",
  },
  secondary: {
    backgroundColor: "#eef2ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
  },
  danger: {
    backgroundColor: "#dc2626",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#1d4ed8",
  },
  dangerText: {
    color: "#fff",
  },
  ghostText: {
    color: "#2563eb",
  },
});
