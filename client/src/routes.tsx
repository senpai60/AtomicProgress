import { createBrowserRouter } from "react-router-dom";
import App from "./App";

import { DashboardPage } from "./features/dashboard";
import { TasksPage } from "./features/tasks";
import HabitsPage from "./features/habits/HabitsPage";

import { Home, CheckSquare, Flame, type LucideIcon } from "lucide-react";

export type RouteConfig = {
  path: string;
  name: string;
  element: React.ReactNode;
  icon: LucideIcon;
};

export const routeConfig: RouteConfig[] = [
  {
    path: "/",
    name: "Dashboard",
    element: <DashboardPage />,
    icon: Home,
  },
  {
    path: "/tasks",
    name: "Tasks",
    element: <TasksPage />,
    icon: CheckSquare,
  },
  {
    path: "/habits",
    name: "Habits",
    element: <HabitsPage />,
    icon: Flame,
  },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: routeConfig.map(({ path, element }) =>
      path === "/"
        ? { index: true, element }
        : { path: path.replace(/^\//, ""), element }
    ),
  },
]);

export default router;

