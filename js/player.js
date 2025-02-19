"use strict";
let ws;
/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: 
///////////////////////////////////////////////////////////

// Gestor de l'esdeveniment per les tecles
// Ha d'enviar el missatge corresponent al servidor
//	per informar de les accions del jugador
// Tecles ASDW i fletxes per indicar la direcció
//	esquerra, avall, dreta i amunt (respectivament)
// Tecles Espai i Intro per agafar/deixar una pedra
function direccio(ev) {

    let ws;
    let id;

    let direction = null;

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
    }

    if (direction && ws.readyState === WebSocket.OPEN) {
        // Enviar la dirección al servidor
        ws.send(JSON.stringify({ type: 'move', direction: direction }));
    }

}

// nuevo, moviment:

const socket = new WebSocket("ws://localhost:8180");

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.type === "update") {
        const playerData = data.players[0]; // Assumim que només hi ha un jugador per ara

        if (playerData) {
            player.setAttribute("x", playerData.x);
            player.setAttribute("y", playerData.y);
        }
    }
};

let playerId = null;
let players = {};

// Quan es connecta el WebSocket
socket.onopen = () => {
    console.log("Connectat al servidor WebSocket");
};

// Gestionar missatges rebuts del servidor
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "connectat") {
        playerId = data.id;
        console.log(`Ets el jugador ${playerId}`);
        afegirJugador(playerId, 100, 100); // Posició inicial provisional
    } else if (data.type === "update") {
        actualitzarJugadors(data.players);
    }
};

// Afegir un jugador a la interfície gràfica
function afegirJugador(id, x, y) {
    const svg = document.getElementById("players");

    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("id", "player-" + id);
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", "20");
    rect.setAttribute("height", "20");
    rect.setAttribute("fill", "red");

    svg.appendChild(rect);
    players[id] = { x, y };
}

// Actualitzar posicions dels jugadors
function actualitzarJugadors(playersData) {
    playersData.forEach(player => {
        let rect = document.getElementById("player-" + player.id);
        if (rect) {
            rect.setAttribute("x", player.x);
            rect.setAttribute("y", player.y);
        }
    });
}

// Enviar moviments al servidor
document.addEventListener("keydown", (event) => {
    let direction = null;
    if (event.key === "ArrowUp") direction = "up";
    else if (event.key === "ArrowDown") direction = "down";
    else if (event.key === "ArrowLeft") direction = "left";
    else if (event.key === "ArrowRight") direction = "right";

    if (direction) {
        socket.send(JSON.stringify({ type: "move", id: playerId, direction }));
    }
});

const svg = document.querySelector("svg");
const playersGroup = document.getElementById("players");

// Crear el quadrat del jugador
let player = document.createElementNS("http://www.w3.org/2000/svg", "rect");
player.setAttribute("width", "20"); // Mida del jugador
player.setAttribute("height", "20");
player.setAttribute("fill", "red");
player.setAttribute("x", "100"); // Posició inicial
player.setAttribute("y", "100");

playersGroup.appendChild(player);

// acabado nuevo moviment

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
      // Establir la connexió amb el servidor en el port 8180
      ws = new WebSocket('ws://localhost:8180');

      // Gestionar esdeveniments de la connexió
      ws.onopen = function() {
          console.log("Connexió establerta amb el servidor");
          // Enviar missatge al servidor indicant que s'ha d'afegir un jugador
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
          console.log("Missatge rebut: ", message);
  
          if (message.type === 'config') {
              // Actualitzar el valor de l'input 'pisos'
              document.getElementById('pisos').value = message.data.pisos;
          }
      };

          // Afegir el gestor d'esdeveniments per les tecles
        document.addEventListener('keydown', direccio);
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

