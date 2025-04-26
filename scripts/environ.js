
let environ_scrolls = [];

document.addEventListener("DOMContentLoaded", async function() {
    const data = await window.dbAPI.get("SELECT * FROM app");
    let theme = await window.appConfig.getTheme();
    

    const scrollTemplate = `
<div class="environ-scroll-container">
    <button class="environ-scroll-settings" id="environ-%NAME%-settings">
        <img src="../assets/icons/dot.svg" alt='dot' id="dot">
        <img src="../assets/icons/dot.svg" alt='dot' id="dot">
        <img src="../assets/icons/dot.svg" alt='dot' id="dot">
    </button>

    <img src="../assets/icons/environ-%NAME%.svg" alt="%NAME%" class="environ-scroll-icon" id="%NAME%-icon">

    <input type="range" min = "0" max="100" orient="vertical" value = "%VOLUME%" class = "environ-scroll" id= "scroll-%NAME%">
</div>
    `;
    
    window.dbAPI.get("SELECT sounds FROM app").then((data) => {
        data = JSON.parse(data.sounds);
        data.forEach((data) => {
            const scroll = scrollTemplate.replace(/%NAME%/g, data.id).replace(/%VOLUME%/, data.volume*100);
            document.querySelector(".environ-scrolls").insertAdjacentHTML("beforeend", scroll);

            try{
                const sound = new Audio(`../assets/sounds/${data.path}/${data.sound}`);
                sound.loop = true;
                sound.volume = data.volume;
                sound.play();
                data["sound_play"] = sound;

            } catch {
                window.loggerAPI.error(`Sound ${data.sound} not found`);
            }

            environ_scrolls.push(data);


            const scroll_element = document.getElementById(`scroll-${data.path}`);
            scroll_element.addEventListener("input" , ()=>{    
                item = environ_scrolls.find((item) => item.id === data.id)
                if (item){                      
                    item.volume = parseInt(scroll_element.value) / 100;
                    item.sound_play.volume = parseInt(scroll_element.value) / 100;
                    window.dbAPI.run("UPDATE app SET sounds = ?", [JSON.stringify(environ_scrolls)]);
                }
            });

        });

        window.electronAPI.themeUpdate();
    });
});