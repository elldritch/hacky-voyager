var mongooose = require('mongoose');

var user_schema = new mongoose.Schema({
  fbid: String,
  location: String,
  events: [{
    fbid: String,
    location: String,
    drive: Boolean
  }]
});