const { contextBridge, ipcRenderer } = require('electron');

// database use
contextBridge.exposeInMainWorld("dbAPI", {
    run: (sql, params) => ipcRenderer.invoke("database","run", sql, params),
    get: (sql, params) => ipcRenderer.invoke("database","get", sql, params),
    all: (sql, params) => ipcRenderer.invoke("database","all", sql, params),
});

// logger get
contextBridge.exposeInMainWorld("loggerAPI", {
    error: (message) => ipcRenderer.invoke("logger","error", `[RENDERER] ${message}`),
    warn: (message) => ipcRenderer.invoke("logger","warn", `[RENDERER] ${message}`),
    info: (message) => ipcRenderer.invoke("logger","info", `[RENDERER] ${message}`),
    debug: (message) => ipcRenderer.invoke("logger","debug", `[RENDERER] ${message}`),
});

// electron API
contextBridge.exposeInMainWorld('electronAPI', {
    closeApp: () => ipcRenderer.send('close-app'),
    minimizeApp: () => ipcRenderer.send('minimize-app'),
    onThemeUpdate: (callback) => ipcRenderer.on("theme-update", (_, theme) => callback(theme)),
    themeUpdate: () => ipcRenderer.invoke("themeUpdate"),
    openFile: (file) => ipcRenderer.invoke("open-file", file),
});

// config getter
contextBridge.exposeInMainWorld("appConfig", {
    get: () => ipcRenderer.invoke("get-config"),
    getTheme: () => ipcRenderer.invoke("get-theme"),
    getLanguage: () => ipcRenderer.invoke("get-language"),
});

// update mode 
contextBridge.exposeInMainWorld("Updater", {
    updateMode: (mode) => ipcRenderer.invoke("update-mode", mode)
});