'use strict';

var _ = require('lodash'),
	net = require('net'),
	crypto = require('crypto'),
	consoleStamp = require('console-stamp'),
	shortid = require('shortid'),
	config = require('./config'),
	type = require('./packets/type');


//set console format
consoleStamp(console, "dd mmm HH:mm:ss");

//Create server
var server = net.createServer();

// Track all clients
var client;  // TODO: separate clients from users

server.on('connection', function(socket) {
	socket.id = shortid.generate();

	console.log( "[" + socket.id + "][CONNECTED]");

	client = socket;
	
	socket.on('data', function(data) {
		console.log(socket.id + "packet: " + data);

		/*switch(packet.type) {
			case type.User:
				//world.handleUserPacket(socket, packet);
				break;
			case type.Character:
				//world.handleCharacterPacket(clients, packet);
				break;
			default:
				console.log("unknown packet");
				break;
		}*/
	});

	socket.on('disconnect', function() {
		console.log("disconnect");
		world.removeClient(socket);
	});

	socket.on('error', function(e) {
		console.log("Exception: " + JSON.stringify(e));
	});
});

server.listen(config.PORT, function() {
	console.log("Server listening on port " + server.address().port);
});

process.on('SIGINT', function() {
	server.close(function(){
		console.log('Stopped listening.');
    });

    process.exit();
});

/* GENERATE RANDOM DATA AND SEND TO CLIENT EVERY 10 SECONDS */
setInterval(function() {
	if(typeof client !== 'undefined') {
		var buf = crypto.randomBytes(256);
		client.write( buf );
	}
}, 500);