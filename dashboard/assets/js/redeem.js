let width = window.innerWidth;
let height = window.innerHeight

function redeemCode(button) {
    const codeInput = document.getElementById("codeInput");

    if (!codeInput.value) return;

    fetchAsync(`/api/redeemcode/${codeInput.value}`).then(data => {
        if (data.msg === "Code not found") {
            console.log("Code not found")
            loadMessageBox("Code hasn't been found", "danger");
            return;
        }

        if (data.msg === "Already claimed code") {
            console.log("Already claimed code")
            loadMessageBox("Code already claimed", "danger");
            return;
        }

        if (data.msg === "Max uses reached") {
            console.log("Max uses reached")
            loadMessageBox("Max Code uses reached", "danger");
            return;
        }

        if (data.msg === "Code expired") {
            console.log("Code expired")
            loadMessageBox("Code expired", "danger");
            return;
        }

        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        let pointsImg = '<img src="/assets/img/token.png">'
        let amount = data.amount;
        if (data.type === "points") {
            pointsImg = '<img src="/assets/img/token.png">'
            amount = `x ${data.amount}`
        } else if (data.type === "premium") {
            pointsImg = '<img src="/assets/img/premium_small.png">';
            let readabletime = msToTime(data.amount);
            amount = readabletime;
        }

        document.getElementById("redeemList").innerHTML += `
        <div class="redeemBox">
            ${pointsImg}
            <span>${amount}</span>
            <span class="code">${data.code}</span>
            <span class="date">${new Date(data.redeemed).toLocaleTimeString([], {minute: "2-digit", hour: "2-digit", day: "numeric", month: "2-digit", year: "numeric"})}</span>
        </div>`

        loadMessageBox("Redeemed Code!", "success");

        codeInput.value = "";

        let rect = button.getBoundingClientRect();

        let originX = (rect.x + (0.5 * rect.width)) / width;
        let originY = (rect.y + (0.5 * rect.height)) / height;

        fireConfetti(originX, originY);
    });
}

function fireConfetti(x, y) {
    confetti({
        particleCount: 100,
        spread: 60,
        startVelocity: 30,
        origin: {
            x: x,
            y: y,
        }
    });
}

function msToTime(duration) {
    var seconds = Math.floor(duration / 1000),
    minutes = Math.floor(seconds / 60),
    hours   = Math.floor(minutes / 60),
    days    = Math.floor(hours / 24),
    months  = Math.floor(days / 30),
    years   = Math.floor(days / 365);

    seconds %= 60;
    minutes %= 60;
    hours %= 24;
    days %= 30;
    months %= 12;

    if (months <= 0) months = "" 
    else months = `${months} Months`
    if (days <= 0) days = "";
    else days = `${days} Days`
    if (hours <= 0) hours = "";
    else hours = `${hours}h`
  
    return `${months} ${days} ${hours}`;
}

function formatDuration(ele) {
    let readabletime = msToTime(Number(ele.innerHTML));
    ele.innerHTML = readabletime;
}

document.querySelectorAll('[data-premiumamount]').forEach((ele, index) => {
    formatDuration(ele);
})