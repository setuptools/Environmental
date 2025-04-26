

function formatTime(date = new Date(), format) {

    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return format
        .replace(/HH/g, hh)
        .replace(/mm/g, min)
        .replace(/ss/g, ss);
}

function formatDate(date = new Date(), format) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return format 
        .replace(/YYYY/g, yyyy)
        .replace(/MM/g, mm)
        .replace(/DD/g, dd);
}

document.addEventListener("DOMContentLoaded", async function() {

    const language = await window.appConfig.getLanguage();
    const theme = await window.appConfig.getTheme();
    const config = await window.appConfig.get();

    function updateTime(){
        window.dbAPI.get("SELECT timer FROM app").then((data) => {
            const timer_element = document.getElementsByClassName("timer-clock")[0];
            timer_element.innerText = formatTime(new Date(), JSON.parse(data.timer)["format-timer"]);

            const date_element = document.getElementsByClassName("timer-date")[0];
            date_element.innerText = formatDate(new Date(), JSON.parse(data.timer)["format-date"]);
        });
    }

    setInterval(updateTime,500);
    updateTime();

    

});