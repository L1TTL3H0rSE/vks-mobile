# Kosygin VCS React Native Port Spec

Status: planning spec for port from `C:\Dev\_Work\_Frontend\vks-frontend` to `C:\Dev\_Personal\_Pet\vks-mobile`.

## 1. Goal

Port current Nuxt/Vue VKS frontend into Expo React Native app.

Core mobile app must support:

- Keycloak login/logout and token refresh.
- Room list, search, create, delete, copy link.
- Join room by list item or deep link.
- LiveKit conference: connect, disconnect, camera, microphone, speaker output where platform permits, participant grid/list, chat, moderator actions.
- User profiles/avatars from ID Directus API.
- Persisted local settings.

Non-goals for first mobile MVP:

- Admin audit dashboard.
- Full web-style screen share publishing. Mobile screen share needs extra native work and should be separate phase.
- Web-only telemetry parity with Nuxt auto imports.
- Browser-specific device selection UX.

## 2. Current Web App Map

Source project: Nuxt 4 SPA, Vue 3, Pinia.

Important files:

- `app/api/vks.ts`: VKS REST API client.
- `app/api/api.ts`: axios wrapper and API error shape.
- `app/api/idApi.ts`: Directus profile/group API.
- `app/api/types/rooms.ts`: room/token request/response types.
- `app/stores/user.ts`: current room, join/create/delete/moderator actions.
- `app/stores/livekit.ts`: LiveKit room state, participant snapshots, chat, media toggles.
- `app/stores/settings.ts`: camera/mic/speaker/screen/pinned participant/local volumes.
- `app/components/Rooms.vue`, `RoomsList.vue`: lobby room list.
- `app/components/views/Lobby.vue`: pre-join local preview and auto-join.
- `app/components/views/Room.vue`: conference layout, controls, side panel.
- `app/components/RoomMenu.vue`: participants and chat.

Routes:

- `/`: lobby with local participant card and room list.
- `/rooms/:room_id`: lobby for one room if not connected; room view if connected.
- `/rooms/:room_id?join=true`: auto-join path for manager-created rooms.
- `/admin`: audit admin page. Skip MVP.

Runtime config:

- VKS API web dev proxy: `/api` -> `https://vcs.rguk.ru/api`
- Mobile must use absolute API URL: `https://vcs.rguk.ru/api`
- ID personal API: `https://id.rguk.ru/personal`
- S3: `https://s3.kosygin-rsu.ru`
- Keycloak: `https://id.rguk.ru/auth`, realm `master`, client `vks`

## 3. Target Mobile Project State

Target project already has:

- Expo `~56.0.8`
- React Native `0.85.3`
- React `19.2.3`
- `@livekit/react-native`
- `@livekit/react-native-expo-plugin`
- `@livekit/react-native-webrtc`
- `@config-plugins/react-native-webrtc`
- `react-native-webrtc`
- `livekit-client`
- `expo-keep-awake`
- `react-native-app-auth`
- `expo-secure-store`
- `@react-native-async-storage/async-storage`
- `axios`
- `date-fns`
- `jwt-decode`
- `zustand`
- `@gorhom/bottom-sheet`
- `@tanstack/react-query`
- `expo-router`
- `expo-clipboard`
- `react-native-toast-message`
- gesture/reanimated/safe-area dependencies

Prepared scaffold now exists under `app/` and `src/`. Feature code still needs porting.

Use Expo Router for file-based routes. This matches Nuxt mental model better than hand-written navigator setup and keeps route params/deep links close to screen files.

## 4. Missing Dependencies

Install these for MVP:

```bash
npm install expo-router react-native-screens expo-clipboard react-native-svg lucide-react-native
```

LiveKit Expo packages required by official LiveKit Expo setup:

```bash
npm install @livekit/react-native-expo-plugin @livekit/react-native-webrtc @config-plugins/react-native-webrtc livekit-client
```

Current note: `@config-plugins/react-native-webrtc@14` declares Expo `^55` peer while this app uses Expo 56. It is installed with peer override and excluded from React Native Directory doctor metadata checks because it is required by LiveKit Expo setup.

Recommended:

```bash
npm install @tanstack/react-query zod
```

Optional, if reusing Directus SDK instead of plain REST:

```bash
npm install @directus/sdk
```

Usually not needed:

- `@kosygin-rsu/components`: web Vue UI kit. Replace with RN components.
- `@kosygin-rsu/frontend-extras-nuxt`: Nuxt auth/profile/telemetry helpers. Replace.
- `pinia`, `vue`, `nuxt`, `@vueuse/core`: web-only.
- `livekit-client`: web SDK. Use `@livekit/react-native`.
- `fast-average-color`: only if avatar color extraction is required.

Need native/app config changes:

- Add URL scheme for Keycloak redirect, e.g. `vksmobile`.
- AppAuth requires native build/dev client. Do not rely on Expo Go for auth.
- Android package and iOS bundle identifier should be stable before configuring Keycloak redirect URIs.

Example `app.json` additions:

```json
{
  "expo": {
    "scheme": "vksmobile",
    "ios": {
      "bundleIdentifier": "ru.rguk.vks.mobile",
      "infoPlist": {
        "UIBackgroundModes": ["audio", "voip"]
      }
    },
    "android": {
      "package": "ru.rguk.vks.mobile",
      "permissions": [
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MICROPHONE"
      ]
    }
  }
}
```

## 5. Proposed Mobile Architecture

Use this folder shape:

```text
app/
  _layout.tsx
  index.tsx
  settings.tsx
  rooms/
    [roomId].tsx
src/
  api/
    apiClient.ts
    vksApi.ts
    idApi.ts
    types.ts
  auth/
    authConfig.ts
    authStore.ts
    keycloak.ts
  livekit/
    livekitStore.ts
    participant.ts
  screens/
    LobbyScreen.tsx
    RoomLobbyScreen.tsx
    RoomScreen.tsx
    SettingsScreen.tsx
  components/
    RoomList.tsx
    ParticipantTile.tsx
    LocalPreview.tsx
    RoomControls.tsx
    ParticipantsSheet.tsx
    ChatSheet.tsx
  store/
    settingsStore.ts
    userStore.ts
  utils/
    links.ts
    errors.ts
    s3.ts
```

State:

- Use Zustand for auth, settings, user actions, LiveKit state.
- Use TanStack Query for room list, room details, profile fetch/cache.
- Store tokens in `expo-secure-store`.
- Store non-secret settings in AsyncStorage or Zustand `persist`.

## 6. Keycloak Auth Design

Web app uses `useKeycloak()` from Nuxt extras. Mobile must implement OIDC Authorization Code + PKCE.

Use `react-native-app-auth`:

```ts
export const keycloakConfig = {
  issuer: "https://id.rguk.ru/auth/realms/master",
  clientId: "vks",
  redirectUrl: "vksmobile:/oauthredirect",
  scopes: ["openid", "profile", "email", "offline_access"],
  serviceConfiguration: {
    authorizationEndpoint:
      "https://id.rguk.ru/auth/realms/master/protocol/openid-connect/auth",
    tokenEndpoint:
      "https://id.rguk.ru/auth/realms/master/protocol/openid-connect/token",
    revocationEndpoint:
      "https://id.rguk.ru/auth/realms/master/protocol/openid-connect/revoke",
    endSessionEndpoint:
      "https://id.rguk.ru/auth/realms/master/protocol/openid-connect/logout"
  }
};
```

Keycloak admin must allow:

- Client `vks` public/mobile flow, PKCE enabled.
- Redirect URI: `vksmobile:/oauthredirect`
- Post logout redirect URI if used.
- Web origins not relevant for native custom scheme.

Auth store responsibilities:

- `login()`: call `authorize(keycloakConfig)`.
- Save `accessToken`, `refreshToken`, `idToken`, `accessTokenExpirationDate`.
- `getAccessToken(minValiditySeconds = 5)`: if token near expiry, call `refresh()`.
- `logout()`: revoke/end session where possible, clear SecureStore and state.
- Decode token with `jwt-decode` for user id/roles/profile hints.

Important:

- Never store refresh token in AsyncStorage.
- Axios interceptor must call `getAccessToken(5)` and set `Authorization: Bearer <token>`.
- If refresh fails, clear auth and navigate to login.

## 7. API Port

Port `app/api/api.ts` with less web telemetry:

- Keep `ApiResponse<T>` and `ErrorResponse` shapes.
- Keep `ApiError`.
- Use axios `validateStatus: () => true`.
- Remove OpenTelemetry `context`, `trace`, `propagation` unless mobile telemetry added later.

VKS endpoints to port from `VksApi`:

- `GET /v1/rooms/available?search=`
- `POST /v1/rooms/:id/token`
- `GET /v1/rooms/:id`
- `POST /v1/rooms`
- `DELETE /v1/rooms/:roomId`
- `POST /v1/rooms/:roomId/end`
- `POST /v1/rooms/:roomId/kick`
- `POST /v1/rooms/:roomId/mute`
- `POST /v1/rooms/:roomId/unmute`
- `POST /v1/rooms/:roomId/soft-microphone-disable`
- `POST /v1/rooms/:roomId/soft-camera-disable`
- `POST /v1/rooms/:roomId/soft-screen-disable`

Admin endpoints can wait:

- `GET /v1/audit/stats`
- `GET /v1/audit/events`

ID API:

- `GET https://id.rguk.ru/personal/profile/:userId`
- `GET https://id.rguk.ru/personal/profile/bulk?ids=a,b,c`
- `student_groups` Directus query only if current group display needed.

Prefer plain axios for profile endpoints first. Add `@directus/sdk` later only if complex Directus filters become needed.

S3 avatar URL helper:

```ts
export function mapS3Url(bucket: string, key: string) {
  return `https://s3.kosygin-rsu.ru/${bucket}/${key}`;
}
```

## 8. LiveKit Port

Use `@livekit/react-native`, not `livekit-client`.

Startup:

- Import/register LiveKit globals at app entry if docs require for installed version.
- Keep `@livekit/react-native` plugin in `app.json`.
- Keep `react-native-webrtc`.
- Use `expo-keep-awake` while connected.

Port concepts from `app/stores/livekit.ts`:

- Keep non-reactive `Room` instance in module scope or Zustand ref.
- Track `connectionState`, `local`, `participants`, `messages`, `lastError`.
- Use participant snapshot model close to web, but remove browser-only `MediaStream` previews.
- Wire same events: connection state, participant connect/disconnect, track subscribed/unsubscribed/muted/unmuted, active speakers, metadata, data received.
- Chat remains LiveKit data channel topic `chat`, payload `{ t: "chat", text, ts }`.

Mobile-specific changes:

- Camera/microphone permissions use native permission prompts. Do not use `navigator.permissions`.
- Device selection is simpler. First MVP: toggles only, no camera/mic picker.
- Speaker routing differs by OS. Add basic speakerphone toggle only if LiveKit/RN WebRTC exposes stable API.
- Screen share publishing is separate native feature. Hide `screen` button in MVP or show disabled when unsupported.
- Use `VideoTrack` / LiveKit RN components for rendering video, not DOM media streams.
- Use `AppState` to pause/resume camera/mic behavior if needed.

Join flow:

1. User opens room route/deep link.
2. Load room via `GET /v1/rooms/:id`.
3. Press Join.
4. API `POST /v1/rooms/:id/token`.
5. LiveKit `room.connect(token.url, token.token)`.
6. Enable camera/mic according to settings.
7. Navigate/show `RoomScreen`.

## 9. Expo Router and Deep Links

Use Expo Router.

Routes:

- `app/index.tsx`: lobby room list.
- `app/rooms/[roomId].tsx`: room pre-join view when disconnected; connected conference view after LiveKit connect.
- `app/settings.tsx`: local media/settings.

Recommended route behavior:

- Root layout restores auth from SecureStore before showing protected content.
- If no auth session, show login screen/modal from `app/index.tsx` or redirect to an auth gate route.
- `rooms/[roomId].tsx` reads `roomId` with `useLocalSearchParams`.
- Query `?join=true` triggers auto-join only after auth and room metadata load.
- On disconnect, keep user on same room route and show pre-join lobby.

Deep links:

- `vksmobile://rooms/:roomId`
- `https://vcs.rguk.ru/rooms/:roomId` if universal/app links configured later.

Expo config:

```json
{
  "expo": {
    "scheme": "vksmobile",
    "plugins": ["expo-router"]
  }
}
```

Entry file:

```ts
import "expo-router/entry";
```

`getRoomLink(roomId)` should keep web link for sharing:

```ts
export function getRoomLink(roomId: string) {
  return `https://vcs.rguk.ru/rooms/${roomId}`;
}
```

Copy link uses `expo-clipboard`.

## 10. UI Port Guide

Replace Vue components with RN equivalents:

- `Rooms.vue` -> `LobbyScreen` + `RoomList`.
- `RoomsList.vue` -> `FlatList`, search input, join/copy/delete buttons.
- `ParticipantCardLocal.vue` -> `LocalPreview`.
- `ParticipantCard.vue` / `ParticipantCardMinimized.vue` -> `ParticipantTile`.
- `UserButtonControls.vue` -> `RoomControls`.
- `RoomMenu.vue` -> bottom sheet with tabs `Участники` / `Чат`.
- Modals -> `@gorhom/bottom-sheet` or native modal.

Mobile layout:

- Portrait: main active/pinned participant fills top; horizontal participant strip; controls bottom; participants/chat bottom sheet.
- Landscape: grid and controls compact.
- Use `SafeAreaView` and `react-native-safe-area-context`.
- Use stable tile aspect ratio `16:9`.

Suggested UI packages:

- `lucide-react-native` for icons.
- `react-native-svg` needed by icons.
- Custom minimal components first. Do not attempt to port Vue UI kit.

## 11. Roles and Permissions

Web allow-create logic:

```ts
roles.has("/admins/vks") ||
roles.has("/employees") ||
roles.has("/employees/teachers") ||
roles.has("/admins")
```

Mobile options:

- Decode roles from Keycloak access token if present.
- If roles are not in token, call profile/user endpoint from ID service if available.
- Keep server truth: room actions still controlled by backend and `room.can_manage`.

Moderator UI:

- Show create/delete/end/kick/soft-disable only when role or `room.can_manage` allows.
- Still handle `401/403` from API and show error.

## 12. Error Handling

Map web popup errors to mobile toast/snackbar/modal:

- API 401: show "Вы не авторизованы", clear auth when refresh fails.
- Room token failure: "Не удалось получить токен для входа".
- Room info failure: "Ошибка при загрузке информации о комнате".
- Camera/mic permission denied: ask user to enable in system settings.
- LiveKit connection failure: show `lastError`, disconnect, reset state.

Recommended dependency if no design system chosen:

```bash
npm install react-native-toast-message
```

Or build small in-app snackbar store.

## 13. Environment

Create mobile config module, not `.env` hardcoding everywhere:

```ts
export const env = {
  vksApiUrl: "https://vcs.rguk.ru/api",
  idApiUrl: "https://id.rguk.ru/personal",
  s3Url: "https://s3.kosygin-rsu.ru",
  keycloakUrl: "https://id.rguk.ru/auth",
  keycloakRealm: "master",
  keycloakClientId: "vks"
};
```

Later move to Expo config extra / EAS env:

- `EXPO_PUBLIC_VKS_API_URL`
- `EXPO_PUBLIC_ID_API_URL`
- `EXPO_PUBLIC_S3_URL`
- `EXPO_PUBLIC_KEYCLOAK_URL`
- `EXPO_PUBLIC_KEYCLOAK_REALM`
- `EXPO_PUBLIC_KEYCLOAK_CLIENT_ID`

## 14. Implementation Phases

Phase 1: foundation

- Add dependencies and app scheme/package IDs.
- Add Expo Router file routes.
- Add auth store with AppAuth + SecureStore.
- Add API client and VKS endpoints.
- Add room types.

Phase 2: lobby

- Build login gate.
- Build room list/search.
- Build create/delete room modal.
- Build copy link.
- Build deep link to room lobby.

Phase 3: LiveKit MVP

- Add LiveKit store.
- Connect/disconnect from room token.
- Render local/remote video/audio.
- Camera/mic toggle.
- Keep awake while connected.
- Basic participant list.

Phase 4: room UX parity

- Chat over data channel.
- Pin participant.
- Active speaker sorting.
- Bad connection indicator if metrics available.
- Moderator actions: kick, mute, soft camera/mic/screen disable.

Phase 5: polish

- Profile avatars/names from ID API.
- Persist settings.
- Empty/loading/error states.
- Orientation handling.
- Android/iOS permission copy.
- Production build with EAS.

Phase 6: deferred parity

- Admin audit dashboard.
- Mobile screen share.
- Advanced device picker.
- Telemetry/Uptrace equivalent.

## 15. Acceptance Criteria

MVP accepted when:

- Fresh app install opens login.
- Login redirects through Keycloak and persists session.
- Token refresh works after access token expiry.
- Lobby loads available rooms from `https://vcs.rguk.ru/api`.
- Teacher/admin can create/delete room if role permits.
- User can open shared room link and join.
- LiveKit room connects with audio/video.
- Remote participant video/audio appears.
- Mic/camera toggles update local publishing and UI.
- Chat sends/receives via LiveKit data channel.
- Logout clears tokens and returns to login.
- App survives background/foreground without stuck connected state.

## 16. Known Risks

- Keycloak client `vks` may not allow custom scheme redirects yet. Need server admin change.
- `react-native-app-auth` needs native build/dev client; Expo Go likely fails.
- LiveKit RN API differs from web SDK in rendering and media permissions.
- Mobile screen share is native-heavy and not MVP-safe.
- ID Directus auth helper `createKcDirectus` is Nuxt-only. Must replace with axios + bearer token.
- Role claims may differ between web profile store and raw Keycloak token. Verify token contents early.

## 17. First Coding Checklist

1. Install missing dependencies.
2. Add app scheme/package IDs.
3. Create `src/auth/authStore.ts` with login/refresh/logout/getAccessToken.
4. Create `src/api/apiClient.ts` and `src/api/vksApi.ts`.
5. Replace classic `App.tsx` entry with Expo Router entry.
6. Create `app/_layout.tsx`, `app/index.tsx`, `app/rooms/[roomId].tsx`.
7. Add providers/auth bootstrap in `app/_layout.tsx`.
8. Build `LobbyScreen` with room query and search.
9. Build `RoomLobbyScreen` with join button.
10. Build minimal `livekitStore`.
11. Build `RoomScreen` with participant tiles and controls.
