const express = require("express");

const controller = require("../controllers/bootcamps");

const router = express.Router();

router
  .route("/")
  .get(controller.getBootcamps)
  .post(controller.createBootcamp);

router
  .route("/:id")
  .get(controller.getBootcamp)
  .put(controller.updateBootcamp)
  .delete(controller.deleteBootcamp);

module.exports = router;
