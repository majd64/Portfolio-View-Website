let Email = require("../models/email");
const { v1: uuidv1 } = require('uuid');
const fs = require('fs');
const readline = require('readline');
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:" + process.env.DBPASS + "@cluster0.xpbd4.mongodb.net/" + process.env.DBUSER, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// const readInterface = readline.createInterface({
//     input: fs.createReadStream('emailBatches/batch1.txt'),
//     output: process.stdout,
//     console: false
// });
//
// readInterface.on('line', function(address) {
//   const id = uuidv1();
//   const email = new Email({
//     emailAddress: address,
//     id: id,
//     batchId: 1
//   })
//   email.save();
// });//
