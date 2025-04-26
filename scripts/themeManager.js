
function convertListToRGB(list) {
    if (!Array.isArray(list) || list.length !== 4) {
        throw new Error("Input must be an array of four numbers.");
    }
    const [r, g, b, a] = list.map((value, index) => {
        if (index < 3) {
            if (value < 0 || value > 255) {
                throw new Error("RGB values must be between 0 and 255.");
            }
            return Math.round(value);
        } else {
            if (value < 0 || value > 1) {
                throw new Error("Alpha value must be between 0 and 1.");
            }
            return value;
        }
    });
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

document.addEventListener("DOMContentLoaded", function() {
    function updateTheme(theme){
        if (!theme) return;
        
        // main background
        document.getElementsByClassName("main")[0].style.backgroundColor = convertListToRGB(theme["background-color"]);

        // top app bar cotainer color
        document.getElementsByClassName("top-app-bar-container")[0].style.backgroundColor = convertListToRGB(theme["top-app-bar"]["background-color"]);
        
        // top app bar label color
        document.querySelector("#top-app-bar-label span").style.color = convertListToRGB(theme["top-app-bar"]["title-color"]);


        

        // recolor all buttons in .help-menu
        document.querySelectorAll(".help-menu button").forEach((button) => {
            button.style.backgroundColor = convertListToRGB(theme["help-menu"]["settings-button-background"]);
            if (button.classList.contains("mode-button")) {
                if (button.classList.contains("active")) {
                    button.style.backgroundColor = convertListToRGB(theme["help-menu"]["pressed-button-color"]);
                    return
                }
                button.style.backgroundColor = convertListToRGB(theme["help-menu"]["settings-button-background"]);
            }
            
            if (button.classList.contains("mode-button")) return;
            button.addEventListener("mouseup", (e) => {
                button.style.backgroundColor = convertListToRGB(theme["help-menu"]["settings-button-background"]);
            });

            button.addEventListener("mouseleave", (e) => {
                button.style.backgroundColor = convertListToRGB(theme["help-menu"]["settings-button-background"]);
            });

            button.addEventListener("mousedown", (e) => {
                button.style.backgroundColor = convertListToRGB(theme["help-menu"]["pressed-button-color"]);
            });


        });
        
        // recolor all scroll in scroll container
        document.querySelectorAll(".environ-scroll-container").forEach(async (element) =>{
            try{
                const scroll = element.getElementsByClassName("environ-scroll")[0];
                const button = element.getElementsByClassName("environ-scroll-settings")[0];
                const id = scroll.id.split("-")[1];
                
                const theme = await window.appConfig.getTheme();
                if (!theme) return new Error("Theme not found");
                
                button.style.backgroundColor = convertListToRGB(theme["environ"][id]["settings-button-color"]);
                scroll.style.backgroundColor = convertListToRGB(theme["environ"][id]["no-track-color"]);
                scroll.style.border = `solid 1px ${convertListToRGB(theme["environ"]["border-color"])}`;

                document.querySelector(".main").style.setProperty("--thumb-color", convertListToRGB(theme["environ"]["thumb-color"]));
                document.querySelector(".main").style.setProperty("--track-color", convertListToRGB(theme["environ"]["track-color"]));

            } catch(err){
                window.loggerAPI.warn("Cant't find theme for " + element.className);
            } 
        
        });

        // timer recolor
        const timer_clock = document.getElementsByClassName("timer-clock")[0];
        timer_clock.style.color = convertListToRGB(theme["timer"]["timer-color"]); 
        timer_clock.style.fontFamily = theme["timer"]["font-family"];
        timer_clock.style.fontSize = theme["timer"]["font-size"];

        const date = document.getElementsByClassName("timer-date")[0];
        date.style.color = convertListToRGB(theme["timer"]["date-color"]);
        date.style.fontFamily = theme["timer"]["font-family"];
        date.style.fontSize = theme["timer"]["font-weight"];

    }

    window.electronAPI.onThemeUpdate(updateTheme);
    window.appConfig.getTheme().then((theme) => {
        updateTheme(theme);

    });

});