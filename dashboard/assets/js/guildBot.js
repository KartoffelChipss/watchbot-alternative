async function fetchAsync(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

function updateDelay(serverId, botId) {
    let updateDelayInput = document.getElementById("updateDelayInput");
    fetchAsync(`/api/${serverId}/${botId}/setupdatedelay/${updateDelayInput.value}`).then(data => {
        if (!data) return;

        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        if (data.msg === "Invalid delay") {
            console.log("Invalid delay")
            loadMessageBox("Invalid delay", "danger");
            return;
        }

        loadMessageBox("Updated delay", "success");
    })
}