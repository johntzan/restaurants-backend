var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  res.sendFile("views/index.html", { root: __dirname });
});

router.get("/privacy-policy", function(req, res, next) {
  res.sendFile("views/privacy-policy.html", { root: __dirname });
});

router.get("/terms", function(req, res, next) {
  res.sendFile("views/tos.html", { root: __dirname });
});

module.exports = router;
