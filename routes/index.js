const express = require("express");
const router = express.Router();

require('./video')(router);

module.exports = router;