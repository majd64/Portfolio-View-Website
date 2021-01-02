const mongoose = require('mongoose');

const feedback = new mongoose.Schema({
  range: {type: String, default: ""},
  why: {type: String, default: ""},
  favourite: {type: String, default: ""},
  leastFavourite: {type: String, default: ""},
  other: {type: String, default: ""},
  email: {type: String, default: ""}
})

const Feedback = mongoose.model("Feedback", feedback);

module.exports = Feedback;
