import PageWrapper from "@/components/layout/PageWrapper";
import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "./data-table-features";

import { dailyRoutineTasks } from "./data";
import { TaskTable } from "./components/TaskTable";
import { columns } from "./components/columns";

const TasksPage = () => {
  return (
    <PageWrapper>
      <h1>Tasks</h1>
      <div className="tasks-container w-full h-full flex">
        <div className="check-tasks w-1/2 h-full">
          <TaskTable columns={columns} data={dailyRoutineTasks} />
        </div>
        <div className="session-tasks w-1/2 h-full"></div>
      </div>
    </PageWrapper>
  );
};

export default TasksPage;
