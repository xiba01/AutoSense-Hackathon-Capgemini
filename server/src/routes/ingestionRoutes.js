const express = require("express");
const router = express.Router();
const { generateContext } = require("../controllers/ingestionController");

router.post("/context", generateContext);

module.exports = router;
