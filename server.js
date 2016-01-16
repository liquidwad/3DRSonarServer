'use strict';

var _ = require('lodash'),
	net = require('net'),
	crypto = require('crypto'),
	consoleStamp = require('console-stamp'),
	shortid = require('shortid'),
	config = require('./config'),
    types = require('./packets/types'),
	opcodes = require('./packets/opcodes'),
    sonarPackets = require('./packets/sonarpackets'),
    serverPackets = require('./packets/serverpackets'),
    packetUtils = require('./packets/packetutils'),
	bluetooth = require('./bluetooth'),
    async = require('async');

//set console format
consoleStamp(console, "dd mmm HH:mm:ss");

//setup bluetooth
var bluetooth_controller = new bluetooth();

bluetooth_controller.start();

/* Common packet reading/writing utilities */
var packet_utils = new packetUtils();

/* Sonar packet handler */
var sonar_packets = new sonarPackets(bluetooth_controller);
var server_packets = new serverPackets(bluetooth_controller);

/* Process queued packets */
var packet_processor = function(packets_queue) {
    async.whilst(function() {
        return packets_queue.length > 0;
    }, function(callback) {
        var packet = packets_queue[0];
        
        var cb = function() {
          packets_queue.splice(0, 1);
          callback();  
        };
        
        switch(packet.type) {
            case types.Sonar:
                sonar_packets.handlePacket(packet, cb);
                break;
            case types.Motor:
                break;
            case types.Camera:
                break;
            case types.Server:
                server_packets.handlePacket(packet, cb);
                break;
            default:
                break;
        }
    });
};

//Create server
var server = net.createServer();

// Track all clients
var client;  // TODO: separate clients from users

server.on('connection', function(socket) {
	socket.id = shortid.generate();

	console.log( "[" + socket.id + "][CONNECTED]");

	client = socket;
	
    var packet = null;
    
    var packetsQueue = [];
    
    /* Set socket on packet handlers */
    sonar_packets.socket = client;
    server_packets.socket = client;
    
	socket.on('data', function(data) {
        if(packet != null) {
            packet = Buffer.concat([packet, data]);
        } else {
            packet = data;
        }
        
        var packetSize = packet_utils.getSize(packet);
        
        if(packetSize == null) {
            return;
        }
        
        var packetType = packet_utils.getType(packet);
        
        if(packetType == null) {
            return;
        }
        
        var packetOpcode = packet_utils.getOpcode(packet);
        
        if(packetOpcode == null) {
            return;
        }
        
        var packetValue = null;
        
        if(packetSize > 0) {
            packetValue = packet_utils.getValue(packet, packetSize);
            
            if(packetValue == null) {
                return;
            }
        }
        
        var params = {
            size: packetSize,
            type: packetType,
            opcode: packetOpcode,
            value: packetValue 
        };
        
        if(packetsQueue.length == 0) {
            packetsQueue.push(params);
            packet_processor(packetsQueue);
        } else {
            packetsQueue.push(params);
        }

        /* Reset for next packet */
        var total_packet_size = (6+packetSize);
        
        if(packet.length > total_packet_size) {
            var temp_buffer = new Buffer(packet.length-total_packet_size);
            packet.copy(temp_buffer, 0, total_packet_size);
            packet = temp_buffer;
        } else {
            packet = null;
        }
        
        //console.log("Recieved ", params, " from client");
	});

	socket.on('disconnect', function() {
		console.log("[" + socket.id + "][DISCONNECTED]");
        //bluetooth_controller.disableOnDisconnect();
	});

	socket.on('error', function(e) {
		console.log("Exception: ", e);
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