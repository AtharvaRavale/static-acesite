import { api } from "@/lib/api/client";
import type { AuthAccessContext } from "@/features/auth";
import type {
  WorkspaceAccessContextPayload,
  WorkspaceBootstrapResponse,
  WorkspaceModule,
  WorkspaceProject,
  WorkspaceProjectListParams,
  WorkspaceProjectModuleParams,
} from "./types";

export const workspaceApi = {
  bootstrap: async (): Promise<WorkspaceBootstrapResponse> => {
    const response = await api.get<WorkspaceBootstrapResponse>(
      "/rbac/workspace/bootstrap/"
    );
    return response.data;
  },

  projects: async (
    params: WorkspaceProjectListParams
  ): Promise<WorkspaceProject[]> => {
    const response = await api.get<WorkspaceProject[]>(
      "/rbac/workspace/projects/",
      {
        params: {
          organization: params.organization,
          organization_unit: params.organization_unit ?? undefined,
          role_assignment: params.role_assignment ?? undefined,
        },
      }
    );
    return response.data;
  },

  projectModules: async (
    params: WorkspaceProjectModuleParams
  ): Promise<WorkspaceModule[]> => {
    const response = await api.get<WorkspaceModule[]>(
      "/rbac/workspace/project-modules/",
      {
        params: {
          project: params.project,
          role_assignment: params.role_assignment ?? undefined,
        },
      }
    );
    return response.data;
  },

  updateCurrentAccessContext: async (
    payload: WorkspaceAccessContextPayload
  ): Promise<AuthAccessContext> => {
    const response = await api.patch<AuthAccessContext>(
      "/rbac/access-contexts/current/",
      payload
    );
    return response.data;
  },
};
