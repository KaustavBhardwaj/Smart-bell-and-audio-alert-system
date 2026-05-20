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
const { getAudioFileByFilename } = require("./services/audioFileService");
const { ensureMediaFileAvailable, getMediaPath } = require("./services/audioService");

const app = express();


fs.mkdirSync(MEDIA_PATH, { recursive: true });
fs.mkdirSync(UPLOADS_PATH, { recursive: true });


app.get("/media/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const localPath = path.join(MEDIA_PATH, filename);

    let buffer;

    if (fs.existsSync(localPath)) {
      buffer = fs.readFileSync(localPath);
    } else {
      const file = await getAudioFileByFilename(filename);

      if (!file || !file.cloudUrl) {
        return res.status(404).json({ error: "media file not found" });
      }

      const cloudResponse = await fetch(file.cloudUrl);

      if (!cloudResponse.ok) {
        return res.status(502).json({ error: "failed to fetch cloud audio" });
      }

      buffer = Buffer.from(await cloudResponse.arrayBuffer());
    }

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Accept-Ranges", "none");
    res.setHeader("Cache-Control", "no-transform");

    return res.end(buffer);
  } catch (err) {
    return res.status(500).json({
      error: "media failed",
      details: err.message,
    });
  }
});
app.use("/ui", express.static(path.join(__dirname, "../ui")));


app.use(express.json());
// app.use(apiKeyAuth);
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