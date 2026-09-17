import Datastore from "@seald-io/nedb";
import path from "path";
import { app } from "electron";

const HABITS_DB_PATH = path.join(
  app.getPath("userData"),
  "atomic_progress_templates.db",
);
const SESSIONS_DB_PATH = path.join(
  app.getPath("userData"),
  "atomic_progress_sessions.db",
);

export const SESSIONS_DB = new Datastore({
  filename: SESSIONS_DB_PATH,
  autoload: true,
});
export const HABITS_DB = new Datastore({
  filename: HABITS_DB_PATH,
  autoload: true,
});
