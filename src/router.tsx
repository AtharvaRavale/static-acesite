import { createBrowserRouter } from "react-router-dom";
import {
  PlatformRoute,
  PlatformSuperuserRoute,
  ProtectedRoute,
  WorkspaceRoute,
} from "@/components/auth";
import { AppLayout } from "@/components/layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";

function withPlatform(lazyImport: () => Promise<{ Component: React.ComponentType }>) {
  return async () => {
    const mod = await lazyImport();
    const Page = mod.Component;
    return {
      Component: function PlatformGuardedPage() {
        return (
          <PlatformRoute>
            <Page />
          </PlatformRoute>
        );
      },
    };
  };
}

function withPlatformSuperuser(
  lazyImport: () => Promise<{ Component: React.ComponentType }>
) {
  return async () => {
    const mod = await lazyImport();
    const Page = mod.Component;
    return {
      Component: function PlatformSuperuserGuardedPage() {
        return (
          <PlatformSuperuserRoute>
            <Page />
          </PlatformSuperuserRoute>
        );
      },
    };
  };
}

function withWorkspace(lazyImport: () => Promise<{ Component: React.ComponentType }>) {
  return async () => {
    const mod = await lazyImport();
    const Page = mod.Component;
    return {
      Component: function WorkspaceGuardedPage() {
        return (
          <WorkspaceRoute>
            <Page />
          </WorkspaceRoute>
        );
      },
    };
  };
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "platform-setup",
        lazy: withPlatformSuperuser(() =>
          import("@/pages/platformSetup/PlatformSetupWizardPage").then((m) => ({
            Component: m.PlatformSetupWizardPage,
          }))
        ),
      },
      {
        path: "modules",
        lazy: withPlatform(() =>
          import("@/pages/modules/ModuleCatalogPage").then((m) => ({
            Component: m.ModuleCatalogPage,
          }))
        ),
      },
      {
        path: "modules/new",
        lazy: withPlatform(() =>
          import("@/pages/modules/ModuleWizardPage").then((m) => ({
            Component: m.ModuleWizardPage,
          }))
        ),
      },
      {
        path: "modules/:moduleId/edit",
        lazy: withPlatform(() =>
          import("@/pages/modules/ModuleWizardPage").then((m) => ({
            Component: m.ModuleWizardPage,
          }))
        ),
      },
      {
        path: "modules/:moduleId",
        lazy: withPlatform(() =>
          import("@/pages/modules/ModuleStudioDetailPage").then((m) => ({
            Component: m.ModuleStudioDetailPage,
          }))
        ),
      },
      {
        path: "organization-provisioning",
        lazy: withPlatform(() =>
          import("@/pages/organizationProvisioning/OrganizationProvisioningPage").then(
            (m) => ({
              Component: m.OrganizationProvisioningPage,
            })
          )
        ),
      },
      {
        path: "organizations",
        lazy: withPlatform(() =>
          import("@/pages/organizations/OrganizationsPage").then((m) => ({
            Component: m.OrganizationsPage,
          }))
        ),
      },
      {
        path: "organizations/:organizationId",
        lazy: withPlatform(() =>
          import("@/pages/organizations/OrganizationCommandCenterPage").then(
            (m) => ({
              Component: m.OrganizationCommandCenterPage,
            })
          )
        ),
      },
      {
        path: "organizations/:organizationId/departments",
        lazy: withPlatform(() =>
          import("@/pages/organizations/DepartmentsPage").then((m) => ({
            Component: m.DepartmentsPage,
          }))
        ),
      },
      {
        path: "organizations/:organizationId/partners",
        lazy: withPlatform(() =>
          import("@/pages/organizations/PartnersPage").then((m) => ({
            Component: m.PartnersPage,
          }))
        ),
      },
      {
        path: "workspace",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/WorkspaceHomePage").then((m) => ({
            Component: m.WorkspaceHomePage,
          }))
        ),
      },
      {
        path: "workspace/modules",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/WorkspaceHomePage").then((m) => ({
            Component: m.WorkspaceHomePage,
          }))
        ),
      },
      {
        path: "workspace/organization",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/WorkspaceOrganizationPage").then((m) => ({
            Component: m.WorkspaceOrganizationPage,
          }))
        ),
      },
      {
        path: "workspace/access",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/WorkspaceAccessPage").then((m) => ({
            Component: m.WorkspaceAccessPage,
          }))
        ),
      },
      {
        path: "workspace/settings",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/WorkspaceSettingsPage").then((m) => ({
            Component: m.WorkspaceSettingsPage,
          }))
        ),
      },
      {
        path: "workspace/settings/:settingsSection",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/WorkspaceSettingsPage").then((m) => ({
            Component: m.WorkspaceSettingsPage,
          }))
        ),
      },
      {
        path: "workspace/project",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/project/WorkspaceProjectPage").then((m) => ({
            Component: m.WorkspaceProjectPage,
          }))
        ),
      },
      {
        path: "workspace/project/:projectSection",
        lazy: withWorkspace(() =>
          import("@/pages/workspace/project/WorkspaceProjectPage").then((m) => ({
            Component: m.WorkspaceProjectPage,
          }))
        ),
      },
      {
        path: "projects",
        element: <PlaceholderPage title="Projects" />,
      },
      {
        path: "master-catalog",
        element: <PlaceholderPage title="Master Catalog" />,
      },
      {
        path: "taxonomy",
        lazy: () =>
          import("@/pages/platformAdmin/TaxonomyAdminPage").then((m) => ({
            Component: m.TaxonomyAdminPage,
          })),
      },
      {
        path: "project-access",
        element: <PlaceholderPage title="Project Access" />,
      },
      {
        path: "workflows",
        lazy: () =>
          import("@/pages/workflow/WorkflowAdminPage").then((m) => ({
            Component: m.WorkflowAdminPage,
          })),
      },
      {
        path: "checklists",
        lazy: () =>
          import("@/pages/platformAdmin/ChecklistAdminPage").then((m) => ({
            Component: m.ChecklistAdminPage,
          })),
      },
      {
        path: "room-catalog",
        lazy: withPlatformSuperuser(() =>
          import("@/pages/platformAdmin/RoomFlatCatalogPage").then((m) => ({
            Component: m.RoomFlatCatalogPage,
          }))
        ),
      },
      {
        path: "users",
        element: <PlaceholderPage title="Users" />,
      },
      {
        path: "audit",
        element: <PlaceholderPage title="Audit Log" />,
      },
      {
        path: "settings",
        element: <PlaceholderPage title="Settings" />,
      },
    ],
  },
]);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-1">
      <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Platform
      </p>
      <h1 className="font-logo text-[1.65rem] font-normal tracking-tight text-foreground">
        {title}
      </h1>
      <p className="text-[13px] text-muted-foreground">
        This page is under construction.
      </p>
    </div>
  );
}
