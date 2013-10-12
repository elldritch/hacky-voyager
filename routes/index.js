
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.dash = function(req, res){
  if(req.loggedIn){
    res.render('dash');
  }
  else{
    res.redirect('/');
  }
};