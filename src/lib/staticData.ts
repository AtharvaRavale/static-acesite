export const organizations = [
  { id: 1, code: "ORG-8QM2K4TP", name: "Kumar Constructions Pvt Ltd", city: "Mumbai", flow: "SELF + PARTNER", status: "Active", modules: 9, projects: 12, users: 86, readiness: 86 },
  { id: 2, code: "ORG-2XK9L1AB", name: "Deshmukh Architects LLP", city: "Pune", flow: "SELF", status: "Trial", modules: 4, projects: 4, users: 21, readiness: 42 },
  { id: 3, code: "ORG-7HN4P0CE", name: "Vertex Waterproofing", city: "Thane", flow: "PARTNER", status: "Suspended", modules: 2, projects: 6, users: 14, readiness: 18 },
  { id: 4, code: "ORG-5LP8A2KD", name: "Westline Infra Projects", city: "Navi Mumbai", flow: "SELF + PARTNER", status: "Active", modules: 11, projects: 19, users: 142, readiness: 94 },
  { id: 5, code: "ORG-1QF7M6RU", name: "Apex MEP Services", city: "Bengaluru", flow: "PARTNER", status: "Active", modules: 5, projects: 8, users: 34, readiness: 73 },
];

export const projects = [
  { code:"PRJ-001", name:"Skyline Tower", org:"Kumar Constructions Pvt Ltd", unit:"Mumbai Region", stage:"Construction", status:"Active", completion:64, team:42 },
  { code:"PRJ-002", name:"Green Heights", org:"Kumar Constructions Pvt Ltd", unit:"Pune Region", stage:"Finishing", status:"Active", completion:81, team:28 },
  { code:"PRJ-003", name:"Metro Plaza", org:"Kumar Constructions Pvt Ltd", unit:"Mumbai Region", stage:"Structure", status:"Draft", completion:37, team:31 },
  { code:"PRJ-004", name:"Harbour Residences", org:"Westline Infra Projects", unit:"Coastal Division", stage:"Pre-construction", status:"Active", completion:16, team:19 },
  { code:"PRJ-005", name:"Civic Centre", org:"Westline Infra Projects", unit:"Government Projects", stage:"Handover", status:"Active", completion:96, team:24 },
];

export const modules = [
  { code:"PROJECT", name:"Project Management", description:"Project identity, teams, structure and delivery context.", status:"LIVE", art:"/module-plates/schedule.svg", pending:"12 projects" },
  { code:"TAXONOMY", name:"Taxonomy", description:"Classification masters and reusable project terminology.", status:"LIVE", art:"/module-plates/mas.svg", pending:"8 taxonomies" },
  { code:"WORKFLOW", name:"Workflow", description:"Approval routes, SLAs, assignments and outcomes.", status:"LIVE", art:"/module-plates/rfi.svg", pending:"3 reviews" },
  { code:"CHECKLIST", name:"Checklist", description:"Inspection templates, questions and runtime records.", status:"LIVE", art:"/module-plates/checklist.svg", pending:"18 assigned" },
  { code:"SNAG", name:"Snag Management", description:"Defect capture, repair cycles, review and closure.", status:"LIVE", art:"/module-plates/snag.svg", pending:"7 open" },
  { code:"WIR", name:"Work Inspection Request", description:"Formal work inspection requests and approvals.", status:"TRIAL", art:"/module-plates/wir.svg", pending:"4 due" },
  { code:"MIR", name:"Material Inspection Request", description:"Material receipt and inspection control.", status:"LIVE", art:"/module-plates/mir.svg", pending:"6 pending" },
  { code:"DMS", name:"Documents · DMS", description:"Controlled documents, revisions and transmittals.", status:"READ ONLY", art:"/module-plates/dms.svg", pending:"214 docs" },
  { code:"RFI", name:"Request for Information", description:"Design clarifications and formal response tracking.", status:"OFF", art:"/module-plates/rfi.svg" },
  { code:"NCR", name:"Non-Conformance", description:"Corrective actions for quality non-conformance.", status:"OFF", art:"/module-plates/ncr.svg" },
  { code:"DAILY", name:"Daily Log", description:"Daily site diary, photos, weather and constraints.", status:"OFF", art:"/module-plates/daily-log.svg" },
  { code:"ANALYTICS", name:"Analytics", description:"Portfolio health, trend analysis and operational insights.", status:"TRIAL", art:"/module-plates/analytics.svg", pending:"5 reports" },
];

export const platformModules = [
  ...modules,
  { code:"RBAC", name:"Roles & Access", description:"Contextual role assignments and permission registry.", status:"LIVE", art:"/module-plates/roles-rbac.svg", pending:"26 roles" },
  { code:"NOTIFY", name:"Notifications", description:"Escalations, reminders and action notifications.", status:"LIVE", art:"/module-plates/notify.svg", pending:"9 rules" },
  { code:"AUDIT", name:"Audit", description:"Immutable operational and administration activity trail.", status:"LIVE", art:"/module-plates/audit.svg", pending:"1.8k events" },
];

export const people = [
  { name:"Vasi Sayed", email:"vasi@kumar.example", role:"Project Manager", scope:"Mumbai Region", status:"Active", last:"Today, 00:12" },
  { name:"Aisha Shaikh", email:"aisha@kumar.example", role:"Organization Admin", scope:"Entire organization", status:"Active", last:"Yesterday, 18:42" },
  { name:"Rohan Mehta", email:"rohan@kumar.example", role:"Quality Manager", scope:"Skyline Tower", status:"Active", last:"Yesterday, 16:10" },
  { name:"Neha Patil", email:"neha@kumar.example", role:"Site Engineer", scope:"Skyline Tower", status:"Active", last:"12 Aug, 20:31" },
  { name:"Arjun Nair", email:"arjun@kumar.example", role:"Viewer", scope:"Pune Region", status:"Invited", last:"Never" },
];

export const orgUnits = [
  { name:"Kumar Constructions Pvt Ltd", code:"ORG", depth:0, type:"Organization", projects:12, users:86 },
  { name:"Mumbai Region", code:"UNIT-MUM", depth:1, type:"Region", projects:7, users:52 },
  { name:"Western Projects", code:"UNIT-WEST", depth:2, type:"Business Unit", projects:4, users:31 },
  { name:"Skyline Site Office", code:"UNIT-SKY", depth:3, type:"Site Office", projects:1, users:18 },
  { name:"Pune Region", code:"UNIT-PUN", depth:1, type:"Region", projects:5, users:34 },
  { name:"Residential Projects", code:"UNIT-RES", depth:2, type:"Business Unit", projects:3, users:22 },
];

export const departments = [
  { code:"DEPT-CIV", name:"Civil", lead:"Rohan Mehta", units:4, members:32, status:"Active" },
  { code:"DEPT-QA", name:"Quality Assurance", lead:"Aisha Kulkarni", units:3, members:14, status:"Active" },
  { code:"DEPT-MEP", name:"MEP", lead:"Arjun Rao", units:4, members:21, status:"Active" },
  { code:"DEPT-HSE", name:"Health & Safety", lead:"Nikhil Shah", units:5, members:11, status:"Active" },
  { code:"DEPT-COM", name:"Commercial", lead:"Meera Jain", units:2, members:9, status:"Active" },
];

export const partners = [
  { code:"PAR-001", name:"Vertex Waterproofing", type:"Subcontractor", contact:"Imran Khan", phone:"+91 98201 44562", projects:3, status:"Active" },
  { code:"PAR-002", name:"Apex MEP Services", type:"MEP Contractor", contact:"Dev Menon", phone:"+91 98920 11593", projects:5, status:"Active" },
  { code:"PAR-003", name:"Deshmukh Architects LLP", type:"Architect", contact:"Riya Deshmukh", phone:"+91 98208 70142", projects:4, status:"Active" },
  { code:"PAR-004", name:"GeoTest Labs", type:"Testing Agency", contact:"Aman Soni", phone:"+91 99300 22714", projects:2, status:"Active" },
];

export const taxonomyRows = [
  { code:"TAX-QA", name:"Quality Classification", categories:34, modules:"Checklist, Snag, WIR", scope:"Platform", status:"Published" },
  { code:"TAX-WORK", name:"Work Type", categories:58, modules:"WIR, Checklist", scope:"Platform", status:"Published" },
  { code:"TAX-MAT", name:"Material Classification", categories:46, modules:"MIR", scope:"Organization", status:"Published" },
  { code:"TAX-ISS", name:"Issue Type", categories:21, modules:"Snag, NCR", scope:"Organization", status:"Draft" },
];

export const workflows = [
  { code:"WF-QA-01", name:"Standard Quality Approval", module:"Checklist", steps:4, scope:"All projects", status:"Published", sla:"24h" },
  { code:"WF-SNAG-02", name:"Snag Repair & Review", module:"Snag", steps:5, scope:"Residential", status:"Published", sla:"48h" },
  { code:"WF-WIR-01", name:"Work Inspection Approval", module:"WIR", steps:3, scope:"Skyline Tower", status:"Published", sla:"12h" },
  { code:"WF-MIR-01", name:"Material Inspection", module:"MIR", steps:4, scope:"All projects", status:"Draft", sla:"24h" },
];

export const checklists = [
  { code:"CHK-WP-01", name:"Waterproofing Inspection", questions:18, mappings:12, module:"Checklist", status:"Published", version:"v3.2" },
  { code:"CHK-RCC-02", name:"RCC Pre-Pour", questions:26, mappings:8, module:"Checklist", status:"Published", version:"v2.1" },
  { code:"CHK-MEP-04", name:"MEP First Fix", questions:21, mappings:7, module:"Checklist", status:"Draft", version:"v1.4" },
  { code:"CHK-HO-01", name:"Apartment Handover", questions:44, mappings:3, module:"Checklist", status:"Published", version:"v5.0" },
];

export const snags = [
  { id:"SN-1042", title:"Water seepage at toilet sunken slab", location:"Tower A / Floor 08 / Flat 803 / Toilet 1", severity:"High", assignee:"Vertex Waterproofing", due:"14 Aug", status:"Open" },
  { id:"SN-1039", title:"Hollow tile detected near balcony door", location:"Tower A / Floor 07 / Flat 704 / Living", severity:"Medium", assignee:"StoneCraft", due:"15 Aug", status:"Repairing" },
  { id:"SN-1032", title:"Uneven paint finish on feature wall", location:"Tower B / Floor 04 / Flat 403 / Bedroom", severity:"Low", assignee:"ColorLine", due:"18 Aug", status:"Review" },
  { id:"SN-1028", title:"Door frame alignment outside tolerance", location:"Tower A / Floor 06 / Flat 601 / Entry", severity:"Medium", assignee:"WoodWorks", due:"13 Aug", status:"Overdue" },
];
