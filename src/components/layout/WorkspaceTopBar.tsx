import { Bell, ChevronDown, Grid3X3, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function WorkspaceTopBar() {
  const navigate=useNavigate();
  const [org,setOrg]=useState("Kumar Constructions / Mumbai Region");
  const [role,setRole]=useState("Project Manager");
  const [project,setProject]=useState("Skyline Tower");
  const selector=(label:string,value:string,setter:(v:string)=>void,options:string[],className="")=><div className={`workspace-selector ${className}`}><div><span className="label">{label}</span><strong>{value}</strong></div><ChevronDown size={13} style={{marginLeft:"auto",color:"var(--faint)"}}/><select value={value} onChange={e=>setter(e.target.value)}>{options.map(x=><option key={x}>{x}</option>)}</select></div>;
  return <header className="workspace-topbar"><button className="workspace-brand" style={{border:0,borderRight:"1px solid var(--line)",background:"transparent"}} onClick={()=>navigate("/workspace")}><div className="brand-mark">SO</div><span className="brand-word">SiteOS</span></button>
    {selector("Organization / Unit",org,setOrg,["Kumar Constructions / Mumbai Region","Kumar Constructions / Pune Region","Deshmukh Architects / Design Cell"])}
    {selector("Access role",role,setRole,["Project Manager","Quality Manager","Organization Admin","Site Engineer"],"role-selector")}
    {selector("Project",project,setProject,["Skyline Tower","Green Heights","Metro Plaza"])}
    <div style={{flex:1}}/>
    <button className="topbar-action" title="Modules" onClick={()=>navigate("/workspace")}><Grid3X3 size={15}/></button>
    <button className="topbar-action" title="Settings" onClick={()=>navigate("/workspace/settings")}><Settings size={15}/></button>
    <button className="topbar-action" title="Notifications"><Bell size={15}/></button>
    <div className="user-chip"><div className="user-avatar">VS</div><div className="user-copy"><strong>Vasi Sayed</strong><span>{role}</span></div></div>
    <button className="topbar-action" onClick={()=>navigate("/login")}><LogOut size={15}/></button>
  </header>;
}
