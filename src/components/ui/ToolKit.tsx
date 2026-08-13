import type { ReactNode } from "react";
import { Check, ChevronRight, Search, X } from "lucide-react";

export function PageHead({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="page-head"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-subtitle">{description}</p></div>{actions ? <div className="head-actions">{actions}</div> : null}</div>;
}

export function SearchBox({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div className="searchbox"><Search/><input className="input" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/></div>;
}

export function Status({ tone = "muted", children }: { tone?: "green"|"amber"|"red"|"blue"|"muted"; children: ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}

export function Metric({ label, value, foot }: { label: string; value: string|number; foot: string }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot">{foot}</div></div>;
}

export function Panel({ title, kicker, action, children, className = "" }: { title?: string; kicker?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{title || kicker || action ? <div className="panel-head"><div>{kicker ? <div className="panel-kicker">{kicker}</div>:null}{title ? <div className="panel-title">{title}</div>:null}</div>{action}</div>:null}<div className="panel-body">{children}</div></section>;
}

export function Tabs({ items, value, onChange }: { items: string[]; value: string; onChange: (value:string)=>void }) {
  return <div className="tabs">{items.map(item=><button key={item} className={`tab ${item===value?"active":""}`} onClick={()=>onChange(item)}>{item}</button>)}</div>;
}

export function Drawer({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose:()=>void; children: ReactNode; footer?: ReactNode }) {
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="drawer" onMouseDown={(e)=>e.stopPropagation()}><div className="drawer-head"><div><div className="panel-kicker">Editor</div><div className="panel-title">{title}</div>{subtitle ? <div className="faint" style={{fontSize:10,marginTop:2}}>{subtitle}</div>:null}</div><button className="btn ghost small" onClick={onClose}><X size={14}/></button></div><div className="drawer-body">{children}</div>{footer ? <div className="drawer-foot">{footer}</div>:null}</aside></div>;
}

export function Stepper({ steps, active }: { steps: string[]; active: number }) {
  return <div className="stepper">{steps.map((label,index)=><div key={label} className={`step ${index===active?"active":index<active?"done":""}`}><div className="step-num">{index<active?<Check size={11}/>:String(index+1).padStart(2,"0")}</div><div><strong>{label}</strong><span>{index<active?"Complete":index===active?"Current":"Pending"}</span></div></div>)}</div>;
}

export function TreeNode({ label, code, selected, depth = 0, onClick }: { label:string; code?:string; selected?:boolean; depth?:number; onClick?:()=>void }) {
  return <button className={`tree-node ${selected?"selected":""}`} style={{paddingLeft:7+depth*16,width:"100%",textAlign:"left"}} onClick={onClick}><span className="tree-dot"/><span style={{flex:1}}>{label}</span>{code?<span className="ref">{code}</span>:null}<ChevronRight size={12}/></button>;
}

export function Toast({ children }: { children: ReactNode }) {
  return <div className="toast-static"><Check size={15} color="var(--green)"/><div>{children}</div></div>;
}

export function ModulePlate({ code, name, description, status = "LIVE", art, onClick, pending }: { code:string; name:string; description:string; status?:string; art?:string; onClick?:()=>void; pending?:string }) {
  const tone = status === "LIVE" ? "green" : status === "TRIAL" ? "amber" : status === "OFF" ? "muted" : "blue";
  return <button className={`module-plate ${status==="OFF"?"disabled":""}`} onClick={onClick} style={{textAlign:"left"}}><div className="module-art">{art?<img src={art} alt=""/>:<div className="fallback"/>}</div><div className="module-copy"><div className="module-code">{code}</div><div className="module-name">{name}</div><div className="module-desc">{description}</div><div className="module-foot"><Status tone={tone}>{status}</Status>{pending?<span className="ref">{pending}</span>:<span className="faint" style={{fontSize:9}}>OPEN MODULE</span>}</div></div></button>;
}
