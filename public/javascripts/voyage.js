(function(){
  var uri = new URI();
  var invitation = function(invite){
    var alert = new Element('div', {
      class: 'alert-box secondary',
      text: 'New invitation: '
    });
    var close = new Element('a', {
      class: 'close',
      href: '#',
      html: '&times;'
    });
    var link = new Element('a', {
      href: invite,
      text: invite
    });

    close.addEvent('click', function(e){
      e.preventDefault();
      alert.destroy();
    });

    alert.grab(link);
    alert.grab(close);
    return alert;
  };

  if($$('.invite')[0]){
    $$('.invite')[0].addEvent('click', function(e){
      e.preventDefault();
      new Request({
        url: uri.get('directory') + uri.get('file') + '/invite',
        onSuccess: function(res){
          $$('.invitations').grab(invitation(res));
        }
      }).send();
    });
  }

  var groups = window.routes;
  console.log(groups);

  var map = new google.maps.Map($('map-canvas'), {
    center: new google.maps.LatLng(0, 0),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoom: 8
  });

  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({
    address: groups[0].targets.end
  }, function(results, status){
    if(status == google.maps.GeocoderStatus.OK){
      map.setCenter(results[0].geometry.location);
    }
  });

  var directions = new google.maps.DirectionsService();
  groups.forEach(function(group){
    var renderer = new google.maps.DirectionsRenderer();
    renderer.setMap(map);
    console.log(group, group.targets.waypoints);
    if(group.targets.waypoints){
      var waypoints = group.targets.waypoints.map(function(element){
        return {
          location: element.name
        };
      });
      console.log(waypoints);
      directions.route({
        origin: group.targets.start.location,
        destination: group.targets.end,
        travelMode: google.maps.TravelMode.DRIVING,
        waypoints: waypoints,
        optimizeWaypoints: true
      }, function(result, status){
        if(status == google.maps.DirectionsStatus.OK){
          renderer.setDirections(result);
        }
      });
    }
    else{
      directions.route({
        origin: group.targets.start.location,
        destination: group.targets.end,
        travelMode: google.maps.TravelMode.DRIVING
      }, function(result, status){
        if(status == google.maps.DirectionsStatus.OK){
          renderer.setDirections(result);
        }
      });
    }
  });

  // $$('.directions-header').each(function(element){
  //   new Fx.Accordion([element], element.getSiblings('.directions-list'));
  // });
  new Fx.Accordion($$('.directions')[0], '.directions-header', '.directions-list', {
    display: -1,
    alwaysHide: true
  });

  var save_alert = function(message, succeeded){
    var class_name = succeeded? 'alert-box success':'alert-box alert';
    var alert = new Element('div', {
      class: class_name,
      text: message
    });
    var close = new Element('a', {
      class: 'close',
      href: '#',
      html: '&times;'
    });

    close.addEvent('click', function(e){
      e.preventDefault();
      alert.destroy();
    });

    alert.grab(close);
    return alert;
  };

  $$('.save')[0].addEvent('click', function(e){
    e.preventDefault();
    new Request({
      url: uri.get('directory') + uri.get('file') + '/save',
      data: {
        name: $$('input[name="name"]')[0].value,
        location: $$('input[name="location"]')[0].value,
        driving: $$('input[name="driving"')[0].value
      },
      onSuccess: function(res){
        $$('.save-alerts').set('html', '');
        $$('.save-alerts').grab(save_alert(res, true));
      },
      onFailure: function(res){
        $$('.save-alerts').set('html', '');
        $$('.save-alerts').grab(save_alert(res.responseText, false));
      }
    }).send();
  });
})();