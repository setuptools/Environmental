const {app , BrowserWindow, ipcMain , Menu,Tray, ipcRenderer, shell} = require("electron");
const nativeImage = require("electron").nativeImage;
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const logger = require("./scripts/logger");


let appTitle = "Environmental";
let Environmental
let tray = null; 
let trayContextMenu;   

let theme;
let config;
let language;
let db;

const getLock = app.requestSingleInstanceLock();

async function loadFiles() {
    try {
        logger.info("Load files");

        const configData = await fs.promises.readFile('config.json', 'utf-8');
        config = JSON.parse(configData);
        

        const themeData = await fs.promises.readFile(`./assets/themes/${config["theme"]}.json`, 'utf-8');
        theme = JSON.parse(themeData);

        const languageData = await fs.promises.readFile(`./assets/languages/${config["language"]}.json`, 'utf-8');
        language = JSON.parse(languageData);

        // Немедленное обновление темы
        if (Environmental) {
            Environmental.webContents.send("theme-update", theme);
            Environmental.setAlwaysOnTop(config["alwaysOnTop"]);
        }
    } catch (err) {
        logger.error(`An error occured: ${err}`);
    }
}

// хендлы для ipcMain
function handles(){
    // config getters
    ipcMain.handle("get-config", () =>{
        if (config["logging"]) logger.info("Config get");
        return config;
    });

    ipcMain.handle("get-theme", () =>{;
        return theme;
    });

    ipcMain.handle("get-language", () =>{
        return language;
    });

    ipcMain.handle("update-mode", async (e,mode)=>{
        config["last-mode"] = mode;
        try {
            await fs.promises.writeFile("config.json", JSON.stringify(config, null, 4));
            return { success: true };
        } catch (err) {
            logger.error("Ошибка при сохранении config.json:", err);
            return { success: false, error: err.message };
        }
    } );

    // top-app-bar callbakcs
    ipcMain.on('close-app', (event) => {
        if (config["hideOnClose"] == true) {
            event.preventDefault();
            Environmental.hide();

            createTray();
            if (config["logging"]) logger.info("Window hide");
        } else {   
            if (config["logging"]) logger.info("Window close");
            Environmental.close();
        }
    });

    ipcMain.on("minimize-app", () => {
        if (config["logging"]) logger.info("Window minimize");
        Environmental.minimize();
    });

    ipcMain.handle("themeUpdate", ()=>{
        if (config["logging"]) logger.info("Theme update");
        Environmental.webContents.send("theme-update", theme);
    });

    // logger
    ipcMain.handle("logger", (event,level,message) => {
        level = level.toLowerCase();

        if (config["logging"]) {
            if (level == "info") {logger.info(message)}
            else if (level == "error") {logger.error(message)}
            else if (level == "debug") {logger.debug(message)}
            else if (level == "warn") {logger.warn(message)}

        }
    });

    // db use
    ipcMain.handle("database", (event, action ,sql, params) => {
        // run - run sql command
        if (action == "run"){
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) {
                        logger.error(`Database error: ${err.message}`);
                        reject(new Error(err.message));
                    } else {
                        resolve(this.changes);
                    }
                });
            });
        } 
        // get - get one row
        else if (action == "get") {
            return new Promise((resolve, reject) => {
                db.get(sql, params, function(err,data) {
                    if (err) {
                        logger.error(`Database error: ${err.message}`);
                        reject(new Error(err.message));
                    } else {
                        resolve(data);
                    }
                });
            });
        } 
        // getAll - get all rows
        else if (action == "all") {
            return new Promise((resolve, reject) => {
                db.all(sql, params, function(err,data) {
                    if (err) {
                        logger.error(`Database error: ${err.message}`);
                        reject(new Error(err.message));
                    } else {
                        resolve(data);
                    }
                });
            });
        }
    });


    // files 
    ipcMain.handle("open-file", (event, filePath) => {
        shell.openPath(filePath).then(() => {
            if (config["logging"]) logger.info(`File opened: ${filePath}`);
        }).catch((err) => {
            logger.error(`Error opening file: ${err}`);
        });
    });

}

// смотрящий за файламы
function fileWatcher() {

    // Отслеживаем изменения в config.json
    fs.watch("config.json", async (curr, prev) => {
        try {
            const configData = await fs.promises.readFile('config.json', 'utf-8');
            config = JSON.parse(configData);

            const themeData = await fs.promises.readFile(`./assets/themes/${config["theme"]}.json`, 'utf-8');
            theme = JSON.parse(themeData);

            const languageData = await fs.promises.readFile(`./assets/languages/${config["language"]}.json`, 'utf-8');
            language = JSON.parse(languageData);

            // Немедленное обновление темы
            Environmental.webContents.send("theme-update", theme);
            
            Environmental.setAlwaysOnTop(config["alwaysOnTop"]);
        } catch (err) {
            if (config["logging"]) logger.error(`An error occured: ${err}`);
        }
    });

    // Отслеживаем изменения в теме
    if (config?.theme) {
        fs.watch(`./assets/themes/${config["theme"]}.json`, async (curr, prev) => {
            try {

                const themeData = await fs.promises.readFile(`./assets/themes/${config["theme"]}.json`, 'utf-8');
                theme = JSON.parse(themeData);

                // Немедленное обновление темы
                Environmental.webContents.send("theme-update", theme);
            } catch (err) {
                if (config["logging"]) logger.error(`An error occured: ${err}`);
            }
        });
    }

    // Отслеживаем изменения в языке
    if (config?.language) {
        fs.watch(`./assets/languages/${config["language"]}.json`, async (curr, prev) => {
            try {

                const languageData = await fs.promises.readFile(`./assets/languages/${config["language"]}.json`, 'utf-8');
                language = JSON.parse(languageData);
            } catch (err) {
                if (config["logging"]) logger.error(`An error occured: ${err}`);
            }
        });
    }
}

// создание контекстного меню для трей и его обработка
function createTrayMenu(){
    const trayContextMenu = Menu.buildFromTemplate(
        [
            {
                label: appTitle,
                icon: "./assets/icons/small-icon.png",
                enabled:false
            },
            {
                type:"separator"
            },
            {
                label: language["tray"]["show"],
                click: () => {
                    Environmental.show();
                    tray.destroy();
                    tray = null;
                }
            },
            {
                label: language["tray"]["quit"],
                click: () => {
                    app.quit();
                }
            }
        ]
    );

    return trayContextMenu;
}

// создание трея и его обработка
function createTray() {
    tray = new Tray("app.ico");
    tray.setToolTip(appTitle);
    tray.setContextMenu(createTrayMenu());

    tray.on('double-click', () => {
        Environmental.show();
        tray.destroy();
        tray = null;
    });
}

// главное меню
function CreateWindow(){
    let img = nativeImage.createFromPath("app.ico");
    img = img.resize({width:15,height:15});

    // log that app started and connect database
    if (config["logging"]) logger.info(`-------------------------NEW APP INIT-------------------------`)
                            logger.info(`Window loaded`);
    
    db = new sqlite3.Database("db.db", (err)=>{
        if (err){
            console.log(err.message);
        } else {
            logger.info("Local db connected");
        }
    });

    // create app window
    Environmental = new BrowserWindow(
        {
            width:700,
            height:400,
            frame:false,
            alwaysOnTop:false,
            transparent:true,
            title:appTitle,
            icon:img,
    
            webPreferences:{
                nodeIntegration: false,
                contextIsolation: true,
                devTools: true,
                preload: path.join(__dirname,"./scripts/preload.js"),
            }
        }
    )

    Environmental.setMinimumSize(700, 400);
    Environmental.loadFile("./index/index.html");
};

if (!getLock) {
    app.quit();
} else {

    app.on("second-instance", (event , commandLine, workPath) => {
        if (Environmental){
            if (Environmental.isMinimized()) Environmental.show();
            Environmental.focus();
        }
    });

    app.whenReady().then(async ()=>{
        await loadFiles();
        handles();
        fileWatcher();
        CreateWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
};
