(function(){
  $$('.side-nav')[0].addEvent('click:relay(li)', function(e){
    var target = e.target;
    if(target.get('data-click') == 'event'){
      new Request({
        url: '/get-event',
        data: {
          id: target.get('data-id')
        },
        onSuccess: function(res){
          ;
        }
      }).send();
    }
  });
})();