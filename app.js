const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
require("dotenv").config();
const mongoose = require("mongoose");
const apn = require('apn');
https = require('https');
const axios = require('axios');

mongoose.connect("mongodb+srv://admin:" + process.env.DBPASS + "@cluster0.xpbd4.mongodb.net/" + process.env.DBUSER, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

const userSchema = new mongoose.Schema({
  email: String
});

const User = mongoose.model("User", userSchema);

const device = new mongoose.Schema({
  deviceToken: String,
  alerts: [{coinID: String, price: Number, above: Boolean}]
})

const Device = mongoose.model("Device", device);


var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

let options = {
  token: {
    key: "AuthKey_4B95Q45233.p8",
    keyId: "4B95Q45233",
    teamId: "YVWM9D9TSW"
  },
  production: false
};
let apnProvider = new apn.Provider(options);

app.post("/alerts/registerdevice", (req, res) => {
  Device.findOne({deviceToken: req.body.deviceToken}, (err, device) => {
    if (err){
      res.sendStatus(500);
      return
    }
    if (device == null){
      const newDevice = new Device({
        deviceToken: req.body.deviceToken,
        alerts: []
      });
      newDevice.save();
    }
    res.sendStatus(201);
  })
})

app.post("/alerts/:devicetoken", (req, res) =>{
  Device.findOne({deviceToken: req.params.devicetoken}, (err, device) => {
    if (err || !device){
      res.sendStatus(500);
      return
    }
    device.alerts.push(
      {
        coinID: req.body.coinID,
        price: req.body.price,
        above: req.body.above
      }
    )
    device.save();
    res.sendStatus(201);
  })
})

app.get("/alerts/:devicetoken", (req, res) =>{
  console.log("FETCHED ALERTS")
  Device.findOne({deviceToken: req.params.devicetoken}, (err, device) => {
    if (err || !device){
      res.sendStatus(500);
      return
    }
    res.status(200).send(device.alerts)
  });
});

function handleAlerts(){
  getPrices((res, error) => {
    const users = Device.find({}, (err, users) => {
      for (i = 0; i < res.length; i++){
        const id = res[i].id;
        const price = res[i].price;
        const symbol = res[i].ticker;
        for (j = 0; j < users.length; j++){
          const user = users[j];
          for (k = 0; k < user.alerts.length; k++){
            const alert = user.alerts[k];
            if (alert.coinID == id){
              if (price > alert.price && alert.above){
                sendNotification(user.deviceToken, `${symbol} is above ${alert.price}`)
                user.alerts.splice(k, 1);
                user.save();
              }
              else if (price < alert.price && !alert.above){
                sendNotification(user.deviceToken, `${symbol} is below ${alert.price}`)
                user.alerts.splice(k, 1);
                user.save();
              }
            }
          }
        }
      }
    })
  })
  setTimeout(handleAlerts, 12000);
}

handleAlerts()

function getPrices(callback){
  const data = []
  axios.get('https://api.coincap.io/v2/assets?limit=110')
  .then(response => {
    for (i = 0; i < response.data.data.length; i++){
      data.push({id: response.data.data[i].id, price: response.data.data[i].priceUsd, ticker: response.data.data[i].symbol})
    }
    callback(data, null)
  })
  .catch(error => {
    callback(null, error)
  });
}

function sendNotification(deviceToken, alert){
  let notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600;
  notification.sound = "default";
  notification.alert = alert;
  notification.topic = "com.porfolioview.portfolioview";
  apnProvider.send(notification, deviceToken).then( result => {
  	console.log(result);
  });
  // apnProvider.shutdown();
}

app.get("/", (req, res) => {
  var d = new Date();
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: process.env.EMAIL,
    subject: "WEBSITE VISITOR",
    text: `Date: ${d.getDate()}`
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    }
  });
  res.render("home")
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy")
})

app.get("/coming-soon", (req, res) => {
  res.render("coming-soon")
})

app.get("/report-bug", (req, res) => {
  res.render("contact", {
    title: "Report bug",
    text: "I aplogise for any inconveniences the bug has caused for you and I promise that I'll fix it in the next update. Please provide as much detail as you can about the bug and how to reproduce it if possible."
  });
});

app.get("/suggest-feature", (req, res) => {
  res.render("contact", {
    title: "Suggest feature",
    text: "Have an idea for Portfolio View? I would love to hear it! I promise your idea will be considered and there is a very good chance it may be included in a future update."
  });
});

app.get("/support", (req, res) => {
  res.render("contact", {
    title: "Support",
    text: "I will do my best to respond as fast as possible."
  });
});

app.post("/support", (req, res) => {
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: process.env.EMAIL,
    subject: "PORTFOLIO VIEW EMAIL",
    text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("email sent");
      res.render("success", {
        message: "Your message was received!"
      });
    }
  });
});

app.post("/email", (req, res) => {
  const newUser = new User({
    email: req.body.email
  });
  newUser.save();
  res.render("success", {
    message: "We will notify you!"
  });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
