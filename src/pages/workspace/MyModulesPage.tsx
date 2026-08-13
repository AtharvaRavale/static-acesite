import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ModulePlate, PageHead } from "@/components/ui/ToolKit";
import { modules } from "@/lib/staticData";
export function MyModulesPage(){const [q,setQ]=useState("");const filtered=useMemo(()=>modules.filter(m=>(m.name+m.code).toLowerCase().includes(q.toLowerCase())),[q]);return <div className="page"><PageHead eyebrow="Workspace / Capability" title="My Modules" description="Modules available to the current organization and project. Disabled capabilities stay visible only when useful for discovery."/><div className="toolbar"><div className="searchbox"><Search/><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search available modules…"/></div><div className="grow"/><span className="ref">KUMAR / SKYLINE / PROJECT MANAGER</span></div><div className="module-grid">{filtered.map(m=><ModulePlate key={m.code} {...m}/>)}</div></div>}
