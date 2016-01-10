var exports = module.exports = {};

exports.parseCelcius = function(value) {
	var celcius = null;
	
	if(value >= 1081) {
		celcius = 0;
      } else if(value >= 1044) {
         celcius = 1;
      } else if(value >= 1007) {
         celcius = 2;
      } else if(value >= 972) {
         celcius = 3;
      } else if(value >= 938) {
         celcius = 4;
      } else if(value >= 905) {
         celcius = 5;
      } else if(value >= 874) {
         celcius = 6;
      } else if(value >= 843) {
         celcius = 7;
      } else if(value >= 814) {
         celcius = 8;
      } else if(value >= 785) {
         celcius = 9;
      } else if(value >= 758) {
         celcius = 10;
      } else if(value >= 731) {
         celcius = 11;
      } else if(value >= 705) {
         celcius = 12;
      } else if(value >= 681) {
         celcius = 13;
      } else if(value >= 657) {
         celcius = 14;
      } else if(value >= 634) {
         celcius = 15;
      } else if(value >= 612) {
         celcius = 16;
      } else if(value >= 591) {
         celcius = 17;
      } else if(value >= 570) {
         celcius = 18;
      } else if(value >= 551) {
         celcius = 19;
      } else if(value >= 532) {
         celcius = 20;
      } else if(value >= 513) {
         celcius = 21;
      } else if(value >= 496) {
         celcius = 22;
      } else if(value >= 479) {
         celcius = 23;
      } else if(value >= 462) {
         celcius = 24;
      } else if(value >= 447) {
         celcius = 25;
      } else if(value >= 431) {
         celcius = 26;
      } else if(value >= 417) {
         celcius = 27;
      } else if(value >= 403) {
         celcius = 28;
      } else if(value >= 389) {
         celcius = 29;
      } else if(value >= 376) {
         celcius = 30;
      } else if(value >= 363) {
         celcius = 31;
      } else if(value >= 351) {
         celcius = 32;
      } else if(value >= 339) {
         celcius = 33;
      } else if(value >= 328) {
         celcius = 34;
      } else if(value >= 317) {
         celcius = 35;
      } else if(value >= 307) {
         celcius = 36;
      } else if(value >= 297) {
         celcius = 37;
      } else {
         celcius = 38;
      }
	  
	  return celcius;
};