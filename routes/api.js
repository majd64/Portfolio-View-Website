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
  console.log("regsiter device")
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
  console.log("new alerts")
  Device.findOne({deviceId: req.params.deviceId}, (err, device) => {
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

router.get("/alerts/:deviceId", (req, res) =>{
  console.log("get alerts")
  Device.findOne({deviceId: req.params.deviceId}, (err, device) => {
    if (err || !device){
      console.log("device " + device)
      console.log(err)
      res.sendStatus(500);
      return
    }
    res.status(200).send({"alerts": device.alerts})
  });
});

router.post("/alerts/delete/:deviceId", (req, res) =>{
  console.log("delete alert")
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
  console.log("session")
  Device.findOne({deviceId: req.params.deviceId}, (err, device) => {
    if (err || !device){
      res.sendStatus(500);
      return
    }
    device.sessionCount += 1;
    try{
      device.deviceToken = req.body.deviceToken
      device.lastSession = req.body.lastSession
      device.premium = req.body.premium
      device.preferredCurrency = req.body.preferredCurrency
    }catch(err){console.log(err)}
    device.save();
    res.sendStatus(201);
  });
});

router.get("/promo", (req, res) => {
  res.status(200).send({title: "0.01 BTC Giveaway", url: ""})
})

router.get("/premiumpurchased", (req, res) => {
  console.log("remium")
  var d = new Date();
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: process.env.EMAIL,
    subject: "Portfolio View Premium Purchased!",
    text: `Date: ${d.getDate()}`
  };
  transporter.sendMail(mailOptions);
  res.sendStatus(200);//
})

module.exports = router;
