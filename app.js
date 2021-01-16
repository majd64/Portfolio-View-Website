const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
require("dotenv").config();
const mongoose = require("mongoose");
var apiRoute = require("./routes/api");
var siteRoute = require("./routes/site");
var alerts = require("./alerts");

var reportHandler = require("./reportHandler")

mongoose.connect("mongodb+srv://admin:" + process.env.DBPASS + "@cluster0.xpbd4.mongodb.net/" + process.env.DBUSER, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

reportHandler.handleReports();

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

app.use("", siteRoute);
app.use("/api", apiRoute);
app.use("/report", reportHandler.router)

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
