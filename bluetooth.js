var noble = require('noble'),
	async = require('async'),
	common = require('./common');

///28:cf:e9:4e:70:18 maybe we need this later?
//localname = ReelSona
var Bluetooth = function() { };

Bluetooth.prototype.uuids = {
	accel_service: 		'1791ffa0385311e3aa6e0800200c9a66',
	accel_enable: 		'1791ffa1385311e3aa6e0800200c9a66',	
	accel_range: 		'1791ffa2385311e3aa6e0800200c9a66',
	accel_x: 			'1791ffa3385311e3aa6e0800200c9a66',
	accel_y: 			'1791ffa4385311e3aa6e0800200c9a66',
	accel_z: 			'1791ffa5385311e3aa6e0800200c9a66',
	accel_threshold: 	'1791ffa6385311e3aa6e0800200c9a66',
	accel_alert: 		'1791ffa7385311e3aa6e0800200c9a66',
	accel_self_test: 	'1791ffa8385311e3aa6e0800200c9a66',
	sonar_service: 		'1791ff90385311e3aa6e0800200c9a66',
	sonar_enable: 		'1791ff91385311e3aa6e0800200c9a66',
	water_temp: 		'1791ff92385311e3aa6e0800200c9a66',
	echoes: 			'1791ff93385311e3aa6e0800200c9a66',
	light: 				'1791ff94385311e3aa6e0800200c9a66',
	tgc_select: 		'1791ff96385311e3aa6e0800200c9a66',
	water_detect_adc: 	'1791ff9c385311e3aa6e0800200c9a66'
};

Bluetooth.prototype.localNames = ['iBobber', 'ReelSonar v1', 'ReelSonar'];

Bluetooth.prototype.bluetoothQueue = [];

Bluetooth.prototype.registerCallback = function(uuid, callback) {
    this.onReadCallbacks[uuid] = callback;
};

Bluetooth.prototype.getCallback = function(uuid) {
    return this.onReadCallbacks[uuid];
};

Bluetooth.prototype.logError = function(error) {
   if(typeof error !== 'undefined' && error != null) {
   //if(typeof error !== 'undefined') {
        console.log("[LOG][ERROR]", error);
		return true;
    }
	
	return false;
};

Bluetooth.prototype.discoverAll = function() {
	var _this = this;
	this.device.discoverServices([], function(error, services) {
      var serviceIndex = 0;

      async.whilst(
        function () {
          return (serviceIndex < services.length);
        },
        function(callback) {
          var service = services[serviceIndex];
          var serviceInfo = service.uuid;

          if (service.name) {
            serviceInfo += ' (' + service.name + ')';
          }
          console.log(serviceInfo);

          service.discoverCharacteristics([], function(error, characteristics) {
            var characteristicIndex = 0;

            async.whilst(
              function () {
                return (characteristicIndex < characteristics.length);
              },
              function(callback) {
                var characteristic = characteristics[characteristicIndex];
                var characteristicInfo = '  ' + characteristic.uuid;

                if (characteristic.name) {
                  characteristicInfo += ' (' + characteristic.name + ')';
                }

                async.series([
                  function(callback) {
                    characteristic.discoverDescriptors(function(error, descriptors) {
                      async.detect(
                        descriptors,
                        function(descriptor, callback) {
                          return callback(descriptor.uuid === '2901');
                        },
                        function(userDescriptionDescriptor){
                          if (userDescriptionDescriptor) {
                            userDescriptionDescriptor.readValue(function(error, data) {
                              if (data) {
                                characteristicInfo += ' (' + data.toString() + ')';
                              }
                              callback();
                            });
                          } else {
                            callback();
                          }
                        }
                      );
                    });
                  },
                  function(callback) {
                        characteristicInfo += '\n    properties  ' + characteristic.properties.join(', ');

                    if (characteristic.properties.indexOf('read') !== -1) {
                      characteristic.read(function(error, data) {
                        if (data) {
                          var string = data.toString('ascii');

                          characteristicInfo += '\n    value       ' + data.toString('hex') + ' | \'' + string + '\'';
                        }
                        callback();
                      });
                    } else {
                      callback();
                    }
                  },
                  function() {
                    console.log(characteristicInfo);
                    characteristicIndex++;
                    callback();
                  }
                ]);
              },
              function(error) {
                serviceIndex++;
                callback();
              }
            );
          });
        },
        function (err) {
          //_this.device.disconnect();
        }
      );
    });	
};

Bluetooth.prototype.discoverService = function(device, serviceUUID, callback) {
	var _this = this;
	
	device.discoverServices([serviceUUID], function(error, services) {
		_this.logError(error);
			
		if(services.length == 0) {
			console.log("No service found");
			callback(null);
			return;
		}
			
		var service = services[0];
		
		console.log(services);
			
		if(typeof service !== 'undefined') {
			console.log("Found service " + serviceUUID);
			callback(service);
		} else {
			callback(null);
		}
	});
};

Bluetooth.prototype.discoverCharacteristics = function(service, characteristicUUID, callback) {
	var _this = this;
	
	service.discoverCharacteristics([characteristicUUID], function(error, characteristics) {
		_this.logError(error);
				
		if(characteristics.length == 0) {
			console.log("No characteristics found");
			callback(null);
		} else {
			var characteristic = characteristics[0];
			console.log("Found characteristic " + characteristicUUID);
			callback(characteristic);
		}
	});
};

Bluetooth.prototype.getCharacteristic = function(serviceUUID, characteristicUUID, callback) {
	var _this = this;
	
	var params = {
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
			_this.discoverService(_this.device, params.serviceUUID, function(service) {
				
				if( service == null ) {
					console.log("No service has been 'found'");
					async_callback();
					return;
				}
				
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
	var _this = this;
	
	console.log("Connecting to " + device.advertisement.localName);
	
	device.connect(function(error) {
		
		if(!_this.logError(error)) {
			console.log("Connected to " + device.advertisement.localName);
		} else {
			console.log("Couldn't connect to " + device.advertisement.localName);
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
				console.log("[Noble] Scanning has stopped");
				_this.discoverAll();
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

Bluetooth.prototype.changeValue = function(value, service_uuid, characteristic_uuid, done_cb) {
     var _this = this;
	this.getCharacteristic(service_uuid, characteristic_uuid, function(characteristic, callback) {
		if(typeof characteristic !== 'undefined' && characteristic != null) {
			characteristic.write(value, true, function(error) {
                _this.logError(error);
                callback();
                done_cb();
			});
		}
	});
};

Bluetooth.prototype.notify = function(notify_value, service_uuid, characteristic_uuid, read_cb, notify_on_cb, notify_off_cb) {
    var _this = this;
    this.getCharacteristic(service_uuid, characteristic_uuid, function(characteristic, callback) {
        if(typeof characteristic !== 'undefined' && characteristic != null && notify_value) {
            characteristic.on('read', function(data, isNotification) {
                read_cb(data);
            });
        }
        
        if(typeof characteristic !== 'undefined' && characteristic != null) {
            characteristic.notify((notify_value == 1 || notify_value == true), function(error) {
                _this.logError(error);
                callback();

                if(notify_value) {
                    notify_on_cb();
                } else {
                    notify_off_cb();
                }
            });
        }
    });
};

Bluetooth.prototype.TemperatureNotify = function(value, cb) {
    var _this = this;
    
    this.notify(value, this.uuids.sonar_service, this.uuids.water_temp, function(data) {
        var temp = common.parseCelcius( data.readUInt16LE(0) );
        if(typeof _this.onReadWaterTemp !== 'undefined') {
            _this.onReadWaterTemp(temp);
        }
        console.log('Water temperature is ' + temp + ' C');
    }, function() {
        console.log('Water temperature notification is on');
        if(typeof cb !== 'undefined') {
            cb();
        }
    }, function() {
        console.log('Water temperature notification is off');
        if(typeof cb !== 'undefined') {
            cb();
        }
    });
};

/* LIGHT */
Bluetooth.prototype.changeLight = function(value, cb) {
    this.changeValue(new Buffer([value]), this.uuids.sonar_service, this.uuids.light, function() {
        console.log("Light has been changed to " + value);
        if(typeof cb !== 'undefined') {
            cb();
        }
    });
};

/*ECHOES*/
Bluetooth.prototype.changeEchoEnable = function(value, cb) {
    var _this = this;
    
	console.log("Attempting to set echo enable to " + value);
    _this.changeValue(new Buffer([value]), this.uuids.sonar_service, this.uuids.sonar_enable, function() {
        console.log("Echoes have been " + (value ? "enabled" : "disabled"));
        if(typeof cb !== 'undefined') {
            cb();
        }
    });
};

Bluetooth.prototype.EchoNotify = function(value, cb) {
    var _this = this;
    
    this.notify(value, this.uuids.sonar_service, this.uuids.echoes, function(data) {
        if(typeof _this.onReadEchoes !== 'undefined') {
            _this.onReadEchoes(data);
        }
    }, function() {
        console.log('Echo notification is on');
        
        if(typeof cb !== 'undefined') {
            cb();
        }
    }, function() {
        console.log('Echo notification is off');
        
        if(typeof cb !== 'undefined') {
            cb();
        }
    });

};

Bluetooth.prototype.disableOnDisconnect = function() {
    this.TemperatureNotify(false);
    this.EchoNotify(false);
    //this.changeEchoEnable(0);
};

module.exports = Bluetooth;