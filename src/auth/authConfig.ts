import { env } from "@/config/env";

const realmUrl = `${env.keycloakUrl}/realms/${env.keycloakRealm}`;

export const keycloakAuthConfig = {
  issuer: realmUrl,
  clientId: env.keycloakClientId,
  redirectUrl: env.keycloakRedirectUrl,
  scopes: ["openid", "profile", "email", "offline_access"],
  serviceConfiguration: {
    authorizationEndpoint: `${realmUrl}/protocol/openid-connect/auth`,
    tokenEndpoint: `${realmUrl}/protocol/openid-connect/token`,
    revocationEndpoint: `${realmUrl}/protocol/openid-connect/revoke`,
    endSessionEndpoint: `${realmUrl}/protocol/openid-connect/logout`,
  },
};
