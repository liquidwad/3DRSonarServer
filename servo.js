var pca9685 = require('./pca9685');
var sleep = require('sleep');

var Servo = function(gripperChannel, brakeChannel) {
    this.gripperChannel = gripperChannel;
    this.brakeChannel = brakeChannel;
    this.pwm = new pca9685(1, 0x40);
    this.pwm.setPrescaler(121);
    var minAngle = 0;
    var maxAngle = 160;

    this.pwm.setChlDuty(this.gripperChannel, 0);
    this.pwm.setChlDuty(this.brakeChannel, 0);

    // These numbers are based on experimentation with SparkFun's generic
    //  sub-micro servo motor. You may find that they are too high or too low for
    //  your particular motor. The generic settings are fairly conservative and
    //  there is no need to use these functions unless you feel like you can get
    //  a wider range of motion by doing so.
    this.pwm.setServoAnglePulseLimits(108, 450);
    this.pwm.setServoAngleLimits(0, 160);

    // enabling servo mode makes the output active high and sets the frequency to
    //  approximately 50Hz.
    this.pwm.enableServoMode();
    
    this.Brake();
    this.Close();
};

Servo.prototype.Command = function(channel, cmd) {
    this.pwm.setChlAngle(channel, cmd); 
};

Servo.prototype.Open = function() {
    this.Command(this.gripperChannel, 90); 
};

Servo.prototype.Close = function() {
    this.Command(this.gripperChannel, 49);  
};

Servo.prototype.Brake = function() {
    console.log("Brake()");
    this.Command(this.brakeChannel, 95 );
};


Servo.prototype.Release = function() {
    console.log("Release()");
    this.Command(this.brakeChannel, 120 );
};

module.exports = Servo;