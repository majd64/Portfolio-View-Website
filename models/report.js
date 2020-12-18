const mongoose = require('mongoose');

const report = new mongoose.Schema({
  reportNumber: Number,
  portfolioViewVersion: Number,
  dateCreated: String,
  reports: {type: [{
    date: String,
    totalNumberOfUsers: Number,
    numberOfNewUsersToday: Number,
    totalNumberOfSessions: Number,
    numberOfNewSessionsToday: Number,
    totalNumberOfProUsers: Number,
    numberOfNewProUsersToday: Number,
    averageSessionsPerUser: Number,
    averageSessionsPerActiveUser: Number, //active within last week
    activeUsersWithinLastWeek: Number,
    activeUsersWithinLastDay: Number
  }]}
})

const Report = mongoose.model("Report", report);

module.exports = Report;
