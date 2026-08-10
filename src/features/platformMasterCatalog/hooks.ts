import { useQuery } from "@tanstack/react-query";
import { platformMasterCatalogApi } from "./api";

export const platformMasterCatalogKeys = {
  all: ["platform-master-catalog"] as const,
};

export function usePlatformMasterCatalog(params: { search?: string; include_inactive?: boolean } = {}) {
  return useQuery({
    queryKey: [...platformMasterCatalogKeys.all, params],
    queryFn: () => platformMasterCatalogApi.get(params),
  });
}
