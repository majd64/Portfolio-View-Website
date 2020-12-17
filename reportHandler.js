let Device = require("./models/device");
let Report = require("./models/report");
const nodemailer = require("nodemailer");
const express = require("express");
var router = express.Router();
var moment = require("moment");

const myDeviceId = "9tXPNP4Tm3mAaUQLBpXXKo30"

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

var totalNumberOfSessionsYesterday = 827;
var totalNumberOfUsersYesterday = 64;
var totalNumberOfProUsersYesterday = 0;

function createReport(){
  var newReport = new Report({
    reportNumber: 1,
    portfolioViewVersion: 2,
    dateCreated: "Dec 11, 2020",
    reports: []
  })
  newReport.save();
}

// createReport()

function handleReports() {
    (function loop() {
        var now = new Date();
        if (now.getHours() === 1 && now.getMinutes() === 0) {
            newDay();
        }
        now = new Date();                  // allow for time passing
        setTimeout(loop, 45000);
    })();
}

async function generateReport(callback){
  checkActiveUsers()
  try{
    Report.findOne({reportNumber: 1}, async (err, report) => {
      if (err || !report){
        console.log(err)
        return
      }
      var date = new Date();

      var totalNumberOfUsers = 0
      var totalNumberOfProUsers = 0
      var totalNumberOfSessions = 0
      var totalNumberOfUsersActiveWithinLastDay = 0
      var totalNumberOfUsersActiveWithinLastWeek = 0

      await Device.countDocuments({}, async (err, users) => {
          totalNumberOfUsers = users
      })
      await Device.countDocuments({premium: true}, async (err, proUsers) => {
         totalNumberOfProUsers = proUsers
      })
      await Device.aggregate(
        [
          {$match: {}},
          {$group: {_id: null, total: {$sum: "$sessionCount"}}}
        ], ((err, results) => {
           totalNumberOfSessions = results[0].total
        })
      )

      await Device.findOne({deviceId: myDeviceId}, async (err, myDevice) => {
          totalNumberOfSessions -= myDevice.sessionCount
      })

      await Device.countDocuments({activeWithinLastWeek: true}, async (err, users) => {
        totalNumberOfUsersActiveWithinLastWeek = users
      })

      await Device.countDocuments({activeWithinLastDay: true}, async (err, users) => {
        totalNumberOfUsersActiveWithinLastDay = users
      })

      const dailyReport = {
        date: date.toString(),
        totalNumberOfUsers: totalNumberOfUsers,
        numberOfNewUsersToday: (totalNumberOfUsers - totalNumberOfUsersYesterday),
        totalNumberOfSessions: (totalNumberOfSessions),
        numberOfNewSessionsToday: (totalNumberOfSessions - totalNumberOfSessionsYesterday),
        totalNumberOfProUsers: totalNumberOfProUsers,
        numberOfNewProUsersToday: (totalNumberOfProUsers - totalNumberOfProUsersYesterday),
        averageSessionsPerUser:  (totalNumberOfSessions - totalNumberOfSessionsYesterday) / totalNumberOfUsers,
        activeUsersWithinLastDay: totalNumberOfUsersActiveWithinLastDay,
        activeUsersWithinLastWeek: totalNumberOfUsersActiveWithinLastWeek
      }
      callback(dailyReport)
    })
  }catch(err){
    console.log(err)
  }
}

async function newDay(){
  await checkActiveUsers()
  generateReport(dailyReport => {
    totalNumberOfSessionsYesterday = dailyReport.totalNumberOfSessions
    totalNumberOfUsersYesterday = dailyReport.totalNumberOfUsers
    totalNumberOfProUsersYesterday = dailyReport.totalNumberOfProUsers
    var mailOptions = {
      from: process.env.NODEMAILERUSER,
      to: process.env.EMAIL,
      subject: `Portfolio View Daily Report Ready ${dailyReport.date}`,
      text: `
      Total users: ${dailyReport.totalNumberOfUsers}
      New users: ${dailyReport.numberOfNewUsersToday}

      Total sessions: ${dailyReport.totalNumberOfSessions}
      New sessions: ${dailyReport.numberOfNewSessionsToday}
      Average sessions per user: ${dailyReport.averageSessionsPerUser}

      Total pro users: ${dailyReport.totalNumberOfProUsers}
      Todays new pro users: ${dailyReport.numberOfNewProUsersToday}

      Active users within last week: ${dailyReport.activeUsersWithinLastWeek}
      Active users within last day: ${dailyReport.activeUsersWithinLastDay}
      `
    };
    transporter.sendMail(mailOptions);
    report.reports.push(dailyReport)
    report.save();
  });
}

async function checkActiveUsers(){
  await Device.find(({$or: [{activeWithinLastWeek: true, activeWithinLastDay: true}]}), async (err, users) => {
    for (var i = 0; i < users.length; i ++){
      if (users[i].lastSessionEpochTime < (Date.now() - 8600)){
        users[i].activeWithinLastDay = false
      }
      if (users[i].lastSession < (Date.now() - 60200)){
        users[i].activeWithinLastWeek = false
      }
      users[i].save();
    }
  })
}

router.get("/", async (req, res) => {
  generateReport(report => {
    let rep = {
      users: {
        totalUsers: report.totalNumberOfUsers,
        newUsers: report.numberOfNewUsersToday,
      },
      proUsers: {
        totalProUsers: report.totalNumberOfProUsers,
        newProUsers: report.numberOfNewProUsersToday
      },
      activeUsers: {
        weekly: report.activeUsersWithinLastWeek,
        daily: report.activeUsersWithinLastDay
      },
      sessions: {
        totalSessions: report.totalNumberOfSessions,
        newSessions: report.numberOfNewSessionsToday,
        avgSessions: report.averageSessionsPerUser
      }
    }
    res.send(JSON.stringify(rep))
  });

})

module.exports = {
    router: router,
    handleReports: handleReports,
};
