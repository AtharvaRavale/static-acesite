import { Outlet, useLocation } from "react-router-dom";
import { LeftRail } from "./LeftRail";
import { TopBar } from "./TopBar";
import { WorkspaceTopBar } from "./WorkspaceTopBar";

function StatusBar({workspace}:{workspace:boolean}) {
  return <footer className="statusbar"><div className="status-left"><span className="live-dot"/><span>{workspace?"WORKSPACE CONTEXT READY":"PLATFORM CONSOLE READY"}</span><span>STATIC DATA</span></div><div className="status-right"><span>SiteOS UX Prototype</span><span>13 AUG 2026</span></div></footer>;
}
export function AppLayout() {
  const {pathname}=useLocation();
  const workspace=pathname.startsWith("/workspace")||pathname.startsWith("/snags");
  if(workspace) return <div className="site-shell workspace-shell"><WorkspaceTopBar/><main className="site-main workspace-main"><Outlet/></main><StatusBar workspace/></div>;
  return <div className="site-shell"><TopBar/><div className="site-body"><LeftRail/><main className="site-main"><Outlet/></main></div><StatusBar workspace={false}/></div>;
}
