import { Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { WorkspaceProvider } from "@/features/workspace";
import { LeftRail } from "./LeftRail";
import { TopBar } from "./TopBar";
import { WorkspaceTopBar } from "./WorkspaceTopBar";

export function AppLayout() {
  const { user } = useAuth();

  /*
   * NON-PLATFORM WORKSPACE
   *
   * WorkspaceProvider MUST wrap:
   * - WorkspaceTopBar
   * - Workspace Home
   * - Workspace Settings
   * - any other component using useWorkspace()
   */
  if (user?.user_type === "non_platform") {
    return (
      <WorkspaceProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <WorkspaceTopBar />

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </WorkspaceProvider>
    );
  }

  /*
   * PLATFORM / SUPERADMIN LAYOUT
   */
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <LeftRail />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}