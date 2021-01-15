var express = require("express");
var router = express.Router();
const nodemailer = require("nodemailer");
let Email = require("../models/email");
let Feedback = require("../models/feedback");


var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILERUSER,
    pass: process.env.NODEMAILERPASS
  }
});

router.get("/", (req, res) => {
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

router.get("/feedback", (req, res) =>{
  res.render("feedback")
})

router.get("/new", (req, res) => {
  res.render("whats-new")
})

router.post("/feedback", (req, res) => {
  console.log(req.body)
  feedback = new Feedback(req.body)
  feedback.save()
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: process.env.EMAIL,
    subject: "*Portfolio View Feeback*",
    text: JSON.stringify(req.body)
  };
  transporter.sendMail(mailOptions);
  res.render("success", {
    message: "Thank you for your feedback"
  });
})

router.post("/support", (req, res) => {
  var mailOptions = {
    from: process.env.NODEMAILERUSER,
    to: process.env.EMAIL,
    subject: "*Portfolio View Support*",
    text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      res.render("success", {
        message: "An unknown error occured in the server. Please email us at support.portfolioview.ca. Sorry for the inconvenience"
      });
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

router.get("/download/:id?", (req, res) => {
  var id = req.params.id
  if (id){
    Email.findOne({id: req.params.id}, (err, email) => {
      if (!err && email){
        email.didClickDownload = true
        email.save()
      }
    })
  }
  res.redirect("https://apps.apple.com/app/portfolio-view-crypto-tracker/id1540033839#?platform=iphone")
})

router.get("/unsubscribe/:id?", (req, res) => {
  var id = req.params.id
  if (id){
    Email.findOne({id: req.params.id}, (err, email) => {
      if (!err && email){
        email.unsubscribed = true
        email.save()
      }
    })
  }
  res.redirect("/unsubscribed")
})

router.get("/unsubscribed", (req, res) => {
  res.render("success", {
    message: "You will not receieve any more emails from us!"
  });
})

router.get("/issue", (req, res) => {
  res.render("success", {
    message: "Currently one of the API's used by Portfolio View is having issues which is why the secondary currency is not working. I am working to fix this. I do apologize for the inconveinace and promise it will be fixed soon!"
  })
})

module.exports = router;
