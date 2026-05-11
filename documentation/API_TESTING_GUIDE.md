# API Testing Guide - Complete Walkthrough

**Goal:** Verify all 8 endpoints work correctly before adding new features  
**Time:** ~15-20 minutes  
**Requirements:** curl, audio file, running server

---

## 🚀 STEP 1: Start the Server

Open PowerShell Terminal 1:

```powershell
cd D:\DOWLOAD\study\4th SEM\IOT\Project-cp\Project\audio_server
npm start
```

**Expected Output:**
```
Announcement server running on http://0.0.0.0:3000
Use on network: http://10.91.181.13:3000
```

✅ **Server is running at:** `http://10.91.181.13:3000`

---

## 🧪 STEP 2: Test Each Endpoint

Open PowerShell Terminal 2 for testing.

### **Test 1: GET / (Root - Basic Message)**

```powershell
curl http://10.91.181.13:3000/
```

**Expected Response:**
```
Announcement server is running
```

**Status:** ✅ Should return text message

---

### **Test 2: GET /health (Server Health Check)**

```powershell
curl http://10.91.181.13:3000/health
```

**Expected Response:**
```json
{
  "ok": true,
  "server": "http://10.91.181.13:3000",
  "mqtt": true
}
```

**Status:** ✅ Should show mqtt: true (connected) or false (disconnected)  
**Note:** If mqtt is false, the server is still running but MQTT not connected - that's OK for testing

---

### **Test 3: GET /announcement/list (List Available Files)**

```powershell
curl http://10.91.181.13:3000/announcement/list
```

**Expected Response:**
```json
{
  "count": 0,
  "files": []
}
```

**Status:** ✅ Should return empty list initially (no files uploaded yet)

---

### **Test 4: POST /announcement/test (Play Test Sound)**

```powershell
curl -X POST http://10.91.181.13:3000/announcement/test
```

**Expected Response:**
```json
{
  "sent": true,
  "type": "test",
  "url": "http://10.91.181.13:3000/media/test.wav"
}
```

**⚠️ IMPORTANT:** This test will FAIL if `/media/test.wav` doesn't exist

**Status:** 🔴 Will likely fail (test.wav not present)

**Solution:** Create test.wav first (see section below)

---

### **Test 5: POST /announcement/upload (Upload File)**

First, you need an audio file. Let's check what you have:

```powershell
# Check if test audio exists
ls D:\DOWLOAD\study\4th SEM\IOT\Project-cp\Project\audio_server\
```

**If you have an audio file** (MP3, WAV, M4A):

```powershell
# Example: upload named "bell.mp3"
curl -X POST -F "audio=@C:\path\to\your\audio.mp3" `
  http://10.91.181.13:3000/announcement/upload
```

**Expected Response (if upload succeeds):**
```json
{
  "converted": true,
  "filename": "bell_1681234567.wav",
  "url": "http://10.91.181.13:3000/media/bell_1681234567.wav",
  "format": "wav",
  "channels": 1,
  "sampleRate": 16000,
  "bitDepth": 16
}
```

**Status:** ⚠️ Requires audio file and FFmpeg installed

---

### **Test 6: POST /announcement/upload-and-play (Upload & Play)**

Same as Test 5 but plays immediately:

```powershell
curl -X POST -F "audio=@C:\path\to\your\audio.mp3" `
  http://10.91.181.13:3000/announcement/upload-and-play
```

**Expected Response:**
```json
{
  "converted": true,
  "played": true,
  "filename": "bell_1681234567.wav",
  "url": "http://10.91.181.13:3000/media/bell_1681234567.wav"
}
```

**Status:** ⚠️ Requires audio file, FFmpeg, and MQTT connection

---

### **Test 7: POST /announcement/play-file (Play Existing File)**

First, ensure a file exists in /media directory:

```powershell
curl -X POST http://10.91.181.13:3000/announcement/play-file `
  -H "Content-Type: application/json" `
  -d '{"filename": "test.wav"}'
```

**Expected Response:**
```json
{
  "sent": true,
  "filename": "test.wav",
  "url": "http://10.91.181.13:3000/media/test.wav"
}
```

**Status:** ⚠️ Requires file to exist in /media

---

### **Test 8: POST /announcement/stop (Stop Playback)**

```powershell
curl -X POST http://10.91.181.13:3000/announcement/stop
```

**Expected Response:**
```json
{
  "sent": true,
  "command": "STOP"
}
```

**Status:** ✅ This should always work (no prerequisites)

---

## 🔧 SETUP: Create test.wav File

The easiest way to create a test WAV file is using FFmpeg.

### **Check if FFmpeg is installed:**

```powershell
ffmpeg -version
```

If installed, you'll see version info. If not:

```powershell
# Install FFmpeg (if using chocolatey)
choco install ffmpeg
```

### **Create a simple test.wav file:**

**Option 1: Using FFmpeg (if installed)**

```powershell
# Create 5-second silence test file
ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 5 -q:a 9 -acodec libmp3lame `
  D:\DOWLOAD\study\4th SEM\IOT\Project-cp\Project\audio_server\media\test.wav
```

**Option 2: Download a sample WAV file**

```powershell
# Create media folder if it doesn't exist
mkdir -Force D:\DOWLOAD\study\4th SEM\IOT\Project-cp\Project\audio_server\media

# Download a simple WAV file from internet
# Or copy from your existing audio files
```

**Option 3: Simplest - Create from any audio file you have**

If you have any MP3 or WAV file:

```powershell
ffmpeg -i your_audio_file.mp3 -ac 1 -ar 16000 -acodec pcm_s16le `
  D:\DOWLOAD\study\4th SEM\IOT\Project-cp\Project\audio_server\media\test.wav
```

---

## 📋 TESTING CHECKLIST

Run these tests in order:

- [ ] **Test 1: GET /** 
  - Expected: Text "Announcement server is running"
  - Status: ✅ PASS or ❌ FAIL

- [ ] **Test 2: GET /health**
  - Expected: JSON with ok=true, mqtt status
  - Status: ✅ PASS or ❌ FAIL

- [ ] **Test 3: GET /announcement/list**
  - Expected: JSON with count and files array
  - Status: ✅ PASS or ❌ FAIL

- [ ] **Test 4: POST /announcement/test**
  - Expected: JSON with sent=true
  - Status: ✅ PASS or ⚠️ FAIL (needs test.wav)
  - Fix: Create test.wav file

- [ ] **Test 5: POST /announcement/upload**
  - Expected: JSON with converted=true, filename
  - Status: ⚠️ NEEDS AUDIO FILE
  - Fix: Create or use sample audio

- [ ] **Test 6: POST /announcement/upload-and-play**
  - Expected: JSON with played=true
  - Status: ⚠️ NEEDS AUDIO FILE + MQTT
  - Fix: Create audio file and ensure MQTT connected

- [ ] **Test 7: POST /announcement/play-file**
  - Expected: JSON with sent=true
  - Status: ⚠️ NEEDS FILE IN /MEDIA
  - Fix: Upload a file first using Test 5

- [ ] **Test 8: POST /announcement/stop**
  - Expected: JSON with sent=true, command=STOP
  - Status: ✅ PASS (no prerequisites)

---

## 🎯 RECOMMENDED TEST FLOW

```
1. START SERVER (npm start)
2. Test GET / (should work immediately)
3. Test GET /health (shows MQTT status)
4. Test GET /announcement/list (should be empty)
5. Test POST /announcement/stop (should work)
   └─► These 4 require NOTHING extra ✅
   
6. CREATE test.wav file (or use sample audio)
7. Test POST /announcement/test
   └─► Requires test.wav to exist
   
8. CREATE sample audio file (MP3/M4A)
9. Test POST /announcement/upload
   └─► Requires audio file + FFmpeg
   
10. Test GET /announcement/list
    └─► Should show uploaded files
    
11. Test POST /announcement/play-file
    └─► Requires file from step 9
    
12. Test POST /announcement/upload-and-play
    └─► Requires audio file + FFmpeg + MQTT
    
13. Test POST /announcement/stop
    └─► Should stop playback
```

---

## 🐛 TROUBLESHOOTING

### **Issue: Server doesn't start**
```
Error: Port 3000 already in use
```
**Fix:** Kill the process using port 3000
```powershell
Get-Process | Where-Object {$_.Handles -eq 3000}
# Or just restart terminal
```

---

### **Issue: FFmpeg not found**
```
Error: Cannot find ffmpeg executable
```
**Fix:** Install FFmpeg
```powershell
choco install ffmpeg
# Or download from https://ffmpeg.org/download.html
```

---

### **Issue: MQTT shows false in /health**
```json
{"ok": true, "mqtt": false}
```
**Fix:** This is normal - MQTT broker might be briefly unavailable  
- The APIs that don't need MQTT (upload, list, stop) will still work
- MQTT will reconnect automatically

---

### **Issue: Upload fails with "conversion failed"**
```
{"error": "conversion failed"}
```
**Fix:** Usually FFmpeg issue
```powershell
# Check FFmpeg works
ffmpeg -version

# Test conversion manually
ffmpeg -i input.mp3 -ac 1 -ar 16000 -acodec pcm_s16le output.wav
```

---

### **Issue: File upload returns 400 "audio file is required"**
```powershell
# Make sure you're using -F flag (multipart form)
curl -X POST -F "audio=@file.mp3" http://10.91.181.13:3000/announcement/upload
#                ^^^ Key: -F flag
```

---

## 📊 EXPECTED TEST RESULTS

After all tests pass:

| Endpoint | Status | Response |
|----------|--------|----------|
| GET / | ✅ | Text message |
| GET /health | ✅ | JSON health data |
| GET /announcement/list | ✅ | JSON file list |
| POST /announcement/test | ✅ | JSON success |
| POST /announcement/upload | ✅ | JSON with filename |
| POST /announcement/upload-and-play | ✅ | JSON with played=true |
| POST /announcement/play-file | ✅ | JSON with url |
| POST /announcement/stop | ✅ | JSON with STOP command |

---

## 🎬 REAL-WORLD TEST SCENARIO

Once you get test.wav working, try this sequence:

```powershell
# 1. Check if server is up
curl http://10.91.181.13:3000/health

# 2. List current files
curl http://10.91.181.13:3000/announcement/list

# 3. Play test sound (on ESP32, you should hear it)
curl -X POST http://10.91.181.13:3000/announcement/test

# 4. Wait 5 seconds, then stop
curl -X POST http://10.91.181.13:3000/announcement/stop

# 5. Upload custom audio
curl -X POST -F "audio=@C:\my_audio.mp3" `
  http://10.91.181.13:3000/announcement/upload

# 6. List files again (should see your file)
curl http://10.91.181.13:3000/announcement/list

# 7. Play the uploaded file
curl -X POST http://10.91.181.13:3000/announcement/play-file `
  -H "Content-Type: application/json" `
  -d '{"filename": "my_audio_1681234567.wav"}'

# Done!
```

---

## ✅ SUCCESS CRITERIA

You'll know everything works when:

- ✅ GET / returns text
- ✅ GET /health shows server status
- ✅ GET /announcement/list shows files
- ✅ POST /announcement/test plays sound on ESP32
- ✅ POST /announcement/upload converts and saves file
- ✅ POST /announcement/upload-and-play uploads, converts, AND plays
- ✅ POST /announcement/play-file plays existing file
- ✅ POST /announcement/stop stops playback

---

## 🚀 NEXT STEPS (After All Tests Pass)

Once all APIs are verified working:

1. ✅ Phase 1: Add error handling + logging (2-3 hours)
   - Error handler middleware
   - Request logging
   - MQTT reconnection
   
2. ✅ Phase 2: Add TTS + Scheduling (8-12 hours)
   - POST /announcement/tts endpoint
   - POST /announcement/schedule endpoint
   - Scheduler logic

---

**Ready to test? Start with the checklist above!** 🧪

Let me know which tests pass/fail and we'll troubleshoot or proceed to Phase 1. 👍
