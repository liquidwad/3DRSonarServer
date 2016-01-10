'use strict';

var _ = require('lodash'),
	net = require('net'),
	crypto = require('crypto'),
	consoleStamp = require('console-stamp'),
	shortid = require('shortid'),
	config = require('./config'),
	type = require('./packets/opcodes'),
	bluetooth = require('./bluetooth');

//set console format
consoleStamp(console, "dd mmm HH:mm:ss");

//setup bluetooth
var bluetooth_controller = new bluetooth();

bluetooth_controller.start();

//Create server
var server = net.createServer();

// Track all clients
var client;  // TODO: separate clients from users

server.on('connection', function(socket) {
	socket.id = shortid.generate();

	console.log( "[" + socket.id + "][CONNECTED]");

	client = socket;
	
    var packet = null;
    
	socket.on('data', function(data) {
		console.log(socket.id + "packet: " + data);
        
        packet += data;
        
        console.log(data);
		/*
		switch(data[0]) {
			case type.User:
				//world.handleUserPacket(socket, packet);
				break;
			case type.Character:
				//world.handleCharacterPacket(clients, packet);
				break;
			default:
				console.log("unknown packet");
				break;
		}
		*/
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
	
	bluetooth_controller.disconnect();

    process.exit();
});