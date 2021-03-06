// require("newrelic");
var express = require("express");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
require("dotenv").config();

var scheduler = require("node-schedule");

var index = require("./routes/index");
var terms = require("./routes/terms");
var privacy_policy = require("./routes/privacy-policy");

var scraper = require("./routes/scraper");
var removeOld = require("./routes/remove-old");

var app = express();

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "views")));

app.use("/", index);
app.use("/app/privacy-policy", privacy_policy);
app.use("/app/terms", terms);

var removeRule = new scheduler.RecurrenceRule();
removeRule.hour = 3;
removeRule.minute = 5;
scheduler.scheduleJob(removeRule, function() {
  console.log("Running remove-old on schedule");
  removeOld.remove();
});

var scraperRule = new scheduler.RecurrenceRule();
scraperRule.hour = 18;
scraperRule.minute = 5;
scheduler.scheduleJob(scraperRule, function() {
  console.log("Running scraper on schedule");
  scraper.request();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  console.log(err.message);
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.sendFile("views/error.html", { root: __dirname });
});

module.exports = app;
