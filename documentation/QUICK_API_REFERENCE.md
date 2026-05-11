# Quick API Reference

## Base URL
```
http://10.91.181.13:3000
```

---

## Schedules

### Bell Schedules
```bash
# Create
POST /api/schedules/bell
{
  "id": "lunch-bell",
  "name": "Lunch Bell",
  "time": "12:30",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "duration": 5
}

# List all
GET /api/schedules

# Get one
GET /api/schedules/lunch-bell

# Update
PUT /api/schedules/lunch-bell
{ "time": "13:00" }

# Delete
DELETE /api/schedules/lunch-bell

# Toggle
POST /api/schedules/lunch-bell/toggle
```

### Announcement Schedules
```bash
# Create
POST /api/schedules/announcement
{
  "id": "lunch-audio",
  "name": "Lunch Announcement",
  "filename": "lunch.wav",
  "time": "12:35",
  "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]
}

# Get available files
GET /api/schedules/files/available
```

### TTS Schedules
```bash
# Create
POST /api/schedules/tts
{
  "id": "reminder-1",
  "name": "Class Reminder",
  "text": "Time for next class",
  "time": "10:00",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}
```

---

## Emergency Bell

```bash
# Get status
GET /emergency/status

# Trigger
POST /emergency/trigger

# Enable/Disable
PUT /emergency/enable
{ "enabled": true }

# Update config
PUT /emergency/config
{
  "repeatCount": 3,
  "repeatInterval": 2,
  "duration": 5
}
```

---

## Health & Status

```bash
# Server health
GET /health

# List all announcements
GET /announcement/list

# Test audio
POST /announcement/test
```

---

## Quick Examples

### Morning Routine (Bell + Audio)
```bash
# 08:00 - Bell
POST /api/schedules/bell
{"id":"m1","name":"Morning","time":"08:00","days":["Mon","Tue","Wed","Thu","Fri"]}

# 08:05 - Audio
POST /api/schedules/announcement
{"id":"m2","name":"Assembly","filename":"assembly.wav","time":"08:05","days":["Mon","Tue","Wed","Thu","Fri"]}

# 08:10 - TTS
POST /api/schedules/tts
{"id":"m3","name":"Attendance","text":"Take attendance","time":"08:10","days":["Mon","Tue","Wed","Thu","Fri"]}
```

### Emergency Test
```bash
# Trigger immediately
curl -X POST http://10.91.181.13:3000/emergency/trigger
```

---

## Curl Format

Standard header required:
```bash
-H "Content-Type: application/json"
```

Example:
```bash
curl -X POST http://10.91.181.13:3000/api/schedules/bell \
  -H "Content-Type: application/json" \
  -d '{"id":"bell1","name":"Bell","time":"12:00","days":["Monday"]}'
```

---

## Response Format

### Success
```json
{
  "message": "...",
  "schedule": {...}
}
```

### Error
```json
{
  "error": "Description of error"
}
```

---

## Data Files Location

- Audio files: `media/`
- Audio registry: `src/data/audioFiles.json`
- All schedules: `src/data/schedules.json`
- Emergency config: `src/data/emergencySchedule.json`

---

## MQTT Topics

- **Bell Node**: `school/bell`
  - Messages: `ON`, `OFF`, `EMERGENCY`

- **Audio Node**: `school/audio`
  - Messages: `PLAY_URL|<url>`, `PLAY_FILE|<filename>`, `STOP`

---

*Use SCHEDULE_SYSTEM_GUIDE.md for detailed documentation*
