'use strict';

var opcodes = require('./opcodes');

var SonarPackets = function(bluetooth) {
    this.bluetooth = bluetooth;
};

SonarPackets.prototype.handlePacket = function(packet, callback) {
    if(packet.value.length == 1) {
        this.handleWritePacket(packet, callback);
    } 
    else if(packet.value.length > 1) {
        this.handleReadPacket(packet, callback);
    }
};

SonarPackets.prototype.handleReadPacket = function(packet, callback) {
    
};

SonarPackets.prototype.handleWritePacket = function(packet, callback) {
    var value = packet.value.readInt8(0);
    
    switch( packet.opcode ) {
        case opcodes.sonar.SonarLight:
            this.bluetooth.changeLight(value, callback);
            break;
        default:
           break;
    }
};

module.exports = SonarPackets;