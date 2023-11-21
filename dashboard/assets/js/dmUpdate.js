async function fetchAsync(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

function addUser(serverId, botId) {
    let dmUserInput = document.getElementById("dmUser");
    fetchAsync(`/api/${serverId}/${botId}/adddmuser/${dmUserInput.value}`).then(data => {
        if (!data) return;

        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        if (data.msg === "User already added") {
            console.log("User already added")
            loadMessageBox("User has already been added", "danger");
            return;
        }

        document.getElementById("userTable").querySelector("tbody").innerHTML += `
        <tr id="user-row-${dmUserInput.value}">
            <td data-label="Username">${dmUserInput.querySelector(`option[value="${dmUserInput.value}"]`).innerHTML}</td>
            <td data-label="User ID">${dmUserInput.value}</td>
            <td class="deactivated" data-label="Confirmation">Not confirmed</td>
            <td><button type="button" class="rmvBtn" onclick="removeUser('${serverId}', '${botId}', '${dmUserInput.value}')">Remove</button></td>
        </tr>`

        console.log(data)
        loadMessageBox("Added user", "success");
    })
}

function removeUser(serverId, botId, userId) {
    fetchAsync(`/api/${serverId}/${botId}/rmvdmuser/${userId}`).then(data => {
        if (!data) return;

        if (data.msg === "User not existing") {
            console.log("User not existing")
            loadMessageBox("User not existing", "danger");
            return;
        }

        let userRow = document.getElementById(`user-row-${userId}`);

        if (userRow) userRow.remove();

        loadMessageBox("Removed user", "success");
    })
}