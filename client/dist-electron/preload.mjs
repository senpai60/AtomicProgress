"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  getHabits: () => electron.ipcRenderer.invoke("get-habits")
});
