import Aside from "./components/layout/Aside";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "./components/ui/sidebar";
import { Separator } from "./components/ui/separator";
import { useState } from "react";
import { Outlet } from "react-router-dom";

function AppHeader() {
  const { open, isMobile } = useSidebar();
  const showTrigger = isMobile || !open;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      {showTrigger && (
        <>
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </>
      )}
      <div className="flex items-center gap-2 font-medium text-sm">
        <span>Atomic Progress</span>
      </div>
    </header>
  );
}

function App() {
  const [asideOpen, setAsideOpen] = useState(true);

  return (
    <SidebarProvider open={asideOpen} onOpenChange={setAsideOpen}>
      <Aside />
      <SidebarInset>
        <AppHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
