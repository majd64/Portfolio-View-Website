const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

app.get("/", (req, res) => {
  res.render("home")
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy")
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
    }else{
      console.log("email sent");
      res.redirect("/");
    }
  });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
