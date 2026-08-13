import { Building2, ClipboardCheck, FolderKanban, GitBranch, HardHat, Home, LayoutGrid, Package, PanelLeftClose, PanelLeftOpen, Route, Settings, ShieldCheck, Tags, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const groups = [
  { label:"Platform", items:[
    ["/","Overview",Home,"OV"], ["/platform-setup","Organization Setup",Route,"OS"], ["/modules","Module Studio",Package,"MS"], ["/organization-provisioning","Module Provisioning",LayoutGrid,"MP"],
  ]},
  { label:"Organizations", items:[
    ["/organizations","Organizations",Building2,"OR"], ["/projects","Projects",FolderKanban,"PR"], ["/project-access","Project Access",ShieldCheck,"PA"], ["/users","Users",Users,"US"],
  ]},
  { label:"Configuration", items:[
    ["/taxonomy","Taxonomy",Tags,"TX"], ["/workflows","Workflow",GitBranch,"WF"], ["/checklists","Checklist",ClipboardCheck,"CK"], ["/room-catalog","Room & Flat Catalog",HardHat,"RC"],
  ]},
  { label:"System", items:[["/audit","Audit Log",ShieldCheck,"AL"],["/settings","Settings",Settings,"ST"]]},
] as const;

export function LeftRail() {
  const [collapsed,setCollapsed] = useState(()=>sessionStorage.getItem("siteos.railcollapsed")==="1");
  useEffect(()=>{sessionStorage.setItem("siteos.railcollapsed",collapsed?"1":"0")},[collapsed]);
  useEffect(()=>{ const h=(e:KeyboardEvent)=>{ if(e.key!=="[")return; const t=e.target as HTMLElement|null; if(t && (t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable)) return; setCollapsed(v=>!v)}; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h)},[]);
  return <aside className={`site-sidebar ${collapsed?"collapsed":""}`}>
    <div className="sidebar-head">{!collapsed?<span className="sidebar-eyebrow">Navigation</span>:<span className="nav-short">NAV</span>}<button className="sidebar-collapse" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<PanelLeftOpen size={14}/>:<PanelLeftClose size={14}/>}</button></div>
    <div className="sidebar-scroll">{groups.map(group=><div className="nav-group" key={group.label}>{!collapsed?<div className="nav-group-label">{group.label}</div>:null}{group.items.map(([to,label,Icon,short])=><NavLink end={to==="/"} key={to} to={to} className={({isActive})=>`nav-item ${isActive?"active":""}`} title={collapsed?label:undefined}>{collapsed?<span className="nav-short">{short}</span>:<><Icon/><span>{label}</span></>}</NavLink>)}</div>)}</div>
    <div className="sidebar-foot">{collapsed?<div className="live-dot"/>:<div className="sidebar-meta">Static UX prototype<br/>Design system · v0.2</div>}</div>
  </aside>;
}
