const buttons = document.querySelectorAll(".mode-button");

function errorHandle(){
    window.addEventListener("error", (e) => {
        window.loggerAPI.error(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`);
    });

    window.addEventListener("unhandledrejection", (event) => {
        window.loggerAPI.error(`Unhandled promise rejection: ${event.reason}`);
    });
    
}

document.addEventListener("DOMContentLoaded", async function() {
    console.log("DOM fully loaded and parsed");
    errorHandle();

    const theme = await window.appConfig.getTheme();
    const config = await window.appConfig.get();

    // lock TAB
    document.addEventListener("keydown", (e) => {
            if (e.key === "Tab"){
                e.preventDefault();
            }
        }
    )

    function closeApp() {
        window.electronAPI.closeApp();
    }

    function minimizeApp() {
        window.electronAPI.minimizeApp();
    }

    document.getElementById("close-button").addEventListener("click", closeApp);
    document.getElementById("minimize-button").addEventListener("click", minimizeApp);


    document.getElementById("talk-button").addEventListener("click", () => {
        window.electronAPI.openFile("README.md");

    });
    

    // add bind for help menu 'mode-switcher'

    const menus = []
    buttons.forEach((button) => {
        const menu = document.getElementsByClassName(button.id.replace("-mode",""))[0];
        menus.push(menu);

        button.addEventListener("click", () => {
            if (button.classList.contains("active")) return;

            buttons.forEach((btn) => {
                btn.classList.remove("active");
                btn.style.backgroundColor = convertListToRGB(theme["help-menu"]["settings-button-background"]);
            });

            
            menus.forEach((menu) => {
                if (menu.classList.contains(button.id.replace("-mode",""))) {
                    menu.classList.remove("hidden");
                } else {
                    menu.classList.add("hidden");
                }
            });

            button.classList.add("active");
            
            window.Updater.updateMode(button.id);
            button.style.backgroundColor = convertListToRGB(theme["help-menu"]["pressed-button-color"]);
        });

    });
    
    let environ_mode = document.getElementById(config["last-mode"]);
    environ_mode.click();
});