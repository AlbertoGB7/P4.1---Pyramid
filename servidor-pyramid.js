/******************************************************************************
*						SERVIDOR WEB (port 8080)
******************************************************************************/

var http = require('http');
var url = require('url');
var fs = require('fs');

function header(resposta, codi, cType) {
	resposta.setHeader('Access-Control-Allow-Origin', '*');
	resposta.setHeader('Access-Control-Allow-Methods', 'GET');
	if (cType) resposta.writeHead(codi, {'Content-Type': cType});
	else resposta.writeHead(codi);
}

function enviarArxiu(resposta, dades, filename, cType, err) {
	if (err) {
		header(resposta, 400, 'text/html');
		resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>Error al l legir l'arxiu</p>");
		return;
	}

	header(resposta, 200, cType);
	resposta.write(dades);
	resposta.end();
}

function onRequest(peticio, resposta) {
	var cosPeticio = "";

	peticio.on('error', function(err) {
		console.error(err);
	}).on('data', function(dades) {
		cosPeticio += dades;
	}).on('end', function() {
		resposta.on('error', function(err) {
			console.error(err);
		});

		if (peticio.method == 'GET') {
			var q = url.parse(peticio.url, true);
			var filename = "." + q.pathname;

			if (filename == "./") filename += "index.html";
			if (fs.existsSync(filename)) {
				fs.readFile(filename, function(err, dades) {
					enviarArxiu(resposta, dades, filename, undefined, err);
				});
			}
			else {
				header(resposta, 404, 'text/html');
				resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>404 Not Found</p>");
			}
		}
	});
}

var server = http.createServer();
server.on('request', onRequest);
server.listen(8080);	



/******************************************************************************
*					SERVIDOR WEB SOCKETS (port 8180)
******************************************************************************/

// Factor d'escala
const ESCALA	 = 4;

// Nombre de pedres en la zona de joc
const MAXPED	 = 8;

// Increment del desplaçament horitzontal i vertical 
const INCHV		 = ESCALA;

// Mida del jugador i pedra
const MIDAJ		 = (4 * ESCALA);
const MIDAP		 = (2 * ESCALA);

// Mida de l'àrea de joc i piràmide
const MINH		 = (40 * MIDAJ);
const MAXH		 = (2 * MINH);
const MINV		 = (30 * MIDAJ);
const MAXV		 = (2 * MINV);

// Mínim i màxim nombre de files de la piràmida
const NFPMIN	 = 4;
const NFPMAX	 = 8;

// Mida dels bloc per construir les piràmides
const PH		 = (4 * ESCALA);
const PV		 = (3 * ESCALA);

// Mida de les zones per construir les piràmides
const PHMAX		 = (PH * NFPMAX);
const PVMAX		 = (PV * NFPMAX);



// Temps en ms entre cada moviment
const TEMPS		 = 100;



var config = {
	width:  MINH,
	height: MINV,
	pisos:  NFPMIN,
	pedres: (NFPMIN + 1) * NFPMIN / 2
};



/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: Biel Martínez, Alberto González
///////////////////////////////////////////////////////////

/********** Servidor WebSockets **********/

// Carregar el mòdul per WebSockets
const WebSocket = require('ws');

// Crear servidor WebSocket
const wss = new WebSocket.Server({ port: 8180 });

// Esdeveniment del servidor 'wss' per gestionar la connexió d'un client 'ws'
//	Ha d'enviar la configuració actual al client que s'acaba de connectar
// Ha de crear els gestors dels esdeveniments:
//	- missatge (processar les diferents opcions del missatge)
//	- tancar (quan detecta que el client ha tancat la connexió)

let players = {}; // Almacena la información de los jugadores
let playerIdCounter = 0; // Contador para generar IDs únicos
let gameRunning = false;  // Estat del joc
let gameInterval = null;  // Interval del temporitzador
let adminWs = null;      // Connexió WebSocket de l'administrador
let pedres = [];         // Array de pedres en la zona de joc
let punts = [0, 0];      // Puntuació dels dos equips

console.log("Servidor WebSocket escoltant al port 8180");
// Esdeveniment del servidor 'wss' per gestionar la connexió d'un client 'ws'
wss.on('connection', function connection(ws) {
    console.log("Nou client connectat");

    // Enviar la configuració actual al client que s'acaba de connectar
    ws.send(JSON.stringify({ type: 'config', data: config }));

    // Gestor d'esdeveniments per quan el client envia un missatge
    ws.on('message', function incoming(message) {
        console.log("Missatge rebut: %s", message);
        processar(ws, message); // Add this line to process messages
    });

    // Gestor d'esdeveniments per quan el client es desconnecta
    ws.on('close', function close() {
        tancar(ws); // Add this line to handle disconnections
    });

    // Gestor d'esdeveniments per errors
    ws.on('error', function error(err) {
        console.error("Error en la connexió: %s", err);
    });
});



/********** Gestors dels principals esdeveniments **********/
// 'ws' és la connexió (socket) del client
// 'm' és el missatge que ha enviat el client

// Esdeveniment: ha arribat un missatge d'un client
// Ha de processar els possibles missatges:
//	- crear administrador
//	- crear jugador
//	- configurar el joc (mida de la zona de joc i pisos de la piràmide)
//	- engegar el joc
//	- aturar el joc
//	- agafar (o deixar) una pedra
//	- modificar la direcció
function processar(ws, missatge) {
    const data = JSON.parse(missatge);

    switch (data.type) {
        case 'admin':
            crearAdmin(ws, missatge);
            break;
        case 'player':
            crearJugador(ws, missatge);
            break;
        case 'start':
            start(ws, missatge);
            break;
        case 'stop':
            stop(ws, missatge);
            break;
        case 'direccio':  // Changed from 'move' to 'direccio'
            direccio(ws, missatge);
            break;
        default:
            console.log("Missatge no reconegut:", data);
    }
}

// Esdeveniment: un client  ha tancat la connexió
// Tenir en compte si és un jugador
//	per comptar els que té cada equip
function tancar(ws) {
	const playerId = Object.keys(players).find(id => players[id].ws === ws);
    if (playerId) {
        console.log(`Client desconnectat (ID: ${playerId})`);
        delete players[playerId];
        broadcastPlayers();
    }
}



/********** Funcions auxiliars (es criden des de processar() 
*********** per gestionar els diferents missatges **********/

// Esdeveniment: crear usuari administrador
//	- si ja existeix un administrador
//		tancar la connexió indicant el motiu
//	- crear l'administrador i enviar-li la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearAdmin(ws, m) {
}

// Esdeveniment: crear jugador
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- crear el jugador assignant-li un identificador
//		que ha de ser diferent per cada jugador
//	- se li ha d'assignar un equip (0 o 1):
//		s'ha d'intentar que el nombre de jugadors
//		de cada equip sigui el més semblant possible
//	- s'ha de situar el jugador en la zona de joc
//		sense que se solapi amb qualsevol altre
//	- enviar-li el seu identificador i la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearJugador(ws, m) {
    const playerId = playerIdCounter++; 
    console.log(`Nou jugador connectat amb ID: ${playerId}`);

    players[playerId] = {
        id: playerId,
        ws: ws, // Add this line to store the WebSocket connection
        x: Math.floor(Math.random() * (config.width - MIDAJ)),
        y: Math.floor(Math.random() * (config.height - MIDAJ)),
        team: playerId % 2,
    };

    // Enviar el ID y la configuración al cliente
    ws.send(JSON.stringify({ 
        type: 'connectat', 
        id: playerId,
        config: config 
    }));

    broadcastGameState(); // Change this from broadcastPlayers
}


// Esborrar pedres (es crida des de configurar())
// Situar els jugadors en el costat dret o esquerre
//	segons l'equip, a intervals regulars
// Posar els punts dels dos equips a 0
function reiniciar() {
    // Reset de variables
    pedres = [];
    punts = [0, 0];

    // Reset de posicions de jugadors
    jugadors.forEach(jugador => {
        if (jugador.team === 0) {
            jugador.x = 0;
            jugador.y = 0;
        } else {
            jugador.x = config.width - MIDAJ;
            jugador.y = config.height - MIDAJ;
        }
    });

    // Enviar la configuració actualitzada a tots els clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'dibuixar', jugadors, pedres, punts }));
        }
    });
}

// Esdeveniment: configurar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- comprovar que la configuració passada sigui correcta:
//		mides i número de pisos
//	- calcular el número de pedres en funció dels pisos:
//		config.pedres = (config.pisos + 1) * config.pisos / 2;
//	- cridar la funció reiniciar
//	- enviar la configuració a tothom
function configurar(ws, m) {
}

// Esdeveniment: engegar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		enviar missatge informatiu
//	- cridar la funció reiniciar, canviar l'estat del joc
//		i enviar-li missatge informatiu
function start(ws, m) {
    // Verificar si l'usuari és l'administrador
    if (ws !== adminWs) {
        ws.close(1000, "No tens permís d'administrador");
        return;
    }

    // Si el joc ja està en marxa, enviar missatge informatiu
    if (gameRunning) {
        ws.send(JSON.stringify({
            type: 'missatge',
            text: 'El joc ja està en marxa'
        }));
        return;
    }

    // Iniciar el joc
    gameRunning = true;
    reiniciar();  // Reiniciar l'estat del joc
    
    // Iniciar el temporitzador que crida a mou()
    gameInterval = setInterval(mou, TEMPS);

    // Enviar missatge a tots els clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'engegar' }));
        }
    });
}

// Esdeveniment: aturar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està aturat
//		enviar missatge informatiu
//	- canviar l'estat del joc
//		i enviar-li missatge informatiu
function stop(ws, m) {
    // Verificar si l'usuari és l'administrador
    if (ws !== adminWs) {
        ws.close(1000, "No tens permís d'administrador");
        return;
    }

    // Si el joc ja està aturat, enviar missatge informatiu
    if (!gameRunning) {
        ws.send(JSON.stringify({
            type: 'missatge',
            text: 'El joc ja està aturat'
        }));
        return;
    }

    // Aturar el joc
    gameRunning = false;
    clearInterval(gameInterval);  // Aturar el temporitzador

    // Enviar missatge a tots els clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'aturar' }));
        }
    });
}

// Esdeveniment: agafar / deixar
// Si el joc no està en marxa, no fer res
// Si el jugador no porta pedra:
//	- si està tocant (o a sobre) d'una pedra, agafar-la
// Si el jugador porta una pedra:
//	- si està fora de les zones de construcció, deixar la pedra
//	- si està en una zona de construcció que no és del seu equip, no deixar la pedra
//	- si està en la zeva zona de construcció, eliminar la pedra i afegir un punt al seu equip
//		si ja s'han posat totes les pedres, aturar el joc
function agafar(ws, m) {
}

// Esdeveniment: direcció
//	Actualitzar la direcció del jugador

function broadcastPlayers() {
    const playersArray = Object.values(players);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'update', players: playersArray }));
        }
    });
}

function direccio(ws, m) {
	const data = JSON.parse(m);
    const playerId = data.id; // ID del jugador que envió el mensaje
    const player = players[playerId];

    if (player) {
        switch (data.direction) {
            case 'up': player.y -= INCHV; break;
            case 'down': player.y += INCHV; break;
            case 'left': player.x -= INCHV; break;
            case 'right': player.x += INCHV; break;
        }

        // Asegurarse de que el jugador no salga del área de juego
        player.x = Math.max(0, Math.min(config.width - MIDAJ, player.x));
        player.y = Math.max(0, Math.min(config.height - MIDAJ, player.y));

        // Enviar la posición actualizada a todos los clientes
        broadcastPlayers();
    }
}



/********** Temporitzador del joc **********/

// Cridar la funció mou() a intervals regulars (cada TEMPS mil·lisegons)



// Esdeveniment periòdic (cada 'TEMPS' mil·lisegons):
//	- incrementar la posició de cada jugador
//		comprovant que no surt de la zona de joc
//		i que no se solapa amb cap altre jugador
//	- si el jugador porta una pedra
//		també s'ha d'actualitzar la posició de la pedra
//	- si s'està jugant i no hi ha el màxim de pedres en la zona de joc
//		afegir una pedra en una posició aleatòria
//		evitant que quedi dins de les zones de construcció de les piràmides
//	- enviar un missatge a tothom
//		amb les posicions dels jugadors, les pedres (només si el joc està en marxa)
//		i la puntuació de cada equip (un punt per cada pedra posada en la piràmide)
// Step 2: Implement periodic game update function
function mou() {
    if (!gameRunning) return;

    // Update player positions
    Object.values(players).forEach(player => {
        // Update stone position if player has one
        if (player.stone) {
            player.stone.x = player.x;
            player.stone.y = player.y;
        }
    });

    // Add new stones if needed
    if (pedres.length < MAXPED) {
        const newStone = {
            x: Math.floor(Math.random() * (config.width - MIDAP)),
            y: Math.floor(Math.random() * (config.height - MIDAP))
        };
        
        // Avoid placing stones in pyramid zones
        if (!isInPyramidZone(newStone.x, newStone.y)) {
            pedres.push(newStone);
        }
    }

    // Broadcast game state to all clients
    broadcastGameState();
}

// Step 3: Implement stone pickup/drop function
function agafar(ws, m) {
    if (!gameRunning) return;

    const data = JSON.parse(m);
    const player = players[data.id];
    if (!player) return;

    if (!player.stone) {
        // Try to pick up a stone
        const stoneIndex = pedres.findIndex(stone => 
            Math.abs(stone.x - player.x) < MIDAJ &&
            Math.abs(stone.y - player.y) < MIDAJ
        );

        if (stoneIndex !== -1) {
            player.stone = pedres[stoneIndex];
            pedres.splice(stoneIndex, 1);
        }
    } else {
        // Try to drop the stone
        if (isInPyramidZone(player.x, player.y)) {
            if (isInTeamZone(player.x, player.y, player.team)) {
                // Add point to team
                punts[player.team]++;
                delete player.stone;
                
                // Check if game should end
                if (punts[0] + punts[1] >= config.pedres) {
                    stop(adminWs, null);
                }
            }
        } else {
            // Drop stone in current position
            pedres.push({
                x: player.x,
                y: player.y
            });
            delete player.stone;
        }
    }

    broadcastGameState();
}

// Helper function to check if position is in pyramid zone
function isInPyramidZone(x, y) {
    return (x < PHMAX || x > config.width - PHMAX) && 
           (y < PVMAX || y > config.height - PVMAX);
}

// Helper function to check if position is in team's zone
function isInTeamZone(x, y, team) {
    if (team === 0) {
        return x < PHMAX && y < PVMAX;
    } else {
        return x > config.width - PHMAX && y > config.height - PVMAX;
    }
}

function broadcastGameState() {
    const gameState = {
        type: 'dibuixar',
        jugadors: Object.values(players),
        pedres: pedres,
        punts: punts
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(gameState));
        }
    });
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

