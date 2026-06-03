import type { ImageColorsResult } from "react-native-image-colors";

export function getAverageAvatarColor(result: ImageColorsResult | null | undefined) {
  if (!result) return "#D9D0CA";

  switch (result.platform) {
    case "android":
      return result.average || result.dominant || "#D9D0CA";
    case "ios":
      return result.background || result.primary || "#D9D0CA";
    case "web":
      return result.dominant || result.muted || "#D9D0CA";
    default:
      return "#D9D0CA";
  }
}
