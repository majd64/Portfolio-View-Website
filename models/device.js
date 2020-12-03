const mongoose = require('mongoose');

const device = new mongoose.Schema({
  deviceToken: String,
  alerts: [{coinID: String, price: Number, above: Boolean}]
})

const Device = mongoose.model("Device", device);

module.exports = Device;
