function openInNewTab(link) {
    window.open(link, '_blank').focus()
}

function claimReward(rewardType) {
    if (!rewardType) return;

    fetchAsync(`/api/claimReward/${rewardType}`).then(data => {

        if (!data) {
            console.log("No data returned");
            loadMessageBox("No data returned", "danger");
            return;
        }

        if (data.msg === "Reward type not found") {
            console.log(data.msg);
            loadMessageBox("Could not find this reward type!", "danger");
            return;
        }

        if (data.msg === "Too many requests, please try again later.") {
            console.log("Too many requests, please try again later.")
            loadMessageBox("Too many requests, please try again later.", "danger");
            return;
        }

        if (data.msg === "Already claimed!") {
            console.log(data.msg)
            loadMessageBox("Already claimed!", "danger");
            return;
        }

        if (rewardType !== "daily") {
            window.open(`/rewardredirect/${rewardType}`, '_blank').focus();
        }

        loadMessageBox("Reward claimed!", "success");

        const rewardBox = document.getElementById(`reward-${rewardType}`);
        if (!rewardBox) return;
        rewardBox.classList.add("done");
        rewardBox.querySelector("button").innerHTML = `<svg fill="#fefefe" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>checkmark2</title> <path d="M28.998 8.531l-2.134-2.134c-0.394-0.393-1.030-0.393-1.423 0l-12.795 12.795-6.086-6.13c-0.393-0.393-1.029-0.393-1.423 0l-2.134 2.134c-0.393 0.394-0.393 1.030 0 1.423l8.924 8.984c0.393 0.393 1.030 0.393 1.423 0l15.648-15.649c0.393-0.392 0.393-1.030 0-1.423z"></path> </g></svg>`;
    });
}