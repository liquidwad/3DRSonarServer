var mraa = require('mraa');
var sleep = require('sleep');

var tb6612 = function() {
    // _pwmA is pwm channel 0, on pin 20 in mraa
    this.pwmA = new mraa.Pwm(20);
    this.pwmA.period_us(1000);
    this.pwmA.enable(true);
   
    // _pwmB is pwm channel 1, on pin 14 in mraa
    this.pwmB = new mraa.Pwm(14);
    this.pwmB.period_us(1000);
    this.pwmB.enable(true);
    
    this.pwmA.write(0.01);
    this.pwmB.write(0.01);
    this.pwmA.write(0.0);
    this.pwmB.write(0.0);
    
    // _A1 and _A2 are on GPIO48 and GPIO47, respectively, which are pins 33 and
    //  46 in mraa, respectively.
    this.A1 = new mraa.Gpio(33);
    this.A2 = new mraa.Gpio(46);
    
    this.A1.dir(mraa.DIR_OUT);
    this.A1.mode(mraa.MODE_STRONG);
    this.A1.write(1);
    
    this.A2.dir(mraa.DIR_OUT);
    this.A2.mode(mraa.MODE_STRONG);
    this.A2.write(1);
    
    // _B1 and _B2 are on GPIO15 and GPIO14, respectively, which are pins 48 and
    //  36, respectively
    this.B1 = new mraa.Gpio(48);
    this.B2 = new mraa.Gpio(36);
    
    this.B1.dir(mraa.DIR_OUT);
    this.B1.mode(mraa.MODE_STRONG);
    this.B1.write(1);
    
    this.B2.dir(mraa.DIR_OUT);
    this.B2.mode(mraa.MODE_STRONG);
    this.B2.write(1);
    
    // _standbyPin is on GPIO49, which is pin 47 in mraa
    this.standbyPin = new mraa.Gpio(47);
    this.standbyPin.dir(mraa.DIR_OUT);
    this.standbyPin.mode(mraa.MODE_STRONG);
    this.standbyPin.write(1);
    
    this.dcA = 0.0;
    this.dcB = 0.0;
};

// General purpose drive function. Values for dcA and dcB should be
//  between -1.0 and 1.0 inclusive.
tb6612.prototype.diffDrive = function(dcA, dcB) {
    this.dcA = dcA;
    this.dcB = dcB;
    
    if(dcA < 0) {
        this.revA();
        dcA *= -1;
    } else {
        this.fdwA();
    }
    
    if(dcB < 0) {
        this.revB();
        dcB *= -1
    } else {
        this.fdwB();
    }
    
    this.pwmA.write(dcA);
    this.pwmB.write(dcB);
};

// standby differs from brake in that the outputs are hi-z instead of
//  shorted together. After the constructor is called, the motors are in
//  standby.
tb6612.prototype.standby = function(disableMotors) {
    if(disableMotors) {
        this.standbyPin.write(0);
    }
    else {
        this.standbyPin.write(1);
    }
};

// shortBrake shorts the motor leads together to drag the motor to a halt
//  as quickly as possible.
tb6612.prototype.shortBrake = function(brakeA, breakeB) {
    if(brakeA) {
        this.A1.write(1);
        this.A2.write(1);
    }
    
    if(brakeB) {
        this.B1.write(1);
        this.B2.write(1);
    }
};

// checks the standby gpio pin and returns true or false depending on that
//  pin's current state.
tb6612.prototype.getStandyby = function() {
    var standby = this.standbyPin.read();
    
    if(standby == 0) { 
        return true; 
    }
    
    return false;
};

// getDiffDrive relies on the recorded value of the drive values; it does
//  not retrieve them from the OS. Thus, if an external process has
//  modified them, these values may be wrong.
tb6612.prototype.getDiffDrive = function() {
    return { dcA: this.dcA, dcB: this.dcB };
};

tb6612.prototype.getShortBrake = function() {
    var brakeA = false;
    var brakeB = false;
    
    if( (this.A1.read() == 1) && (this.A2.read() == 1) ) {
        brakeA = true;
    }
    
    if( (this.B1.read() == 1) && (this.B2.read() == 1) ) {
        brakeB = true;
    }
    
    return { brakeA: brakeA, brakeB: brakeB };
};

tb6612.prototype.fdwA = function() {
    this.A1.write(0);
    this.A2.write(1);
};

tb6612.prototype.revA = function() {
    this.A1.write(1);
    this.A2.write(0);
};

tb6612.prototype.fdwB = function() {
    this.B1.write(0);
    this.B2.write(1);
};

tb6612.prototype.revB = function() {
    this.B1.write(1);
    this.B2.write(0);
};

module.exports = tb6612;