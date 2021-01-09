const mongoose = require('mongoose');

const device = new mongoose.Schema({
  deviceId: String,
  deviceToken: {type: String, default: ""},
  alerts: {type: [{coinID: String, currencyID: String, price: Number, above: Boolean}], default: []},
  sessionCount: {type: Number, default: 0},
  premium: {type: Boolean, default: false},
  preferredCurrency: {type: String, default: ""},
  lastSessionEpochTime: {type: String, default: ""},
  activeWithinLastWeek: {type: Boolean, default: false},
  activeWithinLastDay: {type: Boolean, defauly: false}
})

const Device = mongoose.model("Device", device);

module.exports = Device;
