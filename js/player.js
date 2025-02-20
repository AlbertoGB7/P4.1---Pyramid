"use strict";
let ws;
let playerId = null;

/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: Alberto González, Biel Martínez
///////////////////////////////////////////////////////////

// Gestor de l'esdeveniment per les tecles
// Ha d'enviar el missatge corresponent al servidor
//	per informar de les accions del jugador
// Tecles ASDW i fletxes per indicar la direcció
//	esquerra, avall, dreta i amunt (respectivament)
// Tecles Espai i Intro per agafar/deixar una pedra
function direccio(ev) {
    // Verificar que tenim connexió i ID de jugador
    if (!ws) {
        console.log("❌ No hi ha objecte WebSocket creat");
        return;
    }
    
    if (ws.readyState !== WebSocket.OPEN) {
        console.log("❌ La connexió WebSocket no està oberta. Estat actual:", ws.readyState);
        return;
    }
    
    if (playerId === null) {
        console.log("❌ No s'ha rebut encara l'ID del jugador");
        console.log("📝 Estat actual:", {
            ws: ws ? "Creat" : "No creat",
            wsState: ws ? ws.readyState : "N/A",
            playerId: playerId
        });
        return;
    }

    let direction = null;

    // Log the pressed key
    console.log("🎮 Tecla premuda:", ev.key);

    // Determinar la direcció segons la tecla premuda
    switch (ev.key) {
        case 'ArrowUp':
        case 'w':
            direction = 'up';
            break;
        case 'ArrowDown':
        case 's':
            direction = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
            direction = 'left';
            break;
        case 'ArrowRight':
        case 'd':
            direction = 'right';
            break;
        case ' ':
        case 'Enter':
            // Enviar ordre d'agafar/deixar pedra
            ws.send(JSON.stringify({ 
                type: 'agafar', 
                id: playerId 
            }));
            break;
    }

    // Log the direction being sent
    if (direction) {
        console.log("➡️ Enviant direcció:", direction);
        ws.send(JSON.stringify({ 
            type: 'direccio',  
            id: playerId,
            direction: direction 
        }));
    }
}

// Establir la connexió amb el servidor en el port 8180
//	S'ha poder accedir utilitzant localhost o una adreça IP local
// Crear els gestors dels esdeveniments de la connexió:
//	- a l'establir la connexió (open): enviar missatge al servidor indicant que s'ha d'afegir un jugador
//	- si es tanca la connexió (close): informar amb alert() i tornar a la pàgina principal (index.html)
//	- en cas d'error: mostrar l'error amb alert() i tornar a la pàgina principal (index.html)
//	- quan arriba un missatge (tipus de missatge):
//		- connectat: agafar l'identificador i guardar-lo a la variable 'id'
//		- configurar: cridar la funció configurar() passant-li les dades de configuració
//			i actualitzar el valor de l'input 'pisos'
//		- dibuixar: cridar la funció dibuixar() passant-li les dades per dibuixar jugadors, pedres i piràmides (punts)
//		- missatge: mostrar el missatge per consola
// Afegir el gestor d'esdeveniments per les tecles
function init() {
    console.log("🚀 Inicialitzant connexió WebSocket...");
    ws = new WebSocket('ws://localhost:8180');

    ws.onopen = function() {
        console.log("✅ Connexió establerta amb el servidor");
        console.log("📤 Enviant petició de nou jugador");
        ws.send(JSON.stringify({ type: 'player' }));
    };

    ws.onclose = function() {
        console.log("❌ Connexió tancada");
        alert("Connexió tancada. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };

    ws.onerror = function(error) {
        console.log("❌ Error en la connexió:", error);
        alert("Error en la connexió: " + error.message);
        window.location.href = "index.html";
    };

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        console.log("📩 Missatge rebut:", message);
    
        switch(message.type) {
            case 'connectat':
                playerId = message.id;
                console.log("✅ Connectat com a jugador", playerId);
                break;
            case 'config':
                console.log("⚙️ Configuració rebuda:", message.data);
                configurar(message.data);
                document.getElementById('pisos').value = message.data.pisos;
                break;
            case 'dibuixar':
                console.log("🎨 Actualitzant estat del joc:", {
                    jugadors: message.jugadors?.length || 0,
                    pedres: message.pedres?.length || 0,
                    punts: message.punts || [0, 0]
                });
                dibuixar(message.jugadors || [], message.pedres || [], message.punts || [0, 0]);
                break;
            default:
                console.log("❓ Missatge no processat:", message);
        }
    };

    document.addEventListener('keydown', direccio);
    console.log("✅ Event listener de teclat afegit");
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

