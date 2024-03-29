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
    motorPackets = require('./packets/motorpackets'),
    packetUtils = require('./packets/packetutils'),
	bluetooth = require('./bluetooth'),
    async = require('async'),
    servo = require('./servo'),
    motors = require('./motors'),
    sleep = require('sleep'),
    SerialPort = require("serialport").SerialPort,
    SegfaultHandler = require('segfault-handler');


//set console format
consoleStamp(console, "dd mmm HH:mm:ss");


// Optionally specify a callback function for custom logging. This feature is currently only supported for Node.js >= v0.12 running on Linux.
SegfaultHandler.registerHandler("crash.log", function(signal, address, stack) {
    console.log("SEGFAULT!");
    console.log("Stack Trace:\n" + stack);
});


var bluetooth_controller = new bluetooth();

/* Common packet reading/writing utilities */
var packet_utils = new packetUtils();

//bluetooth_controller.start(); 
            
var sonar_packets = new sonarPackets(bluetooth_controller);
var server_packets = new serverPackets(bluetooth_controller);
var motor_packets = new motorPackets( new servo(4, 6), new motors() );

var serialPort = new SerialPort("/dev/ttyMFD2", {
                            baudrate: 115200
                        });
                        
var sendNullPacket = function() {
    var packet = new Buffer(7);
    packet_utils.setHeader(packet, 1, 0, 0);

    /* packet value */
    packet.writeInt8(0, 6);

    if(serialPort != null) {
        try {
            serialPort.write(packet, function(err, result) {
            });
        } catch(err) { 
            console.log("Exception sending null packet: ", err);
        }
    }
}

serialPort.on('open', function() {
    
    var packet = null;

    var packetsQueue = [];

    console.log("serial port open");

     /* Set socket on packet handlers */
    sonar_packets.socket = serialPort;
    server_packets.socket = serialPort;
    motor_packets.socket = serialPort;

    //setInterval(sendNullPacket, 100);
    serialPort.on('data', function(data) {
        console.log("Got data");
        
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
            console.log("packet added and packet_processor started", params);
            packetsQueue.push(params);
            packet_processor(packetsQueue);
            
        } else {
            packetsQueue.push(params);
            console.log("packet added", params);
        }

        /* Reset for next packet */
        var total_packet_size = (6+packetSize);

        if(packet.length > total_packet_size) {
            var temp_buffer = new Buffer(packet.length-total_packet_size);
            packet.copy(temp_buffer, 0, total_packet_size);
            packet = temp_buffer;
            console.log("Copy over rest");
        } else {
            packet = null;
        }
    });

    serialPort.on('error', function(message) {
        console.log("Serial port error: " + message);
    });
    
    serialPort.on('close', function() {
        console.log("Serial port closed");
    });
});


/* Process queued packets */
var packet_processor = function(packets_queue) {
    async.whilst(function() {
        return packets_queue.length > 0;
    }, function(callback) {
        var packet = packets_queue[0];
        
        var cb = function() {
          console.log("Next packet");
          packets_queue.splice(0, 1);
          callback();  
        };
    
        switch(packet.type) {
            case types.Sonar:
                console.log("Received sonar packet");
                sonar_packets.handlePacket(packet, cb);
                break;
            case types.Motor:
                console.log("Received motor packet");
                motor_packets.handlePacket(packet, cb);
                break;
            case types.Camera:
                break;
            case types.Server:
                console.log("Received server packet");
                server_packets.handlePacket(packet, cb);
                break;
            default:
                cb();
                break;
        }
    });
};



//Create server
//var server = net.createServer();

// Track all clients
//var client;  // TODO: separate clients from users

/*server.on('connection', function(socket) {
	socket.id = shortid.generate();

	console.log( "[" + socket.id + "][CONNECTED]");

	client = socket;
	
    
    
   
    
	socket.on('data', function(data) {
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
});*/

process.on('SIGINT', function() {
	/*server.close(function(){
		console.log('Stopped listening.');
    });*/
	
    console.log("Got a SIGINT event");
	bluetooth_controller.disconnect();

    process.exit();
});