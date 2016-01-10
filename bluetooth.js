var noble = require('noble'),
	common = require('./common');

///28:cf:e9:4e:70:18 maybe we need this later?
//localname = ReelSona
var Bluetooth = function() {
	console.log("Bluetooth");
};

Bluetooth.prototype.uuids = {
	accel_service: '1791FFA0385311E3AA6E0800200C9A66',
	accel_enable: '1791FFA1385311E3AA6E0800200C9A66',	
	accel_threshold: '1791FFA6385311E3AA6E0800200C9A66',
	accel_alert: '1791FFA7385311E3AA6E0800200C9A66',
	accel_self_test: '1791FF90385311E3AA6E0800200C9A66',
	sonar_service: '1791ff90385311e3aa6e0800200c9a66',
	sonar_enable: '1791FF91385311E3AA6E0800200C9A66',
	water_temp: '1791FF92385311E3AA6E0800200C9A66',
	echoes: '1791FF93385311E3AA6E0800200C9A66',
	light: '1791FF94385311E3AA6E0800200C9A66',
	water_detect_adc: '1791FF9C385311E3AA6E0800200C9A66'
};

Bluetooth.prototype.localNames = ['iBobber', 'ReelSonar v1', 'ReelSonar'];

Bluetooth.prototype.cachedServices = {};

Bluetooth.prototype.cachedCharacteristics = {};

Bluetooth.prototype.discoverService = function(device, serviceUUID, callback) {
	var _this = this;
	
	if( serviceUUID in this.cachedServices ) {
		console.log("From cache " + serviceUUID);
		callback( this.cachedServices[serviceUUID] );
	} else {
		device.discoverServices([serviceUUID], function(error, services) {
			if(typeof error !== 'undefined' && error != null) {
				console.log(error);
			}
			
			if(services.length == 0) {
				console.log("No service found");
				callback(null);
				return;
			}
			
			var service = services[0];
			
			if(typeof service !== 'undefined') {
				console.log("Found service");
				_this.cachedServices[serviceUUID] = service;
				callback(service);
			} else {
				callback(null);
			}
		});
	}
};

Bluetooth.prototype.discoverCharacteristics = function(service, characteristicUUID, callback) {
	var _this = this;
	
	if(characteristicUUID in this.cachedCharacteristics) {
		console.log("From cache " + characteristicUUID);
		callback(this.cachedCharacteristics[characteristicUUID]);
	} else {
		service.discoverCharacteristics([characteristicUUID], function(error, characteristics) {
			if(typeof error !== 'undefined' && error != null) {
				console.log(error);
			}
				
			if(characteristics.length == 0) {
				console.log("No characteristics found");
				callback(null);
			} else {
				var characteristic = characteristics[0];
				
				_this.cachedCharacteristics[characteristicUUID] = characteristic;
				console.log("Found characteristic");
				callback(characteristic);
			}
		});
	}
};

Bluetooth.prototype.getCharacteristic = function(device, serviceUUID, characteristicUUID, callback) {
	var _this = this;
	
	console.log("Searching for char " + characteristicUUID + " in service " + serviceUUID);
	
	this.discoverService(device, serviceUUID, function(service) {
		_this.discoverCharacteristics(service, characteristicUUID, callback);
	});
};

Bluetooth.prototype.connectDevice = function(device, callback) {
	console.log("Connecting to " + device.advertisement.localName);
	
	device.connect(function(error) {
		if(typeof error !== 'undefined') {
			console.log(error);
		} else {
			console.log("Connected to " + device.advertisement.localName);
		}
		
		callback();
	});
};

Bluetooth.prototype.disconnect = function() {
	if(typeof this.device !== 'undefined') {
		this.device.disconnect();
		console.log("Device " + this.device.advertisement.localName + " has been disconnected");
	}	
};

Bluetooth.prototype.start = function() {
	var _this = this;
	
	noble.on('stateChange', function(state) {
		if(state == 'poweredOn') {
			noble.startScanning();
			console.log("Scanning started");
		} else {
			noble.stopScanning();
			console.log("Scanning stopped");
		}
	});
	
	noble.on('discover', function(device) {
		var device_localName = device.advertisement.localName;
		var index = _this.localNames.indexOf(device_localName);
		if(index != -1) {
			console.log(_this.localNames[index] + " found!");
			noble.stopScanning();
			_this.connectDevice(device, function() {
				_this.TemperatureNotify(true);
			});
			_this.device = device;
		} else {
			console.log(device_localName);
		}
	});
		
	console.log("Bluetooth controller started");
};

Bluetooth.prototype.TemperatureNotify = function(On) {
	if(On) {
		this.getCharacteristic(this.device, this.uuids.sonar_service, this.uuids.water_temp, function(characteristic) {
			if(characteristic != null) {
				characteristic.on('read', function(data, isNotification) {
					var temp = common.parseCelcius( data.readUInt16LE(0) );
					console.log('Water temperature is ' + temp + ' C');
				});
				
				characteristic.notify(true, function(error) {
					console.log('Water temperature notification is on');
				});
			}
		});
	}
};

Bluetooth.prototype.sensorOn = function(value) {
	
};

Bluetooth.prototype.changeLight = function(value) {
	this.getCharacteristic(this.device, this.uuids.sonar_service, this.uuids.light, function(characteristic) {
		if(characteristic != null) {
			characteristic.write(new Buffer([value]), true, function(error) {
				console.log("Light has been changed to " + value);
			});
		}
	});
};

Bluetooth.prototype.lightsOn = function() {
	this.changeLight(0x01);
};

Bluetooth.prototype.lightsOff = function() {
	this.changeLight(0x00);
};

Bluetooth.prototype.lightsStrobe = function() {
	this.changeLight(0x02);
};

module.exports = Bluetooth;