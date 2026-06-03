import { z } from "zod";

const envSchema = z.object({
  vksApiUrl: z.url(),
  idApiUrl: z.url(),
  s3Url: z.url(),
  keycloakUrl: z.url(),
  keycloakRealm: z.string().min(1),
  keycloakClientId: z.string().min(1),
  keycloakRedirectUrl: z.string().min(1),
});

export const env = envSchema.parse({
  vksApiUrl: process.env.EXPO_PUBLIC_VKS_API_URL ?? "https://vcs.rguk.ru/api",
  idApiUrl:
    process.env.EXPO_PUBLIC_ID_API_URL ?? "https://id.rguk.ru/personal",
  s3Url: process.env.EXPO_PUBLIC_S3_URL ?? "https://s3.kosygin-rsu.ru",
  keycloakUrl:
    process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? "https://id.rguk.ru/auth",
  keycloakRealm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM ?? "master",
  keycloakClientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? "vks",
  keycloakRedirectUrl:
    process.env.EXPO_PUBLIC_KEYCLOAK_REDIRECT_URL ?? "vksmobile.auth:/oauthredirect",
});
