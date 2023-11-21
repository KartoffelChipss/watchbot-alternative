function getRemainingTime(date) {
    let now = new Date();
    let date2 = new Date(date);
    let diff = new Date(date2.getTime() - now.getTime());

    let months = diff.getMonth() - 1;
    let days = diff.getDate()-1;
    let hours = diff.getHours() - 1;
    let minutes = diff.getMinutes() - 1;

    let monthString = "";
    if (months > 0) monthString = `${months}mth`;

    let daystring = "";
    if (days > 0) daystring = `${days}d`;

    let hourstring = "";
    if (hours > 0) hourstring = `${hours}h`;

    let minutestring = "";
    if (minutes > 0 && hours <= 0) minutestring = `${minutes}m`;

    return {
        months: monthString,
        days: daystring,
        hours: hourstring,
        minutes: minutestring
    }
}

function formatDuration(ele) {
    let reminingTime = getRemainingTime(Number(ele.innerHTML));
    console.log(reminingTime)
    ele.innerHTML = "Test"
    ele.innerHTML = `${reminingTime.months} ${reminingTime.days} ${reminingTime.hours} ${reminingTime.minutes} left`;
}

const vipremainingbtn = document.getElementById("vipremainingbtn");

if (vipremainingbtn) formatDuration(vipremainingbtn);

function buyPremium(months) {
    if (!months) return;

    fetchAsync(`/api/buypremium/${months}`).then(data => {
        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        if (data.msg === "Invalid premium duration") {
            console.log(data.msg);
            loadMessageBox("Invalid premium duration", "danger");
            return;
        }

        if (data.msg === "Not enough money") {
            console.log(data.msg);
            loadMessageBox("You don't have enough money!", "danger");
            return;
        }

        loadMessageBox("Successfully bought Argus Premium!", "success");
        console.log(data.msg)
    });
}