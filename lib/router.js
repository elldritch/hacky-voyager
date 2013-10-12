// var gm = require('googlemaps');
//   , q = require('q');
// var restler = require('restler');
var request = require('request');

var get_targets = function(drivers, moochers, end_address, callback){
  var driver_addresses = drivers.map(function(driver){
    return driver.location;
  });
  var moocher_addresses = moochers.map(function(moocher){
    return moocher.location;
  });
  // console.log(drivers, driver_addresses);

  var take_nearest = Math.floor(moochers.length / drivers.length);
  take_nearest = take_nearest >= 1 ? take_nearest : 1;
  // console.log(end_address);

  var origins = '';
  driver_addresses.forEach(function(driver){
    origins += driver.replace(/\s/g, '+') + '|';
  });
  origins = origins.substring(0, origins.length - 1);

  var ends = '';
  moocher_addresses.forEach(function(moocher){
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

    var formatted = [];
    for(var i = 0; i < targets.length; i++){
      formatted.push({
        start: drivers[i],
        // waypoints: {
        //   name: moochers[i],
        //   location: targets[i]
        // },
        waypoints: targets[i],
        end: end_address
      });
    }
    // console.log(formatted);
    // console.log(end_address);
    // console.log(take_nearest);
    // console.log(require('util').inspect(targets, {depth:null}));
    // console.log(require('util').inspect(formatted, {depth:null}));
    callback(null, formatted);
  });
};

var get_directions = function(start, waypoints, end, callback){
  var pickups = 'optimize:true';
  waypoints.forEach(function(moocher){
    pickups += '|' + moocher.replace(/\s/g, '+');
  });

  // console.log(waypoints);

  var params = 'origin=' + start.replace(/\s/g, '+') + '&waypoints=' + pickups + '&destination=' + end.replace(/\s/g, '+') + '&sensor=false';
  request('http://maps.googleapis.com/maps/api/directions/json?' + params, function(err, res, body){
    // console.log(params);
    var directions = JSON.parse(body);
    var output = '';
    directions.routes[0].legs.forEach(function(leg){
      output += '<ol>';
      leg.steps.forEach(function(step){
        // console.log(step.html_instructions);
        // output += step.html_instructions + '<br />';
        output += '<li>' + step.html_instructions + '</li>';
      });
      output += '</ol>';
    });
    // console.log(output);
    // output = output.substring(0, output.length - 4);
    // console.log('###################################');
    // console.log(output);
    // console.log(start, waypoints, end);
    callback(null, output);
  });
};

module.exports = {
  get_groups: function(drivers, moochers, end, callback){
    // var driver_addresses = drivers.map(function(driver){
    //   return driver.location;
    // });
    // var moocher_addresses = moochers.map(function(moocher){
    //   return moocher.location;
    // });
    get_targets(drivers, moochers, end, function(err, targets){
    // get_targets(driver_addresses, moocher_addresses, end, function(err, targets){
      if(err){
        return callback(err, null);
      }
      var out = [];
      for(var i = 0; i < drivers.length; i++){
        out.push({
          name: drivers[i].name,
          targets: targets[i]
        });
      }
      callback(null, out);
    });
  },
  get_directions: function(group, callback){
    console.log(group.targets);
    get_directions(group.targets.start.location, group.targets.waypoints, group.targets.end, function(err, directions){
      if(err){
        return callback(err, null);
      }
      var out = {
        name: group.name,
        directions: directions
      };
      callback(null, out);
    });
  }
};

// get_targets(
//   [
//     '1820 University Avenue, Berkeley, CA 94703',
//     '1512 University Avenue, Berkeley, CA 94703',
//   ], [
//     '1701 Hearst Avenue, Berkeley, CA 94703',
//     '1600 Sacramento Street, Berkeley, CA 94702',
//     '1310 McGee Avenue, Berkeley, CA 94703',
//     '2005 Berryman Street, Berkeley, CA 94709',
//   ], '2215 Rose Street, Berkeley, CA 94709'
//   , function(err, result){
//     // console.log(result);
//     get_directions(result[0].start, result[0].waypoints, result[0].end, function(err, result){
//       // console.log(result);
//     });
//   });