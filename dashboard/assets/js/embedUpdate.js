async function fetchAsync(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

function setEmbedChannel(select, serverId, botId) {
    fetchAsync(`/api/${serverId}/${botId}/setembedchannel/${select.value}`).then(data => {
        if (!data) return;

        if (data.msg === "User already added") {
            console.log("User already added")
            loadMessageBox("User has already been added", "danger");
            return;
        }

        if (data.msg === "Error while sending embed") {
            console.log("Error while sending embed")
            loadMessageBox("Error while sending embed", "danger");
            return;
        }

        if (data.msg === "No changes found") {
            console.log("No changes found");
            return;
        }

        loadMessageBox("Changed Embed channel", "success");
    })
}