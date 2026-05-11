const express = require("express");
const {
  listSchedules,
  getSchedule,
  addSchedule,
  editSchedule,
  removeSchedule
} = require("../controllers/scheduleController");

const router = express.Router();

router.get("/announcement/schedule", listSchedules);
router.get("/announcement/schedule/:id", getSchedule);
router.post("/announcement/schedule", addSchedule);
router.put("/announcement/schedule/:id", editSchedule);
router.delete("/announcement/schedule/:id", removeSchedule);

module.exports = router;
