import { env } from "@/config/env";
import { ApiClient } from "./apiClient";
import type { Profile } from "./types";

class IdApi extends ApiClient {
  public constructor() {
    super(env.idApiUrl);
  }

  public async readPublicProfile(id: string) {
    const response = await this.axios.get<Profile>(`/profile/${id}`);
    return response.data;
  }

  public async readPublicProfiles(ids: string[]) {
    if (ids.length === 0) return [];
    const response = await this.axios.get<Profile[]>("/profile/bulk", {
      params: { ids: ids.join(",") },
    });
    return response.data;
  }
}

export const idApi = new IdApi();
