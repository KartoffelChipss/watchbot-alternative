/* --- Loader --- */
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");

    loader.classList.add("loader--hidden");

    loader.addEventListener("transitionend", () => {
        document.body.removeChild(loader);
    });
});

async function fetchAsync(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

/* MessageBox */
function loadMessageBox(message, type) {
    const messageBox = document.getElementById("messageBox");
    const checkmark = messageBox.querySelector(".checkmark");
    const triangle = messageBox.querySelector(".triangle");
    const cross = messageBox.querySelector(".cross");
    const messageSpan = messageBox.querySelector("span");

    if (!type) type = "success";
    if (!message) message = "none";

    messageBox.classList.add("shown");

    setTimeout(() => {
        messageBox.classList.remove("shown");
    }, 3000)

    if (type === "danger") {
        checkmark.classList.remove("shown");
        triangle.classList.remove("shown");
        cross.classList.add("shown");

        messageBox.classList.remove("success");
        messageBox.classList.remove("warning");
        messageBox.classList.add("danger");

        messageSpan.innerText = message;
    }

    if (type === "success") {
        checkmark.classList.add("shown");
        triangle.classList.remove("shown");
        cross.classList.remove("shown");

        messageBox.classList.add("success");
        messageBox.classList.remove("warning");
        messageBox.classList.remove("danger");

        messageSpan.innerText = message;
    }

    if (type === "warning") {
        checkmark.classList.remove("shown");
        triangle.classList.add("shown");
        cross.classList.remove("shown");

        messageBox.classList.remove("success");
        messageBox.classList.add("warning");
        messageBox.classList.remove("danger");

        messageSpan.innerText = message;
    }
}

/* sidenav */
function toggleSidenav() {
    let sidenav = document.getElementById("sidenav");
    let sidenavShadow = document.getElementById("sidenav-shadow");

    // If already opened close
    if (sidenav.classList.contains("opened")) {
        sidenav.classList.remove("opened");
        sidenavShadow.classList.remove("shown");

        return;
    }

    sidenav.classList.add("opened")
    sidenavShadow.classList.add("shown");
}