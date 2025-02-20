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
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        console.log("No hi ha connexió establerta o ID de jugador");
        return;
    }

    let direction = null;

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

    // Si s'ha detectat una direcció vàlida, enviar-la al servidor
    if (direction) {
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
    // Establir la connexió amb el servidor
    ws = new WebSocket('ws://localhost:8180');

    ws.onopen = function() {
        console.log("Connexió establerta amb el servidor");
        ws.send(JSON.stringify({ type: 'player' }));
    };

    ws.onclose = function() {
        alert("Connexió tancada. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };

    ws.onerror = function(error) {
        alert("Error en la connexió: " + error.message);
        window.location.href = "index.html";
    };

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        console.log("Missatge rebut:", message);
    
        switch(message.type) {
            case 'connectat':
                playerId = message.id;
                console.log("Connectat com a jugador", playerId);
                break;
            case 'config':
                configurar(message.data);
                document.getElementById('pisos').value = message.data.pisos;
                break;
            case 'dibuixar':
                dibuixar(message.jugadors || [], message.pedres || [], message.punts || [0, 0]);
                break;
            default:
                console.log("Missatge rebut:", message);
        }
    };

    // Afegir el gestor d'esdeveniments per les tecles
    document.addEventListener('keydown', direccio);
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

