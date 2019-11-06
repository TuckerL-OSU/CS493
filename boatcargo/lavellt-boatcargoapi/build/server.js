"use strict";

var express = require('express');

var app = express();
app.use('/', require('./api/index')); // Listen to the App Engine-specified port, or 8080 otherwise

var PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log("Server listening on port ".concat(PORT, "..."));
});