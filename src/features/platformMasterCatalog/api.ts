import { api } from "@/lib/api";
import type { PlatformMasterCatalogResponse } from "./types";

export const platformMasterCatalogApi = {
  get: async (params: { search?: string; include_inactive?: boolean } = {}): Promise<PlatformMasterCatalogResponse> => {
    const search = new URLSearchParams();
    if (params.search) search.set("search", params.search);
    if (params.include_inactive) search.set("include_inactive", "true");
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return (await api.get<PlatformMasterCatalogResponse>(`/platform-master-catalog/${suffix}`)).data;
  },
};
