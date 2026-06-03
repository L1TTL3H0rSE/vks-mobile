import type { Profile } from "@/api/types";
import { mapS3Url } from "./links";

export function getProfileName(profile: Profile | undefined, fallback: string) {
  if (!profile) return fallback;
  const name = [profile.last_name, profile.first_name, profile.patronymic]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || profile.user_id || fallback;
}

export function getProfileAvatarUrl(profile: Profile | undefined) {
  if (!profile?.avatar) return undefined;
  return mapS3Url("id-personal", `${profile.avatar}.png`);
}
