var pca9685 = require('./pca9685');

var Servo = function(channel) {
    this.channel = channel;
    this.pwm = new pca9685(1, 0x40);
    this.pwm.setPrescaler(121);

    var minAngle = 0;
    var maxAngle = 160;

    this.pwm.setChlDuty(this.channel, 0);

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
};

Servo.prototype.Command = function(cmd) {
    this.pwm.setChlAngle(this.channel, cmd);  // 50 = closed. 90 = open
};

Servo.prototype.Open = function() {
    this.Command(90);
    console.log("Release opened");
};

Servo.prototype.Close = function() {
    this.Command(47);
    console.log("Release closed");
};

module.exports = Servo;