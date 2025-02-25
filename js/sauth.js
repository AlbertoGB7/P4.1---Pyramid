window.onload = function () {
    google.accounts.id.initialize({
        client_id: "262082985058-n7hsuo2urfie3aro0bh5g6tl0f54hob8.apps.googleusercontent.com",
        callback: handleCredentialResponse,
        ux_mode: "popup" // Mode pop up
    });

    google.accounts.id.renderButton(
        document.getElementById("g_id_signin"),
        {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "signin_with",
            width: "250"
        }
    );
};

function handleCredentialResponse(response) {
    // Manejar la resposta de l'autenticació
    const credential = response.credential;
    const payload = parseJwt(credential);

    if (payload && payload.email) {
        // Comprovar si l'usuari és administrador, si no, redirigir a la pàgina del jugador
        if (payload.email === "a.gonzalez7@sapalomera.cat" || "b.martinez@sapalomera.cat" || "psanchez@sapalomera.cat") {
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("options").style.display = "block";
        } else {
            window.location.href = "player.html";
        }
    }
}

function parseJwt(token) {
    // Obtenir les dades del usuari
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}
