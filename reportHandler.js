let Device = require("./models/device");
let Log = require("./models/report");

const nodemailer = require("nodemailer");
const express = require("express");
var router = express.Router();
var moment = require("moment");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

async function handleReports() {
  (async function loop() {
      var now = new Date();
      if (now.getHours() === 1 && now.getMinutes() === 0) {
        await checkActiveUsers()
        updateLog(false)
        sendReportByEmail()
      }
      now = new Date();                  // allow for time passing
      setTimeout(loop, 45000);
  })();
}

function createLog(){
  const log = new Log({
    logNumber: 1,
    dayCount: 0,
  });
  log.save();
}

// createLog();

function updateLog(init){
  generateReport(report => {
    Log.findOne({logNumber: 1}, (err, log) => {
      const sessions = report.totalSessions
      const users = report.totalUsers
      const proUsers = report.totalPro
      const dayCount = log.dayCount
      if (!init){
        log.dayCount += 1
      }
      log.sessionsYesterday = sessions
      log.usersYesterday = users
      log.proUsersYesterday = proUsers
      if (dayCount % 7 === 0 || init){
        log.sessionsLastWeek = sessions
        log.usersLastWeek = users
        log.proUsersLastWeek = proUsers
      }
      if (dayCount % 30 === 0 || init){
        log.sessionsLastMonth = sessions
        log.usersLastMonth = users
        log.proUsersLastMonth = proUsers
      }
      log.save();
    })
  })
}

async function generateReport(callback){
    var date = new Date();
    var users = 0
    var proUsers = 0
    var sessions = 0
    var activeDaily = 0
    var activeWeekly = 0

    var usersYesterday = 0
    var proUsersYesterday = 0
    var sessionsYesterday = 0
    var usersLastWeek = 0
    var proUsersLastWeek = 0
    var sessionsLastWeek = 0
    var usersLastMonth = 0
    var proUsersLastMonth = 0
    var sessionsLastMonth = 0

    await Device.countDocuments({}, async (err, userCount) => {
        users = userCount
    })
    await Device.countDocuments({premium: true}, async (err, users) => {
       proUsers = users
    })
    await Device.aggregate(
      [
        {$match: {}},
        {$group: {_id: null, total: {$sum: "$sessionCount"}}}
      ], ((err, results) => {
         sessions = results[0].total
      })
    )
    await Device.countDocuments({activeWithinLastWeek: true}, async (err, users) => {
      activeWeekly = users
    })
    await Device.countDocuments({activeWithinLastDay: true}, async (err, users) => {
      activeDaily = users
    })

    await Log.findOne({logNumber: 1}, async (err, log) => {
      usersYesterday = log.usersYesterday,
      proUsersYesterday = log.proUsersYesterday,
      sessionsYesterday = log.sessionsYesterday,
      usersLastWeek = log.usersLastWeek,
      proUsersLastWeek = log.proUsersLastWeek,
      sessionsLastWeek = log.sessionsLastWeek,
      usersLastMonth = log.usersLastMonth,
      proUsersLastMonth = log.proUsersLastMonth,
      sessionsLastMonth = log.sessionsLastMonth
    })

    setTimeout(() => {
      const report = {
        date: date.toString(),

        totalUsers: users,
        newDailyUsers: (users - usersYesterday),
        newWeeklyUsers: (users - usersLastWeek),
        newMonthlyUsers: (users - usersLastMonth),

        totalSessions: (sessions),
        newDailySessions: (sessions - sessionsYesterday),
        newWeeklySessions: (sessions - sessionsLastWeek),
        newMonthlySessions: (sessions - sessionsLastMonth),

        totalPro: proUsers,
        newDailyPro: (proUsers - proUsersYesterday),
        newWeeklyPro: (proUsers - proUsersLastWeek),
        newMonthlyPro: (proUsers - proUsersLastMonth),

        avgDailySessions: (sessions - sessionsYesterday) / activeWeekly,
        dailyActive: activeDaily,
        weeklyActive: activeWeekly
      }
      callback(report)
    }, 1);
}

function sendReportByEmail(){
  generateReport(dailyReport => {
    var mailOptions = {
      from: process.env.NODEMAILERUSER,
      to: process.env.EMAIL,
      subject: `Portfolio View Daily Report Ready ${dailyReport.date}`,
      text: JSON.stringify(dailyReport)
    };
    transporter.sendMail(mailOptions);
  });
}

async function checkActiveUsers(){
  await Device.find({}, async (err, users) => {
    for (var i = 0; i < users.length; i ++){
      if (users[i].lastSessionEpochTime < (Date.now() - 86400000)){
        users[i].activeWithinLastDay = false
      }else{
        users[i].activeWithinLastDay = true
      }
      if (users[i].lastSessionEpochTime < (Date.now() - 604800000)){
        users[i].activeWithinLastWeek = false
      }else{
        users[i].activeWithinLastWeek = true
      }
      users[i].save();
    }
  })
}

router.get("/", async (req, res) => {
  generateReport(r => {
    res.send(JSON.stringify(r))
  });

})

module.exports = {
    router: router,
    handleReports: handleReports,
};
