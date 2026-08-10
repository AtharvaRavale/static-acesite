import { api } from "@/lib/api";

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };
export type WorkflowStatus = "draft" | "published" | "archived";

export interface WorkflowTemplate {
  id: number; organization: number | null; organization_name?: string | null;
  organization_module: number | null; module: number; module_name: string; module_code: string;
  name: string; code: string; description: string; status: WorkflowStatus; published_at?: string | null;
  change_notes: string; is_active: boolean; is_editable: boolean; group_count: number; step_count: number;
  scope_type: "global" | "organization";
}
export interface StepGroup { id:number; template:number; name:string; display_order:number; parallel_mode:string; on_approval_action:string; on_approval_target_group:number|null; on_rejection_action:string; on_rejection_target_group:number|null; step_count:number; steps:WorkflowStep[] }
export interface WorkflowOutcomePolicy { id?:number; behavior:"positive"|"negative"|"neutral"; label:string; requires_remarks:boolean; requires_signature:boolean; min_attachments_required:number }
export interface WorkflowStep { id:number; group:number; name:string; code:string; display_order:number; assignment_type:string; target_role:number|null; target_team:number|null; named_user:number|null; fallback_user:number|null; pool_resolution:string; step_kind:string; sla_hours:number|null; timeout_action:string; requires_remarks:boolean; requires_signature:boolean; min_attachments_required:number; outcome_policies:WorkflowOutcomePolicy[] }
export interface WorkflowAssignmentOptions { roles:Array<{id:number;name:string;code:string;module_id:number|null;scope:string}>; users:Array<{id:number;name:string;email:string;membership_type:string;role_ids:number[]}>; teams:Array<{id:number;name:string;project_id:number;project_name:string;party_name:string}> }
export interface Applicability { id:number; project:number; project_name:string; module:number; module_name:string; workflow_template:number; workflow_template_name:string; execution_scope:"all_schemes"|"scheme"|"level"; execution_scope_label:string; execution_scheme:number|null; execution_scheme_name:string|null; execution_level:number|null; execution_level_name:string|null; area_type:string; priority:number; is_specific:boolean; location_count:number; is_active:boolean }

function qs(params: Record<string, unknown> = {}) { const s=new URLSearchParams(); Object.entries(params).forEach(([k,v])=>{ if(v!==undefined&&v!==null&&v!=="") s.set(k,String(v)); }); const q=s.toString(); return q?`?${q}`:""; }
export const workflowApi = {
  templates: (params:Record<string,unknown>={}) => api.get<Page<WorkflowTemplate>>(`/workflow-templates/${qs(params)}`).then(r=>r.data),
  template: (id:number) => api.get<WorkflowTemplate & {step_groups:StepGroup[]}>(`/workflow-templates/${id}/definition/`).then(r=>r.data),
  createTemplate: (payload:Record<string,unknown>) => api.post<WorkflowTemplate>("/workflow-templates/",payload).then(r=>r.data),
  updateTemplate: (id:number,payload:Record<string,unknown>) => api.patch<WorkflowTemplate>(`/workflow-templates/${id}/`,payload).then(r=>r.data),
  publish: (id:number) => api.post<WorkflowTemplate>(`/workflow-templates/${id}/publish/`,{}).then(r=>r.data),
  archive: (id:number) => api.post<WorkflowTemplate>(`/workflow-templates/${id}/archive/`,{}).then(r=>r.data),
  groups: (template:number) => api.get<Page<StepGroup>>(`/workflow-step-groups/${qs({template,page_size:500})}`).then(r=>r.data),
  createGroup: (payload:Record<string,unknown>) => api.post<StepGroup>("/workflow-step-groups/",payload).then(r=>r.data),
  updateGroup: (id:number,payload:Record<string,unknown>) => api.patch<StepGroup>(`/workflow-step-groups/${id}/`,payload).then(r=>r.data),
  removeGroup: (id:number) => api.delete(`/workflow-step-groups/${id}/`),
  createStep: (payload:Record<string,unknown>) => api.post<WorkflowStep>("/workflow-steps/",payload).then(r=>r.data),
  assignmentOptions: (template:number) => api.get<WorkflowAssignmentOptions>(`/workflow-templates/${template}/assignment-options/`).then(r=>r.data),
  updateStep: (id:number,payload:Record<string,unknown>) => api.patch<WorkflowStep>(`/workflow-steps/${id}/`,payload).then(r=>r.data),
  removeStep: (id:number) => api.delete(`/workflow-steps/${id}/`),
  applicabilities: (params:Record<string,unknown>={}) => api.get<Page<Applicability>>(`/workflow-applicabilities/${qs(params)}`).then(r=>r.data),
  createApplicability: (payload:Record<string,unknown>) => api.post<Applicability>("/workflow-applicabilities/",payload).then(r=>r.data),
  updateApplicability: (id:number,payload:Record<string,unknown>) => api.patch<Applicability>(`/workflow-applicabilities/${id}/`,payload).then(r=>r.data),
  removeApplicability: (id:number) => api.delete(`/workflow-applicabilities/${id}/`),
  applicabilityLocations: (applicability:number) => api.get<Page<{id:number;applicability:number;location_node:number;location_node_name:string;location_node_full_path:string;include_descendants:boolean;is_active:boolean}>>(`/workflow-applicability-locations/${qs({applicability,page_size:500})}`).then(r=>r.data),
  createApplicabilityLocation: (payload:Record<string,unknown>) => api.post("/workflow-applicability-locations/",payload).then(r=>r.data),
  removeApplicabilityLocation: (id:number) => api.delete(`/workflow-applicability-locations/${id}/`),
  genericList: <T>(path:string, params:Record<string,unknown>={}) => api.get<Page<T>>(`${path}${qs(params)}`).then(r=>r.data),
};
