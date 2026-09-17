import { ipcMain } from "electron";
import { getHabits } from "../services/habites.service";

export const getHabitsIpc = () => {
  ipcMain.handle("get-habits", async () => {
    const habits = await getHabits();
    return habits;
  });
};
