const mongoose = require('mongoose');

const log = new mongoose.Schema({
  logNumber: Number,
  dayCount: Number,
  sessionsYesterday: Number,
  usersYesterday: Number,
  proUsersYesterday: Number,
  sessionsLastWeek: Number,
  usersLastWeek: Number,
  proUsersLastWeek: Number,
  sessionsLastMonth: Number,
  usersLastMonth: Number,
  proUsersLastMonth: Number
})

const Log = mongoose.model("Log", log);

module.exports = Log;
