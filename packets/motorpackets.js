'use strict';

var opcodes = require('./opcodes'),
    types = require('./types'),
    packetUtils = require('./packetutils'),
    Servo = require('../servo'),
    Motors = require('../motors'),
    sleep = require('sleep')

var MotorPackets = function(servos, motors) {
    var _this = this;
    this.servos = servos;
    this.motors = motors;
};

MotorPackets.prototype.socket = null;

MotorPackets.prototype.handlePacket = function(packet, callback) {
    if(packet.value && packet.value.length >= 1) {
        this.handleWritePacket(packet, callback);
    } 
    else if(packet.value == null) {
        this.handleReadPacket(packet, callback);
    }
    else
        callback();
};

MotorPackets.prototype.handleReadPacket = function(packet, callback) {
    var _this = this;
    
    Console.log("Got request to read packet but motor module has no read packets");
    callback();
};

MotorPackets.prototype.handleWritePacket = function(packet, callback) {

    switch( packet.opcode ) {
        case opcodes.motor.Gripper:
            console.log("Recieved 'Motor Gripper' packet from client");
            if( packet.value.readInt8(0) == 1 ) {
                this.servos.Close();
                console.log("Gripper closed");
            }
            else {
                this.servos.Open();
                console.log("Gripper opened");
            }
            break;
        case opcodes.motor.MotorDrive:
            var drive = packet.value.readFloatLE(0);
            console.log("Recieved 'Motor Drive' packet from client. Value: " + drive);
            if(drive != 0.0 )
                this.servos.Release();
            else
                this.servos.Brake();
            if( drive < 0.0 )
                this.motors.Drive(drive); 
            break;
        case opcodes.motor.MotorHold:
            console.log("Recieved 'Motor Hold' packet from client. Value: " + packet.value.readInt8(0));
            this.motors.Hold(packet.value.readInt8(0));
            this.servos.Brake();
            break;
        default:
            break;
    }
    
    callback();
};


module.exports = MotorPackets;