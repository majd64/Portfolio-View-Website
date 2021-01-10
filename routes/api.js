var express = require("express");
var router = express.Router();
let Device = require("../models/device");
const nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

router.post("/registerdevice", (req, res) => {
  Device.findOne({deviceId: req.body.deviceId}, (err, device) => {
    if (err){
      res.sendStatus(500);
      return
    }
    else if(device == null){
      const newDevice = new Device({
        deviceId: req.body.deviceId,
        deviceToken: req.body.deviceToken
      });
      newDevice.save();
      res.sendStatus(201);
      return
    }
    else if (device){
      device.deviceToken = req.body.deviceToken
      device.save();
      res.sendStatus(200);
      return
    }
  });
});

router.post("/alerts/:deviceId", (req, res) => {
  console.log(req.body)
  Device.findOne({deviceId: req.params.deviceId}, (err, device) => {
    if (err || !device){
      res.sendStatus(500);
      return
    }
    let ticker = ""
    if (req.body.coinTicker) {
      ticker = req.body.coinTicker
    }
    device.alerts.push(
      {
        coinID: req.body.coinID,
        currencyID: req.body.currencyID,
        price: req.body.price,
        above: req.body.above,
        ticker: ticker
      }
    )
    device.save();
    res.sendStatus(201);
  })
})

router.get("/alerts/:deviceId", (req, res) =>{
  Device.findOne({deviceId: req.params.deviceId}, (err, device) => {
    if (err || !device){
      console.log(err)
      res.sendStatus(500);
      return
    }
    console.log(device.alerts)
    res.status(200).send({"alerts": device.alerts})
  });
});

router.post("/alerts/delete/:deviceId", (req, res) => {
  Device
  .updateMany(
    {deviceId: req.params.deviceId},
     {$pull: {alerts: {_id: req.body.alert_id}}}
  )
  .then( err => {
    if (!err){
      res.sendStatus(200)
    }else{
      res.sendStatus(400)
    }
  });
})

router.post("/session/:deviceId", (req, res) => {
  Device.findOne({deviceId: req.params.deviceId}, (err, device) => {
    if (err || !device){
      res.sendStatus(500);
      return
    }
    device.sessionCount += 1;
    try{
      device.deviceToken = req.body.deviceToken
      device.premium = req.body.premium
      device.preferredCurrency = req.body.preferredCurrency
      device.lastSessionEpochTime = Date.now();
      device.activeWithinLastWeek = true
      device.activeWithinLastDay = true
    }catch(err){console.log(err)}
    device.save();
    res.sendStatus(201);
  });
});

router.get("/promo", (req, res) => {
  res.status(200).send({title: "Feedback for a chance to win $50", url: "https://www.portfolioview.ca/feedback", showDeviceId: false})
})

router.get("/premiumpurchased", (req, res) => {
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: process.env.EMAIL,
    subject: "Portfolio View Premium Purchased!",///
    text: `${new Date()}`
  };
  transporter.sendMail(mailOptions);
  res.sendStatus(200);//
})

module.exports = router;
