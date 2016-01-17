'use strict';

var opcodes = require('./opcodes'),
    types = require('./types'),
    packetUtils = require('./packetutils');

var SonarPackets = function(bluetooth) {
    var _this = this;
    
    this.packet_utils = new packetUtils();
    
    this.bluetooth = bluetooth;
    
    this.bluetooth.onReadWaterTemp = function(temp) {
        var packet = new Buffer(7);

        _this.packet_utils.setHeader(packet, 1, types.Sonar, opcodes.sonar.SonarWaterTemp);
        
        /* packet value */
        packet.writeInt8(temp, 6);
        
        if(_this.socket != null) {
            try {
                _this.socket.write(packet);
            } catch(err) { 
                console.log("Exception ReadWaterTemp", err);
            }
            console.log("Water Temp " + temp + " packet send to client");
        }
    };
    
    this.bluetooth.onReadEchoes = function(data) {
        var packet = new Buffer(6 + data.length);

        _this.packet_utils.setHeader(packet, data.length, types.Sonar, opcodes.sonar.SonarEchoes);
        
        /* copy packet payload */
        data.copy(packet, 6, 0);
        
        if(_this.socket != null) {
            try {
                _this.socket.write(packet);
            } catch(err) { 
                console.log("Exception Echoes", err);
            }
            
            console.log("Echoes ", data, " packet sent to client");
        }
    };
    
    this.bluetooth.onDisconnect = function() {
        var packet = new Buffer(6);
        _this.packet_utils.setHeader(packet, 0, types.Sonar, opcodes.sonar.BleDisconect);
        
        if(_this.socket != null) {
            try {
                _this.socket.write(packet);
            } catch(err) { 
                console.log("Exception onDisconnect", err);
            }
            console.log("Bluetooth disconnect packet sent to client");
        }
    };
};

SonarPackets.prototype.socket = null;

SonarPackets.prototype.handlePacket = function(packet, callback) {
    if(packet.value && packet.value.length == 1) {
        this.handleWritePacket(packet, callback);
    } 
    else if(packet.value == null) {
        this.handleReadPacket(packet, callback);
    }
};

SonarPackets.prototype.handleReadPacket = function(packet, callback) {
    switch( packet.opcode ) {
        case opcodes.sonar.BleConnect:
            console.log("Recieved 'Ble Status' packet from client");
        
            var onConnected = function() {
                var packet = new Buffer(6);
                _this.packet_utils.setHeader(packet, 0, types.Sonar, opcodes.sonar.BleConnect);
                
                 if(_this.socket != null) {
                    try {
                        _this.socket.write(packet);
                    } catch(err) { 
                        console.log("Exception OnConnected", err);
                    }
                    
                    console.log("Connected packet sent to client");
                }
                
                callback();
            };
            
            if(this.bluetooth.isConnected()) {
                onConnected();
            } else {
                this.bluetooth.onConnected = onConnected;
            }
            break;
        default:
            break;
    }
};

SonarPackets.prototype.handleWritePacket = function(packet, callback) {
    var value = packet.value.readInt8(0);
    
    switch( packet.opcode ) {
        case opcodes.sonar.SonarLight:
            this.bluetooth.changeLight(value, callback);
            break;
        case opcodes.sonar.SonarWaterTemp:
            this.bluetooth.TemperatureNotify(value, callback);
            break;
        case opcodes.sonar.SonarEnable:
            this.bluetooth.changeEchoEnable(value, callback);
            break;
        case opcodes.sonar.SonarEchoes:
            this.bluetooth.EchoNotify(value, callback);
            break;
        default:
           break;
    }
};

module.exports = SonarPackets;