const mongoose = require('mongoose');

const email = new mongoose.Schema({
  emailAddress: String,
  id: String,
  batchId: Number,
  unsubscribed: {type: Boolean ,default: false},
  didClickDownload: {type: Boolean ,default: false},
  viewedEmailsById: [Number],

})

const Email = mongoose.model("Email", email);

module.exports = Email;
