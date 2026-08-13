import { Bell, Command, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const navigate = useNavigate();
  return <header className="site-topbar">
    <div className="topbar-brand"><div className="brand-mark">SO</div><span className="brand-word">SiteOS</span></div>
    <div className="topbar-context"><span className="crumb">Platform Console</span><span style={{color:"var(--line-strong)"}}>/</span><strong>Operations Workspace</strong></div>
    <div className="topbar-spacer"/>
    <button className="topbar-action" title="Search"><Search size={15}/></button>
    <button className="topbar-action" title="Command palette"><Command size={15}/></button>
    <button className="topbar-action" title="Notifications"><Bell size={15}/></button>
    <div className="user-chip"><div className="user-avatar">AR</div><div className="user-copy"><strong>A. Rao</strong><span>Superadmin</span></div></div>
    <button className="topbar-action" title="Switch to login" onClick={()=>navigate("/login")}><LogOut size={15}/></button>
  </header>;
}
