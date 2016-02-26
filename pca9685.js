var mraa = require('mraa');
var sleep = require('sleep');


// Let's make a big long hideous list of all the register names and pin names!

 var MODE1          =   0x00;
 var RESTART        =   0x80;    // Has something to do with sleep mode. I don't 
                                //  really get it.
 var EXTCLK         =   0x40;    // Write to '1' to disable internal clock. Cannot
                                //  be reset to '0' without power cycle or reset.
 var AI             =   0x20;    // Set to '1' to enable autoincrement register
                                //  during write operations. Defaults to '0'.
 var SLEEP          =   0x10;    // Set to '0' to leave sleep and enable internal
                                //  oscillator. Defaults to '1' on boot.
 var SUB1           =   0x08;    // Set to '1' to allow part to respond to address
 var SUB2           =   0x04;    //  in SUBADRx registers. Defaults to '0'.
 var SUB3           =   0x02;
 var ALLCALL        =   0x01;    // Set to '1' to allow part to respond to address
                                //  in ALLCALL register. Defaults to '1'.

 var MODE2   =      0x01;
 var INVRT   =      0x10; // Write to '1' to invert output (i.e., a when the
                            //  pin is ON, the output will be low, or the
                            //  open-drain transistor will be off).
 var OCH    =       0x08; // '0' (default) is update PWM behavior on I2C STOP
                            // '1' is update on I2C ACK
 var OUTDRV  =      0x04; // '0' is open-drain mode, '1' (default) is 
                            //  totem-pole drive.
 var OUTNE1  =      0x02; // These bits affect behavior when OE is high and
 var OUTNE0   =     0x01; //  the outputs are disabled. 
                            // 00 - Output is '0'
                            // 01 - Output is '1' in totem-pole mode
                            //      Output is Hi-z in open drain mode
                            // 1x - Output is Hi-z

// The SUBADR registers allow you to set a second (or third, or fourth) I2C
// address that the PCA9685 will respond to. Thus, you can set up multiple
// "subnets" on the I2C bus. These power up to 0xe2, 0xe4 and 0xe6, but can't
// be used until the SUBx bits in MODE1 are set.
var SUBADR1  =     0x02;

var SUBADR2  =     0x03;

var SUBADR3   =    0x04;

// This register powers up with a value of 0xE0, allowing the user to access
// *all* PCA9685 devices on the bus by writing to address 0x70. This function 
// is enabled by default, but can be disabled by clearing the ALLCALL bit in
// MODE1.
var ALLCALLADR =   0x05;

// Each channel has two 12-bit registers associated with it: ON and OFF. The
// PCA9685 has an internal 12-bit register which counts from 0-4095 and then
// overflows. When the ON register matches that counter, the pin asserts. When
// the OFF register matches, the pin de-asserts. 
var LED0_ON_L   =  0x06;
var LED0_ON_H   =  0x07;
var LED0_OFF_L  =  0x08;
var LED0_OFF_H  =  0x09;
var LED1_ON_L   =  0x0a;
var LED1_ON_H   =  0x0b;
var LED1_OFF_L  =  0x0c;
var LED1_OFF_H  =  0x0d;
var LED2_ON_L   =  0x0e;
var LED2_ON_H   =  0x0f;
var LED2_OFF_L  =  0x10;
var LED2_OFF_H  =  0x11;
var LED3_ON_L   =  0x12;
var LED3_ON_H   =  0x13;
var LED3_OFF_L  =  0x14;
var LED3_OFF_H  =  0x15;
var LED4_ON_L   =  0x16;
var LED4_ON_H   =  0x17;
var LED4_OFF_L  =  0x18;
var LED4_OFF_H  =  0x19;
var LED5_ON_L   =  0x1a;
var LED5_ON_H   =  0x1b;
var LED5_OFF_L  =  0x1c;
var LED5_OFF_H  =  0x1d;
var LED6_ON_L   =  0x1e;
var LED6_ON_H   =  0x1f;
var LED6_OFF_L  =  0x20;
var LED6_OFF_H  =  0x21;
var LED7_ON_L   =  0x22;
var LED7_ON_H   =  0x23;
var LED7_OFF_L  =  0x24;
var LED7_OFF_H  =  0x25;
var LED8_ON_L   =  0x26;
var LED8_ON_H   =  0x27;
var LED8_OFF_L  =  0x28;
var LED8_OFF_H  =  0x29;
var LED9_ON_L   =  0x2a;
var LED9_ON_H   =  0x2b;
var LED9_OFF_L  =  0x2c;
var LED9_OFF_H  =  0x2d;
var LED10_ON_L  =  0x2e;
var LED10_ON_H  =  0x2f;
var LED10_OFF_L =  0x30;
var LED10_OFF_H =  0x31;
var LED11_ON_L  =  0x32;
var LED11_ON_H  =  0x33;
var LED11_OFF_L =  0x34;
var LED11_OFF_H =  0x35;
var LED12_ON_L  =  0x36;
var LED12_ON_H  =  0x37;
var LED12_OFF_L =  0x38;
var LED12_OFF_H =  0x39;
var LED13_ON_L  =  0x3a;
var LED13_ON_H  =  0x3b;
var LED13_OFF_L =  0x3c;
var LED13_OFF_H =  0x3d;
var LED14_ON_L  =  0x3e;
var LED14_ON_H  =  0x3f;
var LED14_OFF_L =  0x40;
var LED14_OFF_H =  0x41;
var LED15_ON_L  =  0x42;
var LED15_ON_H  =  0x43;
var LED15_OFF_L =  0x44;
var LED15_OFF_H =  0x45;

// These registers allow the user to load *all* the corresponding registers at
// the same time. This is useful for resetting all registers to zero or to a
// common brightness.
var ALL_LED_ON_L = 0xfa;
var ALL_LED_ON_H = 0xfb;
var ALL_LED_OFF_L= 0xfc;
var ALL_LED_OFF_H= 0xfd;

// The PRE_SCALE register allows the user to set the PWM frequency. The
// equation for determining this value is
//  PRE_SCALE = ((f_clk)/(4096*f_pwm))-1
// Of course, only positive integers are allowed, and futhermore, a minimum
// value of 3 is enforced on the value in this register.
// f_clk is, by default, 25MHz; external clocks can be applied. 
var PRE_SCALE  =   0xfe;


// Servo angle calculation constants
//  We want to give the user the ability to specify an angle (range 0 to 180)
//  and have a servo simply move to that angle. Thus, we need two constants
//  to do the scaling math: MIN_WIDTH and MAX_WIDTH. A pulse of MIN_WIDTH
//  corresponds to an angle of 0, and MAX_WIDTH of 180. These values can vary
//  across servo models; the defaults here are a swag.
//  Servos expect a pulse train of varying duty cycle and 50Hz frequency; to
//  get that frequency, we want to set the prescaler to 121, which makes the
//  numbers below each represent ~4.5us per count.

var SERVO_PRESCALER = 121;
var MIN_WIDTH = 200;
var MAX_WIDTH = 450;

// Let's make a class! 
var _minServoPL, _maxServoPL;
var _minAngle, _maxAngle;
var _i2cAddr;
var _pca_port;

var PCA9685 = function( i2cBus, i2cAddr ) {
    _i2cAddr = i2cAddr;
    _pca_port = new mraa.I2c( i2cBus );
    _minServoPL = MIN_WIDTH;
    _maxServoPL = MAX_WIDTH;
    _minAngle = 0;
    _maxAngle = 180;
    
    this.setPrescaler(14); // f= ~400Hz
    _pca_port.address(i2cAddr);
    _pca_port.writeReg(MODE1, AI); //enable autoincrement and osc
    _pca_port.writeReg(MODE2, INVRT); // open drain outs
}

// Set the prescaler. This requires some fancy twiddling of the SLEEP and
//  RESTART bits in the MODE1 register; this function handles all of that.
PCA9685.prototype.setPrescaler = function(prescaler) {
  var modeReg;
  
  // Set the SLEEP bit, which stops the oscillator on the part.
  modeReg = _pca_port.readReg(MODE1);
  modeReg |= SLEEP;
  _pca_port.writeReg(MODE1, modeReg);

  // This register can only be written when the oscillator is stopped.
  _pca_port.writeReg(PRE_SCALE, prescaler);

  // Clear the sleep bit.
  modeReg = _pca_port.readReg(MODE1);
  modeReg &= ~(SLEEP);
  _pca_port.writeReg(MODE1, modeReg);

  sleep.usleep(500); // According to the datasheet, we must wait 500us before
               //  we touch the RESTART bit after touching the SLEEP bit.
               //  *Maybe* we can count on that much time elapsing in the
               //  I2C transaction, but let's be on the safe side.

  // Set the RESTART bit which, counterintuitively, clears the actual RESTART
  //  bit in the register.
  modeReg = _pca_port.readReg(MODE1);
  modeReg |= RESTART;
  _pca_port.writeReg(MODE1, modeReg);
}


// Servo Mode means we're working at 50Hz, which is what most servos want. It
//  also means we've made the output non-inverted, although we leave it open
//  drain and let the pullup resistors handle the highs.
PCA9685.prototype.enableServoMode = function()
{
  var mode2RegVal = _pca_port.readReg(MODE2);
  mode2RegVal &= ~INVRT;
  _pca_port.writeReg(MODE2, mode2RegVal);
  this.setPrescaler(SERVO_PRESCALER);
}

PCA9685.prototype.setServoAnglePulseLimits = function(minServoPL, maxServoPL){
    _minServoPL = minServoPL;
    _maxServoPL = maxServoPL;
}

PCA9685.prototype.setServoAngleLimits = function(minAngle, maxAngle){
    _minAngle = minAngle;
    _maxAngle = maxAngle;
}

PCA9685.prototype.setChlAngle = function(channel, angle){
    if ( (angle > _maxAngle) || (angle < _minAngle) )
        return;
    
    var pulseLen = (angle - _minAngle)*(_maxServoPL - _minServoPL) / (_maxAngle - _minAngle) + _minServoPL;
    this.setChlTime(channel, 0, pulseLen);
}

/*
PCA9685.prototype.getChlTime = function(channel)
{
    var result;
    var onL = LED0_ON_L + (channel*4);
    var onH = onL + 1;
    var offL = onL + 2;
    var offH = onL + 3;
    var temp;
    result.on = _pca_port.readReg(onL);
    result.on += _pca_port.readReg(onH) << 8;
    
    result.off = _pca_port.readReg(offL);
    result.off += _pca_port.readReg(offH) << 8;

    return result;
}
*/

PCA9685.prototype.setChlDuty = function(channel, duty)
{
  var onTime = 0;
  var offTime = (duty*4096*.01)-1;
  this.channelWrite(channel, onTime, Math.floor(offTime));
}

// Public version of the hardware abstraction.
PCA9685.prototype.setChlTime = function(channel, start, stop)
{
  this.channelWrite(channel, start, stop);
}

// Hardware abstraction write. Choose the channel, start time and stop time.
//  Start and stop time are given in counts, and the length of one count
//  varies depending on the prescaler. For servos, it's about 4.5us.
PCA9685.prototype.channelWrite = function(channel, on, off)
{
  var onL = LED0_ON_L + (channel*4);
  var onH = onL + 1;
  var offL = onL + 2;
  var offH = onL + 3;
  _pca_port.writeReg(onL, on&0xff);
  _pca_port.writeReg(onH, on>>8);
  _pca_port.writeReg(offL, off&0xff);
  _pca_port.writeReg(offH, (off>>8)&0xff);
}
                               
module.exports = PCA9685;