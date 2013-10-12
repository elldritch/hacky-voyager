var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/facebook-carpool');

var user_schema = new mongoose.Schema({
  fbid: String,
  location: String,
  events: [{
    fbid: String,
    location: String,
    drive: Boolean
  }]
});

var User = mongoose.model('User', user_schema);

module.exports = {
  user: User
};