# Unified Schedule System - Complete Guide

## Overview

The audio announcement system now supports three types of schedules:
- **Bell Schedules**: Ring the physical bell on a schedule
- **Announcement Schedules**: Play pre-recorded audio files on a schedule
- **TTS Announcements**: Generate and play text-to-speech on a schedule

All schedules work with both the **audio node** (ESP32) and **bell node** (ESP32) via MQTT.

---

## Data Files Structure

### 1. **audioFiles.json** - Manage Audio Files
Location: `src/data/audioFiles.json`

```json
{
  "audioFiles": [
    {
      "id": "assembly",
      "filename": "assembly.wav",
      "name": "Assembly Announcement",
      "description": "Morning assembly announcement",
      "duration": 45,
      "uploadedAt": "2026-04-19T08:00:00Z",
      "type": "file"
    }
  ]
}
```

**Fields:**
- `id` - Unique identifier for the audio file
- `filename` - The actual .wav file in `/media` folder
- `name` - Display name
- `description` - What the audio is for
- `duration` - Length in seconds
- `type` - Always "file" for audio files

### 2. **schedules.json** - All Schedules
Location: `src/data/schedules.json`

Contains bell, announcement, and TTS schedules with cron expressions automatically generated from time/days.

### 3. **emergencySchedule.json** - Emergency Bell Config
Location: `src/data/emergencySchedule.json`

Configuration for the emergency bell that can be triggered manually via API.

---

## API Endpoints

### Schedule Management

#### List All Schedules
```
GET /api/schedules
```
**Response:**
```json
{
  "count": 5,
  "grouped": {
    "bells": [...],
    "announcements": [...],
    "ttsAnnouncements": [...]
  },
  "schedules": [...]
}
```

#### Get Specific Schedule
```
GET /api/schedules/:id
```

#### Create Bell Schedule
```
POST /api/schedules/bell
```
**Body:**
```json
{
  "id": "lunch-bell",
  "name": "Lunch Bell",
  "time": "12:30",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "duration": 5,
  "enabled": true
}
```

#### Create Announcement Schedule
```
POST /api/schedules/announcement
```
**Body:**
```json
{
  "id": "lunch-announcement",
  "name": "Lunch Announcement",
  "filename": "lunch.wav",
  "time": "12:35",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "enabled": true
}
```

#### Create TTS Schedule
```
POST /api/schedules/tts
```
**Body:**
```json
{
  "id": "attendance-tts",
  "name": "Attendance Time",
  "text": "Please submit attendance",
  "time": "08:30",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "enabled": true
}
```

#### Update Schedule
```
PUT /api/schedules/:id
```
**Body:** Any fields to update (e.g., `{ "enabled": false }`)

#### Delete Schedule
```
DELETE /api/schedules/:id
```

#### Toggle Schedule On/Off
```
POST /api/schedules/:id/toggle
```

#### Get Available Audio Files
```
GET /api/schedules/files/available
```
Returns list of audio files for use in announcement schedules.

---

### Emergency Bell

#### Get Emergency Bell Status
```
GET /emergency/status
```

#### Trigger Emergency Bell
```
POST /emergency/trigger
```
Immediately activates the emergency bell (repeats 3 times by default).

#### Enable/Disable Emergency Bell
```
PUT /emergency/enable
```
**Body:**
```json
{
  "enabled": true
}
```

#### Update Emergency Config
```
PUT /emergency/config
```
**Body:**
```json
{
  "repeatCount": 5,
  "repeatInterval": 2,
  "duration": 5
}
```

---

## Example Workflows

### Add Audio File Manually
Edit `src/data/audioFiles.json`:
```json
{
  "id": "sports-announcement",
  "filename": "sports.wav",
  "name": "Sports Announcement",
  "description": "Sports day announcement",
  "duration": 60,
  "uploadedAt": "2026-04-19T10:00:00Z",
  "type": "file"
}
```

### Create Daily Morning Bell + Announcement
```bash
# Bell at 8:00 AM
curl -X POST http://localhost:3000/api/schedules/bell \
  -H "Content-Type: application/json" \
  -d '{
    "id": "morning-bell",
    "name": "Morning Bell",
    "time": "08:00",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "duration": 5
  }'

# Announcement at 8:05 AM
curl -X POST http://localhost:3000/api/schedules/announcement \
  -H "Content-Type: application/json" \
  -d '{
    "id": "morning-announcement",
    "name": "Morning Announcement",
    "filename": "assembly.wav",
    "time": "08:05",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }'
```

### Create Hourly TTS Reminder
```bash
curl -X POST http://localhost:3000/api/schedules/tts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hourly-reminder",
    "name": "Hourly Reminder",
    "text": "Time for class",
    "time": "10:00",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }'
```

### Trigger Emergency Bell
```bash
curl -X POST http://localhost:3000/emergency/trigger
```

---

## Arduino Node Updates

### Bell Node (bell_node.ino)
Now handles:
- ✅ Regular bell schedules (`ON` command)
- ✅ Emergency bell (`EMERGENCY` command) - repeats 3 times
- ✅ Stop command (`OFF`)

**MQTT Topics:** `school/bell`

**Messages:**
- `ON` - Ring bell once
- `OFF` - Stop bell
- `EMERGENCY` - Ring emergency bell (repeats)

### Audio Node (audio_node.ino)
Now handles:
- ✅ Direct URL playback (`PLAY_URL|<url>`)
- ✅ Announcement schedules (`PLAY_FILE|<filename>`)
- ✅ Stop playback (`STOP`)

**MQTT Topics:** `school/audio`

**Messages:**
- `PLAY_URL|http://...` - Play audio from URL
- `PLAY_FILE|filename.wav` - Play file from media folder
- `STOP` - Stop current playback

---

## Schedule Timing

### Time Format
All times are in **24-hour HH:MM format** (e.g., `08:00`, `12:30`, `17:45`)

### Days Format
Days are case-insensitive. Use:
- `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`
- `Saturday`, `Sunday`
- Or leave empty for every day

### Cron Expression
The system automatically converts time + days to cron format:
- `time: "08:00", days: ["Monday", "Tuesday"]` → `0 8 * * 1,2`

---

## Features

| Feature | Bell Node | Audio Node | Status |
|---------|-----------|-----------|--------|
| Schedule Bells | ✅ | - | Working |
| Play Audio Files | - | ✅ | Working |
| TTS Announcements | - | ✅ | Working |
| Emergency Bell | ✅ | - | Working |
| MQTT Integration | ✅ | ✅ | Working |
| Local Data Files | ✅ | ✅ | Working |
| API Management | ✅ | ✅ | Working |

---

## Troubleshooting

### Schedule Not Running
1. Check `enabled: true` in the schedule
2. Verify time format is `HH:MM` (24-hour)
3. Check if day name is correct
4. Verify MQTT connection: `GET /health` → `mqtt: true`

### Audio Not Playing
1. Verify audio file exists in `/media` folder
2. Check filename matches in announcement schedule
3. Ensure audio node is connected to MQTT
4. Check audio node logs for connection status

### Emergency Bell Not Working
1. Verify enabled via `GET /emergency/status`
2. Check bell node MQTT connection
3. Verify bell node is receiving `EMERGENCY` message

---

## File Structure Summary

```
src/
├── data/
│   ├── audioFiles.json        # Audio file registry
│   ├── schedules.json         # All schedules (unified)
│   ├── emergencySchedule.json # Emergency bell config
│   └── bellSchedules.json     # Legacy (can deprecate)
├── services/
│   ├── scheduleService.js     # Core schedule logic
│   ├── audioFileService.js    # Audio file management
│   ├── emergencyBellService.js# Emergency bell logic
│   ├── mqttService.js         # MQTT publishing
│   └── ttsService.js          # Text-to-speech
├── controllers/
│   ├── unifiedScheduleController.js
│   └── emergencyBellController.js
└── routes/
    ├── unifiedScheduleRoutes.js
    └── emergencyBellRoutes.js
```

---

## Next Steps

1. **Upload Audio Files** - Add WAV files to `/media` folder
2. **Register Files** - Add entries to `audioFiles.json`
3. **Create Schedules** - Use API to create bell/announcement/TTS schedules
4. **Test** - Verify with `GET /api/schedules`
5. **Enable Nodes** - Ensure both Arduino nodes are connected to MQTT

---

*Last Updated: April 19, 2026*
