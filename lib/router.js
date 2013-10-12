// var gm = require('googlemaps')
//   , q = require('q');
// var restler = require('restler');
var request = require('request');

var get_route = function(drivers, moochers, destination, callback){
  var take_nearest = Math.floor(moochers.length / drivers.length);
  take_nearest = take_nearest > 1 ? take_nearest : 1;

  var origins = '';
  drivers.forEach(function(driver){
    origins += driver.replace(/\s/g, '+') + '|';
  });
  origins = origins.substring(0, origins.length - 1);

  var ends = '';
  moochers.forEach(function(moocher){
    ends += moocher.replace(/\s/g, '+') + '|';
  });
  ends = ends.substring(0, ends.length - 1);

  var params = 'origins=' + origins + '&destinations=' + ends + '&sensor=false';

  var matrix = [];

  request('http://maps.googleapis.com/maps/api/distancematrix/json?' + params, function(err, res, body){
    if(err){
      return callback(err, null);
    }
    var response = JSON.parse(body);
    response.rows.forEach(function(origin){
    // response.rows.forEach(function(origin, index){
      var distances = [];
      origin.elements.forEach(function(destination, index2){
        distances.push({
          name: response.destination_addresses[index2],
          distance: destination.distance.value
        });
        // console.log(response.origin_addresses[index] + ' to ' + response.destination_addresses[index2] + ': ' + destination.distance.text);
      });
      distances.sort(function(a, b){
        return a.distance > b.distance;
      });
      matrix.push(distances.map(function(element){
        return element.name;
      }));
    });
    // console.log(require('util').inspect(matrix, {depth:null}));

    var targets = [];
    for(var i = 0; i < matrix.length; i++){
      var nearest = [];
      for(var j = 0, jj = 0; jj < take_nearest && j < matrix[i].length; j++, jj++){
        nearest.push(matrix[i].shift());
        j--;
      }
      for(var k = 0; k < nearest.length; k++){
        for(var l = i + 1; l < matrix.length; l++){
          matrix[l].splice(matrix[l].indexOf(nearest[k]), 1);
        }
      }
      targets.push(nearest);
    }
    // console.log(take_nearest);
    console.log(require('util').inspect(targets, {depth:null}));
  });
};

get_route(
  [
    '1820 University Avenue, Berkeley, CA 94703',
    '1512 University Avenue, Berkeley, CA 94703'
  ], [
    '1701 Hearst Avenue, Berkeley, CA 94703',
    '1600 Sacramento Street, Berkeley, CA 94702',
    '1310 McGee Avenue, Berkeley, CA 94703',
    '2005 Berryman Street, Berkeley, CA 94709'
  ], '2215 Rose Street, Berkeley, CA 94709');