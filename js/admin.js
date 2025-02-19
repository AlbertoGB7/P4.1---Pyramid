"use strict";

/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/
let ws;
///////////////////////////////////////////////////////////
// ALUMNE: Alberto González, Biel Martínez
///////////////////////////////////////////////////////////

// Gestor d'esdeveniment del botó 'Configurar'
// Enviar missatge 'config' amb les dades per configurar el servidor
function setConfig() {
    // Obtenir els valors dels camps d'entrada
    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;
    const pisos = document.getElementById('pisos').value;

    // Verificar que els valors estiguin dins dels rangs permesos
    if (width < 640 || width > 1280 || height < 480 || height > 960 || pisos < 4 || pisos > 8) {
        alert("Valors fora de rang. Si us plau, revisa les dades.");
        return;
    }

    // Crear l'objecte de configuració
    const config = {
        type: 'config',
        data: {
            width: parseInt(width),
            height: parseInt(height),
            pisos: parseInt(pisos)
        }
    };

    // Enviar el missatge al servidor a través del WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(config));
        console.log("Configuració enviada al servidor:", config);
    } else {
        alert("Error: No s'ha pogut establir connexió amb el servidor.");
    }
}

// Assignar el gestor d'esdeveniments al botó "Configurar"
document.getElementById('configurar').addEventListener('click', setConfig);

// Gestor d'esdeveniment del botó 'Engegar/Aturar'
// Enviar missatge 'start' o 'stop' al servidor
function startStop() {
    // Verificar que hi ha connexió amb el servidor
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("Error: No s'ha pogut establir connexió amb el servidor.");
        return;
    }

    // Obtenir el botó i determinar l'acció segons el seu text actual
    const boto = document.getElementById('engegar');
    const esEngegar = boto.textContent === 'Engegar';
    
    // Enviar missatge al servidor
    ws.send(JSON.stringify({
        type: esEngegar ? 'start' : 'stop'
    }));

    // Registrar l'acció per consola
    console.log(`S'ha enviat l'ordre de ${esEngegar ? 'engegar' : 'aturar'} el joc`);
}

// Establir la connexió amb el servidor en el port 8180
//	S'ha poder accedir utilitzant localhost o una adreça IP local
// Gestionar esdeveniments de la connexió
//	- a l'establir la connexió (open): enviar missatge al servidor indicant que s'ha d'afegir l'administrador
//	- si es tanca la connexió (close): informar amb alert() i tornar a la pàgina principal (index.html)
//	- en cas d'error: mostrar l'error amb alert() i tornar a la pàgina principal (index.html)
//	- quan arriba un missatge (tipus de missatge):
//		- configurar: cridar la funció configurar() passant-li les dades de configuració
//			i actualitzar els valors dels inputs 'width', 'height' i 'pisos'
//		- dibuixar: cridar la funció dibuixar() passant-li les dades per dibuixar jugadors, pedres i piràmides (punts)
//		- engegar: canviar el text del botó 'Engegar' per 'Aturar'
//		- aturar: canviar el text del botó 'Aturar' per 'Engegar'
//		- missatge: mostrar el missatge per consola
// Afegir gestors d'esdeveniments pels botons 'Configurar' i 'Engegar/Aturar'
function init() {
        // Establir la connexió amb el servidor en el port 8180
        ws = new WebSocket('ws://localhost:8180');

        // Gestionar esdeveniments de la connexió
        ws.onopen = function() {
            console.log("Connexió establerta amb el servidor");
            // Enviar missatge al servidor indicant que s'ha d'afegir l'administrador
            ws.send(JSON.stringify({ type: 'admin' }));
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
        
            switch (message.type) {
                case 'config':
                    // Actualitzar els valors dels inputs
                    document.getElementById('width').value = message.data.width;
                    document.getElementById('height').value = message.data.height;
                    document.getElementById('pisos').value = message.data.pisos;
                    break;
                case 'engegar':
                    document.getElementById('engegar').textContent = 'Aturar';
                    break;
                case 'aturar':
                    document.getElementById('engegar').textContent = 'Engegar';
                    break;
                default:
                    console.log("Missatge rebut:", message);
            }
            document.getElementById('engegar').addEventListener('click', startStop);
        };
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

