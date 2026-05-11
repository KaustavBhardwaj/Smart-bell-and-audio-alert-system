const express = require("express");
const path = require("path");
const fs = require("fs");
const { MEDIA_PATH, UPLOADS_PATH } = require("./config/env");

const healthRoutes = require("./routes/healthRoutes");
const playbackRoutes = require("./routes/playbackRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const ttsRoutes = require("./routes/ttsRoutes");
const bellRoutes = require("./routes/bellRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const emergencyBellRoutes = require("./routes/emergencyBellRoutes");
const unifiedScheduleRoutes = require("./routes/unifiedScheduleRoutes");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const aiAnnouncementRoutes = require("./routes/aiAnnouncementRoutes");
const apiKeyAuth = require("./middleware/apiKeyAuth");


const app = express();


fs.mkdirSync(MEDIA_PATH, { recursive: true });
fs.mkdirSync(UPLOADS_PATH, { recursive: true });

app.use("/media", express.static(MEDIA_PATH));
app.use("/ui", express.static(path.join(__dirname, "../ui")));


app.use(express.json());
app.use(apiKeyAuth);
app.use(requestLogger);
app.use(express.json());


app.use("/", aiAnnouncementRoutes);

app.use("/", healthRoutes);
app.use("/", playbackRoutes);
app.use("/", uploadRoutes);
app.use("/", ttsRoutes);
app.use("/", bellRoutes);
app.use("/", scheduleRoutes);
app.use("/", emergencyBellRoutes);
app.use("/", unifiedScheduleRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "route not found" });
});

app.use(errorHandler);

module.exports = app;