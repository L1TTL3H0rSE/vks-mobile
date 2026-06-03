import { env } from "@/config/env";
import { ApiClient } from "./apiClient";
import type {
  CreateRoomRequest,
  ParticipantActionRequest,
  Room,
  TokenResponse,
} from "./types";

export class VksApi extends ApiClient {
  public constructor() {
    super(env.vksApiUrl);
  }

  public getAvailableRooms(search?: string) {
    return this.get<Room[]>("/v1/rooms/available", {
      params: { search },
    });
  }

  public getRoomToken(id: string) {
    return this.post<TokenResponse>(`/v1/rooms/${id}/token`);
  }

  public getRoomById(id: string) {
    return this.get<Room>(`/v1/rooms/${id}`);
  }

  public createRoom(body: CreateRoomRequest) {
    return this.post<Room>("/v1/rooms", body);
  }

  public deleteRoom(roomId: string) {
    return this.delete<void>(`/v1/rooms/${roomId}`);
  }

  public closeRoom(roomId: string) {
    return this.post<void>(`/v1/rooms/${roomId}/end`);
  }

  public kickUser(roomId: string, userId: string) {
    return this.participantAction(`/v1/rooms/${roomId}/kick`, userId);
  }

  public muteUser(roomId: string, userId: string) {
    return this.participantAction(`/v1/rooms/${roomId}/mute`, userId);
  }

  public unmuteUser(roomId: string, userId: string) {
    return this.participantAction(`/v1/rooms/${roomId}/unmute`, userId);
  }

  public softMicrophoneDisable(roomId: string, userId: string) {
    return this.participantAction(
      `/v1/rooms/${roomId}/soft-microphone-disable`,
      userId,
    );
  }

  public softCameraDisable(roomId: string, userId: string) {
    return this.participantAction(
      `/v1/rooms/${roomId}/soft-camera-disable`,
      userId,
    );
  }

  public softScreenDisable(roomId: string, userId: string) {
    return this.participantAction(
      `/v1/rooms/${roomId}/soft-screen-disable`,
      userId,
    );
  }

  private participantAction(url: string, userId: string) {
    const data: ParticipantActionRequest = { participant_id: userId };
    return this.post<void>(url, data);
  }
}

export const vksApi = new VksApi();
