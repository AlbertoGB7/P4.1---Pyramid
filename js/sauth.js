window.onload = function () {
    google.accounts.id.initialize({
        client_id: "262082985058-n7hsuo2urfie3aro0bh5g6tl0f54hob8.apps.googleusercontent.com", // Reemplaza con tu Client ID de Google
        callback: handleCredentialResponse,
        ux_mode: "popup" // Modo popup para que salga la ventana grande
    });

    google.accounts.id.renderButton(
        document.getElementById("g_id_signin"),
        {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "signin_with",
            width: "250" // Ajusta el tamaño si quieres
        }
    );
};

function handleCredentialResponse(response) {
    const credential = response.credential;
    const payload = parseJwt(credential);

    if (payload && payload.email) {
        if (payload.email === "a.gonzalez7@sapalomera.cat") {
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("options").style.display = "block";
        } else {
            window.location.href = "player.html";
        }
    }
}

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}
