"use strict";
let ws = null;
let playerId = null;
let currentDirection = null;
let moveInterval = null;

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
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        return;
    }

    // Determinar la nueva dirección según la tecla
    let newDirection = null;
    switch (ev.key) {
        case 'ArrowUp':
        case 'w':
            newDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
            newDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
            newDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
            newDirection = 'right';
            break;
        case ' ':
        case 'Enter':
            ws.send(JSON.stringify({ 
                type: 'agafar', 
                id: playerId 
            }));
            return;
    }

    // Si es una nueva dirección válida
    if (newDirection) {
        // Detener el intervalo actual si existe
        if (moveInterval) {
            clearInterval(moveInterval);
        }

        currentDirection = newDirection;
        
        // Crear nuevo intervalo para movimiento continuo
        moveInterval = setInterval(() => {
            ws.send(JSON.stringify({ 
                type: 'direccio',  
                id: playerId,
                direction: currentDirection 
            }));
        }, 100); // Ajusta este valor para controlar la velocidad
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
                
                // If config was sent with connection, apply it
                if (message.config) {
                    console.log("⚙️ Configuració inicial rebuda:", message.config);
                    configurar(message.config);
                    document.getElementById('pisos').value = message.config.pisos;
                }
                break;
                
            case 'config':
                if (!message.data || typeof message.data !== 'object') {
                    console.error("❌ Dades de configuració invàlides");
                    return;
                }
                console.log("⚙️ Nova configuració rebuda:", message.data);
                // Update SVG viewport and dimensions
                const svg = document.querySelector("svg");
                svg.setAttribute("width", message.data.width);
                svg.setAttribute("height", message.data.height);
                svg.setAttribute("viewBox", `0 0 ${message.data.width} ${message.data.height}`);
                
                // Call configurar to update game settings
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
            
            case 'engegar':
                console.log("🎮 Joc iniciat");
                break;
            case 'aturar':
                console.log("⏹️ Joc aturat");
                break;
            case 'missatge':
                console.log("💬 Missatge del servidor:", message.text);
                break;
            case 'colision':
                // Detener el movimiento cuando hay colisión
                if (moveInterval) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                    currentDirection = null;
                }
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

