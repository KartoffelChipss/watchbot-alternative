function setChannel(serverId, botId, select) {

    fetchAsync(`/api/${serverId}/${botId}/setchannelupdatechannel/${select.value}`).then(data => {
        if (!data) return;

        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        if (data.msg === "Channel not found") {
            console.log("Channel not found")
            loadMessageBox("Channel not found", "danger");
            return;
        }

        loadMessageBox("Changed Channel", "success");
    })
}

function setRole(serverId, botId, select) {

    fetchAsync(`/api/${serverId}/${botId}/setupdatechannelrole/${select.value}`).then(data => {
        if (!data) return;

        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        if (data.msg === "Role not found") {
            console.log("Role not found")
            loadMessageBox("Role not found", "danger");
            return;
        }

        loadMessageBox("Changed Mention Role", "success");
    })
}