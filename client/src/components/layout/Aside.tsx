import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "../ui/sidebar";
import { Sun, Moon, Atom } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { routeConfig } from "@/routes";

const updateTheme = (theme: string) => {
  const body = document.querySelector("body");
  if (theme === "dark") {
    body?.classList.add("dark");
  } else {
    body?.classList.remove("dark");
  }
};

const Aside = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    updateTheme(theme);
  }, [theme]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2 p-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
              <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <Atom className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold text-sm leading-none truncate">
                    Atomic
                  </span>
                  <span className="text-xs text-muted-foreground leading-none truncate">
                    Progress
                  </span>
                </div>
              </div>
              <SidebarTrigger className="group-data-[collapsible=icon]:hidden cursor-pointer" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routeConfig.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        if (item.path !== "#") {
                          navigate(item.path);
                        }
                      }}
                      tooltip={item.name}
                    >
                      <Icon className="size-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
              <span className="group-data-[collapsible=icon]:hidden">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default Aside;
