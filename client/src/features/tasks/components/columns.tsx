import { createColumnHelper } from "@tanstack/react-table";

import { type DataTableFeatures } from "../data-table-features";
import type { DailyRoutineTask } from "../tasks.types";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, DailyRoutineTask>();

export const columns = columnHelper.columns([
  columnHelper.accessor("taskStatus", {
    header: "Status",
  }),
  columnHelper.accessor("name", {
    header: "Task",
  }),
  columnHelper.accessor("streak", {
    header: "Streak",
  }),
]);
