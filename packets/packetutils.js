'use strict';

var PacketUtils = function() {};

PacketUtils.prototype.getSize = function(packet) {
    if(packet.length >= 4) {
        return packet.readInt32LE(0); 
    }
    
    return null;
};

PacketUtils.prototype.getType = function(packet) {
    if(packet.length >= 5) {
        return packet.readInt8(4);
    }
    return null;
};

PacketUtils.prototype.getOpcode = function(packet) {
    if(packet.length >= 6) {
        return packet.readInt8(5);
    }
    
    return null;
};

PacketUtils.prototype.getValue = function(packet, length) {
    var buffer = new Buffer(length);
   
    if(packet.length >= 6+length) {
        packet.copy(buffer, 0, 6, 6+length); 
        return buffer; 
    }
    return null;
};


module.exports = PacketUtils;