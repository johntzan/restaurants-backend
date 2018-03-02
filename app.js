var express = require("express");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
require("dotenv").config();

var scheduler = require("node-schedule");

var index = require("./routes/index");
var scraper = require("./routes/scraper");

var app = express();

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "views")));

app.use("/", index);

var rule = new scheduler.RecurrenceRule();
rule.hour = 17;
rule.minute = 0;
rule.dayOfWeek = new scheduler.Range(1, 5);
scheduler.scheduleJob(rule, function() {
  console.log("Running on schedule");
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
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.sendFile("views/error.html", { root: __dirname });
});

module.exports = app;
