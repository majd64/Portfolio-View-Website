const mongoose = require('mongoose');

const device = new mongoose.Schema({
  deviceId: String,
  deviceToken: {type: String, default: ""},
  alerts: {type: [{coinID: String, price: Number, above: Boolean}], default: []},
  sessionCount: {type: Number, default: 0},
  lastSession: {type: String, default: ""},
  premium: {type: Boolean, default: false},
  preferredCurrency: {type: String, default: ""}
})

const Device = mongoose.model("Device", device);

module.exports = Device;
