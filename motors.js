var tb6612 = require('./tb6612');

var Motors = function() {
    this.motors = new tb6612();
    this.motors.standby(true);
};

Motors.prototype.Drive = function(value) {
    this.motors.standby(false);
    this.drive = value;
    this.motors.diffDrive(value, value);
};


Motors.prototype.Brake = function() {
    this.motors.shortBrake(true,false);
}

Motors.prototype.Hold = function(value) {
    if( value == 0 )
    {
       this.motors.diffDrive(0.0,0.0);
       this.motors.standby(true);
    }
    else
    {
        this.motors.standby(false);
        this.motors.diffDrive(this.drive, this.drive);
        
    }
    
}

module.exports = Motors;