'use strict';

var opcodes = require('./opcodes'),
    types = require('./types'),
    packetUtils = require('./packetutils'),
    net = require('net');

var ServerPackets = function(bluetooth) {
    var _this = this;
    
    this.packet_utils = new packetUtils();
    
    this.bluetooth = bluetooth;
};

ServerPackets.prototype.socket = null;

ServerPackets.prototype.handlePacket = function(packet, callback) {
    if(packet.value && packet.value.length > 0) {
        this.handleWritePacket(packet, callback);
    } 
    else if(packet.value == null) {
        this.handleReadPacket(packet, callback);
    }
};

ServerPackets.prototype.handleReadPacket = function(packet, callback) {
    switch( packet.opcode ) {
        case opcodes.server.Disconnect:
            if(this.socket != null){
                console.log("[" + this.socket.id + "][DISCONNECTED]");
                try {
                    this.socket.destroy();
                    
                    if(typeof this.bluetooth !== 'undefined') {
                        this.bluetooth.disableOnDisconnect();
                    }
                } catch(err) { }
            }
            callback();
            break;
        default:
            callback();
           break;
    }
};

ServerPackets.prototype.handleWritePacket = function(packet, callback) {
    var value = packet.value.readInt8(0);
};

module.exports = ServerPackets;