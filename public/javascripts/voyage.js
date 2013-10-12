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

  $$('.invite')[0].addEvent('click', function(e){
    e.preventDefault();
    new Request({
      url: uri.get('directory') + uri.get('file') + '/invite',
      onSuccess: function(res){
        $$('.invitations').grab(invitation(res));
      }
    }).send();
  });
})();