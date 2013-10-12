var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/facebook-carpool');

// Event schema.
var event_schema = new mongoose.Schema({
  name: String,
  destination: String,
  token: String,
  users: [{
    token: String,
    owner: {
      type: Boolean,
      default: false
    },
    name: String,
    location: String,
    driving: Boolean
  }]
});

module.exports = mongoose.model('Event', event_schema);