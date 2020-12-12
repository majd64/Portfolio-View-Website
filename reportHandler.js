let Device = require("./models/device");
let Report = require("./models/report");
const nodemailer = require("nodemailer");
const express = require("express");
var router = express.Router();

const myDeviceId = "xKg7WUdfUfxl0Jwr176ZhqD8"

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

var totalNumberOfSessionsYesterday = 0;
var totalNumberOfUsersYesterday = 0;
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

      await Device.findOne({deviceId: myDeviceId}, (err, myDevice) => {
        totalNumberOfSessions -= myDevice.sessionCount
      })
      const dailyReport = {
        date: date.toString(),
        totalNumberOfUsers: totalNumberOfUsers,
        numberOfNewUsersToday: (totalNumberOfUsers - totalNumberOfUsersYesterday),
        totalNumberOfSessions: totalNumberOfSessions,
        numberOfNewSessionsToday: (totalNumberOfSessions - totalNumberOfSessionsYesterday),
        totalNumberOfProUsers: totalNumberOfProUsers,
        numberOfNewProUsersToday: (totalNumberOfProUsers - totalNumberOfUsersYesterday)
      }
      callback(dailyReport)
    })
  }catch(err){
    console.log(err)
  }
}

async function newDay(){
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
      Todays new users: ${dailyReport.numberOfNewUsersToday}

      Total sessions: ${dailyReport.totalNumberOfSessions}
      Todays sessions: ${dailyReport.numberOfNewSessionsToday}

      Total pro users: ${dailyReport.totalNumberOfProUsers}
      Todays new pro users: ${dailyReport.numberOfNewProUsersToday}
      `
    };
    transporter.sendMail(mailOptions);
    report.reports.push(dailyReport)
    report.save();
  });
}

router.get("/", async (req, res) => {
  generateReport(report => {
    res.send(JSON.stringify(report))
  });

})

module.exports = {
    router: router,
    handleReports: handleReports,
};
