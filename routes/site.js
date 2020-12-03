var express = require("express");
var router = express.Router();
let Device = require("../models/user");
const nodemailer = require("nodemailer");


var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

router.get("/", (req, res) => {
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

router.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy")
})

router.get("/coming-soon", (req, res) => {
  res.render("coming-soon")
})

router.get("/report-bug", (req, res) => {
  res.render("contact", {
    title: "Report bug",
    text: "I aplogise for any inconveniences the bug has caused for you and I promise that I'll fix it in the next update. Please provide as much detail as you can about the bug and how to reproduce it if possible."
  });
});

router.get("/suggest-feature", (req, res) => {
  res.render("contact", {
    title: "Suggest feature",
    text: "Have an idea for Portfolio View? I would love to hear it! I promise your idea will be considered and there is a very good chance it may be included in a future update."
  });
});

router.get("/support", (req, res) => {
  res.render("contact", {
    title: "Support",
    text: "I will do my best to respond as fast as possible."
  });
});

router.post("/support", (req, res) => {
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

router.post("/email", (req, res) => {
  const newUser = new User({
    email: req.body.email
  });
  newUser.save();
  res.render("success", {
    message: "We will notify you!"
  });
});

//PORTFOLIO Website
router.post("/portfolio/contact", (req, res) => {
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: process.env.EMAIL,
    subject: "PERSONAL SITE CONTACT",
    text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("email sent");
      res.redirect("majdhailat.com/success")
    }
  });
});

module.exports = router;
