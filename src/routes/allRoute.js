const express = require("express");
const router = express.Router();

//all routes
router.use("/", require("./userRoute"));
router.use("/", require("./chatRoute"));
router.use("/", require("./messageRoute"));


module.exports = router;