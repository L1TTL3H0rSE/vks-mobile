import { env } from "@/config/env";
import { ApiClient } from "./apiClient";
import type { ApiResponse, Profile } from "./types";

function unwrapData<T>(body: T | ApiResponse<T>): T {
  if (typeof body === "object" && body !== null && "error" in body) {
    if (body.error === true) throw new Error(body.message);
  }

  if (typeof body === "object" && body !== null && "data" in body) {
    return body.data as T;
  }

  return body as T;
}

class IdApi extends ApiClient {
  public constructor() {
    super(env.idApiUrl);
  }

  public async readPublicProfile(id: string) {
    const response = await this.axios.get<Profile | ApiResponse<Profile>>(
      `/profile/${id}`,
    );
    return unwrapData<Profile>(response.data);
  }

  public async readPublicProfiles(ids: string[]) {
    if (ids.length === 0) return [];
    const response = await this.axios.get<Profile[] | ApiResponse<Profile[]>>(
      "/profile/bulk",
      {
        params: { ids: ids.join(",") },
      },
    );
    return unwrapData<Profile[]>(response.data);
  }
}

export const idApi = new IdApi();
