const express = require("express");
const router = express.Router();

require('./video')(router);
require('./audio')(router);

module.exports = router;