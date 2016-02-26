'use strict';

var opcodes = require('./opcodes'),
    types = require('./types'),
    packetUtils = require('./packetutils'),
    Servo = require('../servo'),
    Motors = require('../motors')

var MotorPackets = function(servo, motors) {
    var _this = this;
    this.servo = servo;
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
};

MotorPackets.prototype.handleReadPacket = function(packet, callback) {
    var _this = this;
    
    Console.log("Got request to read packet but motor module has no read packets");
};

MotorPackets.prototype.handleWritePacket = function(packet, callback) {

    switch( packet.opcode ) {
        case opcodes.motor.Gripper:
            console.log("Recieved 'Motor Gripper' packet from client");
            if( packet.value.readInt8(0) == 1 )
                this.servo.Close();
            else
                this.servo.Open();
            break;
        case opcodes.motor.MotorDrive:
            console.log("Recieved 'Motor Drive' packet from client. Value: " + packet.value.readFloatLE(0));
            this.motors.Drive(packet.value.readFloatLE(0)); 
            break;
        case opcodes.motor.MotorHold:
            console.log("Recieved 'Motor Hold' packet from client. Value: " + packet.value.readInt8(0));
            this.motors.Hold(packet.value.readInt8(0));
            break;
        default:
            break;
    }
    
    callback();
};


module.exports = MotorPackets;