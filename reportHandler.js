let Device = require("./models/device");
let Report = require("./models/report");
const nodemailer = require("nodemailer");
const express = require("express");
var router = express.Router();
var moment = require("moment");

const myDeviceIds = ["9tXPNP4Tm3mAaUQLBpXXKo30", "4jXz54YIoviZ93GPcDfJHLq4"]

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

var totalNumberOfSessionsYesterday = 1221;
var totalNumberOfUsersYesterday = 69;
var totalNumberOfProUsersYesterday = 1;

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
          console.log(results)
           totalNumberOfSessions = results[0].total
        })
      )
      await Device.find({deviceId: { $in: myDeviceIds}}, async (err, myDevices) => {
        myDevices.forEach((item, i) => {
          totalNumberOfSessions -= item.sessionCount
        });
      })
      await Device.countDocuments({activeWithinLastWeek: true}, async (err, users) => {
        totalNumberOfUsersActiveWithinLastWeek = users
      })
      await Device.countDocuments({activeWithinLastDay: true}, async (err, users) => {
        totalNumberOfUsersActiveWithinLastDay = users
      })

      totalNumberOfUsers -= myDeviceIds.length
      totalNumberOfProUsers -= myDeviceIds.length

      const dailyReport = {
        date: date.toString(),
        totalNumberOfUsers: totalNumberOfUsers,
        numberOfNewUsersToday: (totalNumberOfUsers - totalNumberOfUsersYesterday),
        totalNumberOfSessions: (totalNumberOfSessions),
        numberOfNewSessionsToday: (totalNumberOfSessions - totalNumberOfSessionsYesterday),
        totalNumberOfProUsers: totalNumberOfProUsers,
        numberOfNewProUsersToday: (totalNumberOfProUsers - totalNumberOfProUsersYesterday),
        averageSessionsPerUser:  (totalNumberOfSessions - totalNumberOfSessionsYesterday) / totalNumberOfUsers,
        averageSessionsPerActiveUser: (totalNumberOfSessions - totalNumberOfSessionsYesterday) / totalNumberOfUsersActiveWithinLastWeek,
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
      Average sessions per active user: ${dailyReport.averageSessionsPerActiveUser}
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

checkActiveUsers()
async function checkActiveUsers(){
  await Device.find(({$or: [{}]}), async (err, users) => {
    for (var i = 0; i < users.length; i ++){
      if (users[i].lastSessionEpochTime > (Date.now() - 86400)){
        users[i].activeWithinLastDay = false
       }else{
        users[i].activeWithinLastDay = true
      }
      if (users[i].lastSessionEpochTime > (Date.now() - 604800)){
        users[i].activeWithinLastWeek = false
      }else{
        users[i].activeWithinLastWeek = true
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
        avgSessionsPerActiveUser: report.averageSessionsPerActiveUser.toFixed(2),
        avgSessions: report.averageSessionsPerUser.toFixed(2)
      }
    }
    res.send(JSON.stringify(rep))
  });

})

module.exports = {
    router: router,
    handleReports: handleReports,
};
