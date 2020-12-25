const nodemailer = require("nodemailer");
let Email = require("../models/email");
require("dotenv").config();
const fs = require('fs');
const readline = require('readline');
const mongoose = require("mongoose");
const ejs = require("ejs");
const express = require("express");

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

mongoose.connect("mongodb+srv://admin:" + process.env.DBPASS + "@cluster0.xpbd4.mongodb.net/" + process.env.DBUSER, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const readInterface = readline.createInterface({
    input: fs.createReadStream('testBatch.txt'),
    output: process.stdout,
    console: false
});

readInterface.on('line', async function(address) {


  await ejs.renderFile(__dirname + "/public/email-inlined.html", { name: 'Stranger' }, function (err, data) {
if (err) {
    console.log(err);
} else {
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: address,
    subject: "*Testing*",
    html: data

  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(`error: ${error}`)
    } else {
      Email.findOne({emailAddress: address}, (err, email) => {
        email.viewedEmailsById.push(0)
        email.save()
      })
      console.log(`sent to ${address}`)
    }
  })

}
})





});//
