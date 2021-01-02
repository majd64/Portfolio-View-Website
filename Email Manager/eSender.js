let Email = require("../models/email");
require("dotenv").config();
const fs = require('fs');
const readline = require('readline');
const mongoose = require("mongoose");
const ejs = require("ejs");
const express = require("express");
const mailgun = require("mailgun-js");

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

const mg = mailgun({apiKey: "242bc54871b99b03595b5267d5c603bc-b6190e87-8e96428f", domain: 'mg.portfolioview.ca'});

mongoose.connect("mongodb+srv://admin:" + process.env.DBPASS + "@cluster0.xpbd4.mongodb.net/" + process.env.DBUSER, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const readInterface = readline.createInterface({
    input: fs.createReadStream('./emailBatches/batch4.txt'),
    output: process.stdout,
    console: false
});


sendEmails()
async function sendEmails(){
  readInterface.on('line', async function(address) {
    Email.findOne({emailAddress: address}, async (err, email) => {
      if (err){
        console.log(`Error finding user: ${err}`)
      }else{
        email.viewedEmailsById.push(1)
        email.save()
        await ejs.renderFile(__dirname + "/public/email1.ejs", { cta: `https://www.portfolioview.ca/download/${email.id}`, unsub: `https://portfolioview.ca/unsubscribe/${email.id}`}, async function (err, htmlfile) {
          if (err) {
              console.log(err);
          } else {
            const data = {
            	from: 'Portfolio View <mg@mg.portfolioview.ca>',
            	to: address,
            	subject: 'Portfolio View - Simple, Elegeant yet Powerful',
              html: htmlfile
            };
            mg.messages().send(data, function (error, body) {
              if (error){
                console.log(`Error: ${error}`)
              }
            	console.log(body);
              console.log(address);
            });
          }
        })
      }
    })
  });
}
//
// sendTestEmails()
// async function sendTestEmails(){
//   readInterface.on('line', async function(address) {
//       await ejs.renderFile(__dirname + "/public/email0.ejs", { cta: `https://www.portfolioview.ca/download/`, unsub: `https://portfolioview.ca/unsubscribe/`}, async function (err, htmlfile) {
//         if (err) {
//             console.log(err);
//         } else {
//           const data = {
//           	from: 'Portfolio View <mg@mg.portfolioview.ca>',
//           	to: address,
//           	subject: 'Portfolio View - Simple, Elegeant yet Powerful',
//             html: htmlfile
//           };
//           mg.messages().send(data, function (error, body) {
//             if (error){
//               console.log(`Error: ${error}`)
//             }
//           	console.log(body);
//           });
//         }
//       })
//   });
// }
