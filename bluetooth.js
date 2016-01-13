var noble = require('noble'),
	async = require('async'),
	common = require('./common');

///28:cf:e9:4e:70:18 maybe we need this later?
//localname = ReelSona
var Bluetooth = function() { };

Bluetooth.prototype.uuids = {
	accel_service: 		'1791FFA0385311E3AA6E0800200C9A66',
	accel_enable: 		'1791FFA1385311E3AA6E0800200C9A66',	
	accel_range: 		'1791ffa2385311e3aa6e0800200c9a66',
	accel_x: 			'1791ffa3385311e3aa6e0800200c9a66',
	accel_y: 			'1791ffa4385311e3aa6e0800200c9a66',
	accel_z: 			'1791ffa5385311e3aa6e0800200c9a66',
	accel_threshold: 	'1791FFA6385311E3AA6E0800200C9A66',
	accel_alert: 		'1791FFA7385311E3AA6E0800200C9A66',
	accel_self_test: 	'1791FF90385311E3AA6E0800200C9A66',
	sonar_service: 		'1791ff90385311e3aa6e0800200c9a66',
	sonar_enable: 		'1791FF91385311E3AA6E0800200C9A66',
	water_temp: 		'1791FF92385311E3AA6E0800200C9A66',
	echoes: 			'1791FF93385311E3AA6E0800200C9A66',
	light: 				'1791FF94385311E3AA6E0800200C9A66',
	tgc_select: 		'1791FF96385311E3AA6E0800200C9A66',
	water_detect_adc: 	'1791FF9C385311E3AA6E0800200C9A66'
};

Bluetooth.prototype.localNames = ['iBobber', 'ReelSonar v1', 'ReelSonar'];

Bluetooth.prototype.cachedServices = {};

Bluetooth.prototype.cachedCharacteristics = {};

Bluetooth.prototype.bluetoothQueue = [];

Bluetooth.prototype.onReadWaterTemp = null;

Bluetooth.prototype.registerCallback = function(uuid, callback) {
    this.onReadCallbacks[uuid] = callback;
};

Bluetooth.prototype.getCallback = function(uuid) {
    return this.onReadCallbacks[uuid];
};

Bluetooth.prototype.logError = function(error) {
    if(typeof error !== 'undefined' && error != null) {
        console.log(error);
    }
};

Bluetooth.prototype.discoverService = function(device, serviceUUID, callback) {
	var _this = this;
	
	if( serviceUUID in this.cachedServices ) {
		console.log("From cache " + serviceUUID);
		callback( this.cachedServices[serviceUUID] );
	} else {
		device.discoverServices([serviceUUID], function(error, services) {
            _this.logError(error);
			
			if(services.length == 0) {
				console.log("No service found");
				callback(null);
				return;
			}
			
			var service = services[0];
			
			if(typeof service !== 'undefined') {
				_this.cachedServices[serviceUUID] = service;
                console.log("Found service " + serviceUUID);
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
            _this.logError(error);
				
			if(characteristics.length == 0) {
				console.log("No characteristics found");
				callback(null);
			} else {
				var characteristic = characteristics[0];
				_this.cachedCharacteristics[characteristicUUID] = characteristic;
				console.log("Found characteristic " + characteristicUUID);
				callback(characteristic);
			}
		});
	}
};

Bluetooth.prototype.getCharacteristic = function(device, serviceUUID, characteristicUUID, callback) {
	var _this = this;
	
	var params = {
		device: device,
		serviceUUID: serviceUUID,
		characteristicUUID: characteristicUUID,
		callback: callback	
	};

	if(this.bluetoothQueue.length == 0) {
		this.bluetoothQueue.push(params);
		async.whilst(function() {
			return _this.bluetoothQueue.length > 0;
		}, function(async_callback) {
			var params = _this.bluetoothQueue[0];
			_this.discoverService(params.device, params.serviceUUID, function(service) {
				_this.discoverCharacteristics(service, params.characteristicUUID, function(characteristic) {
					_this.bluetoothQueue.splice(0, 1);
					params.callback(characteristic, async_callback);
				});
			});
		});
	} else {
		this.bluetoothQueue.push(params);
	}
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
            
            _this.device = device;
            
			_this.connectDevice(device, function() {
				noble.stopScanning();
			});
            
            setTimeout(function() {
                if(_this.device.state != 'connected') {
                    _this.device.disconnect();
                    noble.startScanning();
                    console.log("Disconnecting and retrying");
                }
            }, 5000);
		} else {
			console.log(device_localName);
		}
	});
		
	console.log("Bluetooth controller started");
};

Bluetooth.prototype.TemperatureNotify = function(On, cb) {
    var _this = this;
    
	this.getCharacteristic(this.device, this.uuids.sonar_service, this.uuids.water_temp, function(characteristic, callback) {
		if(characteristic != null) {
			if(On) {
				characteristic.on('read', function(data, isNotification) {
					var temp = common.parseCelcius( data.readUInt16LE(0) );
                    
                    if(_this.onReadWaterTemp != null) {
                        _this.onReadWaterTemp(temp);
                    }
                    
					console.log('Water temperature is ' + temp + ' C');
				});
					
				characteristic.notify(true, function(error) {
                    _this.logError(error);
                    
					console.log('Water temperature notification is on');
                    callback();
                    
                    if(typeof cb !== 'undefined') {
                        cb();
                    }
				});
			}
			else {
				characteristic.notify(false, function(error) {
                    _this.logError(error);
					console.log('Water temperature notification is off');
                    callback();
                    
                    if(typeof cb !== 'undefined') {
                        cb();
                    }
				});	
			}
		}
	});
};

/* LIGHT */
Bluetooth.prototype.changeLight = function(value, cb) {
    var _this = this;
	this.getCharacteristic(this.device, this.uuids.sonar_service, this.uuids.light, function(characteristic, callback) {
		if(characteristic != null) {
			characteristic.write(new Buffer([value]), true, function(error) {
                _this.logError(error);
                
				console.log("Light has been changed to " + value);
                callback();
                
                if(typeof cb !== 'undefined') {
                    cb();
                }
			});
		}
	});
};

/*ECHOES*/
Bluetooth.prototype.changeEchoEnable = function(value, cb) {
    var _this = this;
    
	this.getCharacteristic(this.device, this.uuids.sonar_service, this.uuids.sonar_enable, function(characteristic, callback) {
		if(characteristic != null) {
			characteristic.write(new Buffer([value]), true, function(error) {
                _this.logError(error);
				console.log("Echoes have been " + (value ? "enabled" : "disabled"));
                callback();
                
                if(typeof cb !== 'undefined') {
                    cb();
                }
			});
		}
	});
};

Bluetooth.prototype.EchoNotify = function(On, cb) {
    var _this = this;
    
	this.getCharacteristic(this.device, this.uuids.sonar_service, this.uuids.echoes, function(characteristic, callback) {
		if(characteristic != null) {
			if(On) {
				characteristic.on('read', function(data, isNotification) {
                            
                    if(_this.onReadEchoes != null) {
                        _this.onReadEchoes(data);
                    }
				});
					
				characteristic.notify(true, function(error) {
                    _this.logError(error);
					console.log('Echo notification is on');
                    callback();
                    
                    if(typeof cb !== 'undefined') {
                        cb();
                    }
				});
			}
			else {
				characteristic.notify(false, function(error) {
                    _this.logError(error);
					console.log('Echo notification is off');
                    callback();
                    
                    if(typeof cb !== 'undefined') {
                        cb();
                    }
				});	
			}
		}
	});
};

Bluetooth.prototype.disableOnDisconnect = function() {
    this.EchoNotify(0x00);
    this.changeEchoEnable(0x00);
    this.TemperatureNotify(0x00);
}

module.exports = Bluetooth;