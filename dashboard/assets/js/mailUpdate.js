async function fetchAsync(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

function addMailEnter() {
    if(event.key === 'Enter') addEmail()
}

function addEmail(serverId, botId) {
    let dmUserInput = document.getElementById("emailAdress");
    if (!dmUserInput.value) return console.log("No email entered!");

    fetchAsync(`/api/${serverId}/${botId}/addmail/${encodeURIComponent(dmUserInput.value)}`).then(data => {
        if (!data) return;

        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        if (data.msg === "User already added") {
            console.log("Mail already added")
            loadMessageBox("E-Mail adress already added", "danger");
            return;
        }

        if (data.msg === "No recipients defined") {
            console.log("No recipients defined")
            loadMessageBox("Invalid E-Mail adress!", "danger");
            return;
        }

        if (data.msg === "Error while sending email") {
            console.log("No recipients defined")
            loadMessageBox("Error while sending E-Mail", "danger");
            return;
        }

        if (data.msg === "Limit reached!") {
            console.log("Limit reached!")
            loadMessageBox("Limit reached!", "danger");
            return;
        }

        document.getElementById("userTable").querySelector("tbody").innerHTML += `
        <tr id="user-row-${encodeURIComponent(dmUserInput.value)}">
            <td data-label="E-Mail">${dmUserInput.value}</td>
            <td data-label="Confirmation" class="deactivated">Not confirmed</td>
            <td><button type="button" class="rmvBtn" onclick="removeEmail('${serverId}', '${botId}', '${dmUserInput.value}')">Remove</button></td>
        </tr>`

        dmUserInput.value = "";

        loadMessageBox("Added E-Mail adress", "success");
    })
}

function removeEmail(serverId, botId, mail) {
    fetchAsync(`/api/${serverId}/${botId}/rmvmail/${encodeURIComponent(mail)}`).then(data => {
        if (!data) return;

        if (data.msg === "User not existing") {
            console.log("Mail not existing")
            loadMessageBox("This E-Mail does not exist", "danger");
            return;
        }

        const encodedMail = encodeURIComponent(mail);

        console.log(encodedMail)

        let userRow = document.getElementById(`user-row-${encodedMail}`);

        if (userRow) userRow.remove();

        loadMessageBox("Removed E-Mail", "success");
    })
}