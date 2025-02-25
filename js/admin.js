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
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const pisos = parseInt(document.getElementById('pisos').value);

    if (isNaN(width) || isNaN(height) || isNaN(pisos)) {
        alert("Si us plau, introdueix valors numèrics vàlids");
        return;
    }

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
    // Estableix connexió WebSocket amb el servidor al port 8180
    ws = new WebSocket('ws://localhost:8180');

    // Quan s'estableix la connexió, envia missatge identificant-se com a administrador
    ws.onopen = function() {
        console.log("Connexió establerta amb el servidor");
        ws.send(JSON.stringify({ type: 'admin' }));
    };

    // Gestió dels missatges rebuts del servidor
    ws.onmessage = function(event) {
        let message;
        try {
            message = JSON.parse(event.data);
            console.log("📩 Missatge rebut:", message);
        } catch (error) {
            // Mostrar l'error
            console.error("❌ Error parsejant missatge:", error);
            return;
        }
    
        // Gestiona els diferents tipus de missatges
        switch (message.type) {
            case 'config':
                // Actualitza els camps del formulari amb la configuració rebuda
                document.getElementById('width').value = message.data.width;
                document.getElementById('height').value = message.data.height;
                document.getElementById('pisos').value = message.data.pisos;
                break;
            case 'engegar':
                // Canvia el text del botó a 'Aturar' quan el joc s'engega
                document.getElementById('engegar').textContent = 'Aturar';
                break;
            case 'aturar':
                // Canvia el text del botó a 'Engegar' quan el joc s'atura
                document.getElementById('engegar').textContent = 'Engegar';
                break;
            case 'dibuixar':
                // Registra l'estat actual del joc i actualitza el dibuix
                console.log("🎨 Actualitzant estat del joc:", {
                    jugadors: message.jugadors?.length || 0,
                    pedres: message.pedres?.length || 0,
                    punts: message.punts || [0, 0]
                });
                dibuixar(message.jugadors || [], message.pedres || [], message.punts || [0, 0]);
                break;
            default:
                // Mostra per consola el missatge
                console.log("Missatge rebut:", message);
        }
    };

    // Gestors d'esdeveniments
    document.getElementById('configurar').addEventListener('click', setConfig);
    document.getElementById('engegar').addEventListener('click', startStop);
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

