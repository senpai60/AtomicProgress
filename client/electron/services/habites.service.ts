import { HABITS_DB } from "../data/db";
import { randomUUID } from "node:crypto";

export const createHabit = async () => {
  return await HABITS_DB.count({}, async (err, count) => {
    if (err) {
      console.error("Failed to count habits:", err);
      return;
    }
    if (count > 0) return;
    await HABITS_DB.insert({
      id: randomUUID(),
      name: "Wake-Up",
      type: "default",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
};

export const getHabits = async () => {
  try {
    let habits = await HABITS_DB.findAsync({});
    if (habits.length <= 1) {
      await createHabit();
      habits = await HABITS_DB.findAsync({});
    }
    return habits;
  } catch (err) {
    throw new Error("Failed to fetch habits" + err);
  }
};
