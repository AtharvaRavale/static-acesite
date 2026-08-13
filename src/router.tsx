import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { GenericToolPage } from "@/pages/GenericToolPage";

export const router=createBrowserRouter([
 {path:"/login",element:<LoginPage/>},
 {path:"/",element:<AppLayout/>,children:[
  {index:true,element:<DashboardPage/>},
  {path:"platform-setup",lazy:()=>import("@/pages/platformSetup/PlatformSetupWizardPage").then(m=>({Component:m.PlatformSetupWizardPage}))},
  {path:"modules",lazy:()=>import("@/pages/modules/ModuleCatalogPage").then(m=>({Component:m.ModuleCatalogPage}))},
  {path:"modules/new",lazy:()=>import("@/pages/modules/ModuleWizardPage").then(m=>({Component:m.ModuleWizardPage}))},
  {path:"modules/:moduleId/edit",lazy:()=>import("@/pages/modules/ModuleWizardPage").then(m=>({Component:m.ModuleWizardPage}))},
  {path:"modules/:moduleId",lazy:()=>import("@/pages/modules/ModuleStudioDetailPage").then(m=>({Component:m.ModuleStudioDetailPage}))},
  {path:"organization-provisioning",lazy:()=>import("@/pages/organizationProvisioning/OrganizationProvisioningPage").then(m=>({Component:m.OrganizationProvisioningPage}))},
  {path:"organizations",lazy:()=>import("@/pages/organizations/OrganizationsPage").then(m=>({Component:m.OrganizationsPage}))},
  {path:"organizations/:organizationId",lazy:()=>import("@/pages/organizations/OrganizationCommandCenterPage").then(m=>({Component:m.OrganizationCommandCenterPage}))},
  {path:"organizations/:organizationId/departments",lazy:()=>import("@/pages/organizations/DepartmentsPage").then(m=>({Component:m.DepartmentsPage}))},
  {path:"organizations/:organizationId/partners",lazy:()=>import("@/pages/organizations/PartnersPage").then(m=>({Component:m.PartnersPage}))},
  {path:"workspace",lazy:()=>import("@/pages/workspace/WorkspaceHomePage").then(m=>({Component:m.WorkspaceHomePage}))},
  {path:"workspace/modules",lazy:()=>import("@/pages/workspace/MyModulesPage").then(m=>({Component:m.MyModulesPage}))},
  {path:"workspace/organization",lazy:()=>import("@/pages/workspace/WorkspaceOrganizationPage").then(m=>({Component:m.WorkspaceOrganizationPage}))},
  {path:"workspace/access",lazy:()=>import("@/pages/workspace/WorkspaceAccessPage").then(m=>({Component:m.WorkspaceAccessPage}))},
  {path:"workspace/settings",lazy:()=>import("@/pages/workspace/WorkspaceSettingsPage").then(m=>({Component:m.WorkspaceSettingsPage}))},
  {path:"workspace/settings/:settingsSection",lazy:()=>import("@/pages/workspace/WorkspaceSettingsPage").then(m=>({Component:m.WorkspaceSettingsPage}))},
  {path:"workspace/project",lazy:()=>import("@/pages/workspace/project/WorkspaceProjectPage").then(m=>({Component:m.WorkspaceProjectPage}))},
  {path:"workspace/project/:projectSection",lazy:()=>import("@/pages/workspace/project/WorkspaceProjectPage").then(m=>({Component:m.WorkspaceProjectPage}))},
  {path:"projects",element:<GenericToolPage title="Projects"/>},{path:"master-catalog",element:<GenericToolPage title="Master Catalog"/>},{path:"project-access",element:<GenericToolPage title="Project Access"/>},
  {path:"taxonomy",lazy:()=>import("@/pages/platformAdmin/TaxonomyAdminPage").then(m=>({Component:m.TaxonomyAdminPage}))},
  {path:"workflows",lazy:()=>import("@/pages/workflow/WorkflowAdminPage").then(m=>({Component:m.WorkflowAdminPage}))},
  {path:"checklists",lazy:()=>import("@/pages/platformAdmin/ChecklistAdminPage").then(m=>({Component:m.ChecklistAdminPage}))},
  {path:"snags",lazy:()=>import("@/pages/workspace/SnagRuntimePage").then(m=>({Component:m.SnagRuntimePage}))},
  {path:"room-catalog",lazy:()=>import("@/pages/platformAdmin/RoomFlatCatalogPage").then(m=>({Component:m.RoomFlatCatalogPage}))},
  {path:"users",element:<GenericToolPage title="Users"/>},{path:"audit",element:<GenericToolPage title="Audit Log"/>},{path:"settings",element:<GenericToolPage title="Platform Settings"/>},
 ]}
]);
