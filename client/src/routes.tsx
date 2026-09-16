import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { DashboardPage } from "./features/dashboard";
import { TasksPage } from "./features/tasks";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
    ],
  },
]);

export default router;
