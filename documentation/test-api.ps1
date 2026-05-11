# Test all Audio Server API endpoints

$baseUrl = "http://localhost:3000"
$results = @()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AUDIO SERVER API ENDPOINT TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# TEST 1: GET /api/schedules
Write-Host "TEST 1: GET /api/schedules" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method GET -Uri "$baseUrl/api/schedules"
  Write-Host "✓ PASS - Retrieved $($result.count) schedules" -ForegroundColor Green
  Write-Host "  Breakdown: Bells=$($result.grouped.bells.Count), Announcements=$($result.grouped.announcements.Count), TTS=$($result.grouped.ttsAnnouncements.Count)" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 2: GET /api/schedules/:id
Write-Host "`nTEST 2: GET /api/schedules/morning-bell" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method GET -Uri "$baseUrl/api/schedules/morning-bell"
  Write-Host "✓ PASS - Retrieved schedule: $($result.name)" -ForegroundColor Green
  Write-Host "  Type: $($result.type), Time: $($result.time), Enabled: $($result.enabled)" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 3: GET /api/schedules/files/available
Write-Host "`nTEST 3: GET /api/schedules/files/available" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method GET -Uri "$baseUrl/api/schedules/files/available"
  Write-Host "✓ PASS - Retrieved $($result.count) audio files" -ForegroundColor Green
  $result.files | ForEach-Object { Write-Host "  - $($_.name) ($($_.filename))" -ForegroundColor White }
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 4: POST /api/schedules/tts
Write-Host "`nTEST 4: POST /api/schedules/tts (Create TTS Schedule)" -ForegroundColor Yellow
try {
  $body = @{id="api-test-tts"; name="API Test TTS"; text="This is a test"; time="17:00"; days=@("Monday")} | ConvertTo-Json
  $result = Invoke-RestMethod -Method POST -Uri "$baseUrl/api/schedules/tts" -Body $body -ContentType "application/json"
  Write-Host "✓ PASS - Created TTS schedule: $($result.schedule.id)" -ForegroundColor Green
  Write-Host "  Cron: $($result.schedule.cronExpression)" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 5: POST /api/schedules/announcement
Write-Host "`nTEST 5: POST /api/schedules/announcement (Create Announcement)" -ForegroundColor Yellow
try {
  $body = @{id="api-test-announce"; name="API Test Announce"; filename="test.wav"; time="17:30"; days=@("Wednesday")} | ConvertTo-Json
  $result = Invoke-RestMethod -Method POST -Uri "$baseUrl/api/schedules/announcement" -Body $body -ContentType "application/json"
  Write-Host "✓ PASS - Created announcement: $($result.schedule.id)" -ForegroundColor Green
  Write-Host "  File: $($result.schedule.filename), Time: $($result.schedule.time)" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 6: PUT /api/schedules/:id (Update Schedule)
Write-Host "`nTEST 6: PUT /api/schedules/api-test-tts (Update Schedule)" -ForegroundColor Yellow
try {
  $body = @{time="18:00"} | ConvertTo-Json
  $result = Invoke-RestMethod -Method PUT -Uri "$baseUrl/api/schedules/api-test-tts" -Body $body -ContentType "application/json"
  Write-Host "✓ PASS - Updated schedule time to: $($result.schedule.time)" -ForegroundColor Green
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 7: POST /api/schedules/:id/toggle (Toggle Enable/Disable)
Write-Host "`nTEST 7: POST /api/schedules/api-test-announce/toggle (Toggle Schedule)" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method POST -Uri "$baseUrl/api/schedules/api-test-announce/toggle"
  Write-Host "✓ PASS - Toggled schedule, enabled: $($result.schedule.enabled)" -ForegroundColor Green
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 8: GET /emergency/status
Write-Host "`nTEST 8: GET /emergency/status" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method GET -Uri "$baseUrl/emergency/status"
  Write-Host "✓ PASS - Emergency bell status retrieved" -ForegroundColor Green
  Write-Host "  Enabled: $($result.enabled), Repeat Count: $($result.repeatCount), Duration: $($result.duration)s" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 9: PUT /emergency/enable
Write-Host "`nTEST 9: PUT /emergency/enable (Enable Emergency Bell)" -ForegroundColor Yellow
try {
  $body = @{enabled=$true} | ConvertTo-Json
  $result = Invoke-RestMethod -Method PUT -Uri "$baseUrl/emergency/enable" -Body $body -ContentType "application/json"
  Write-Host "✓ PASS - Emergency bell enabled: $($result.bell.enabled)" -ForegroundColor Green
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 10: PUT /emergency/config
Write-Host "`nTEST 10: PUT /emergency/config (Update Emergency Config)" -ForegroundColor Yellow
try {
  $body = @{repeatCount=5; repeatInterval=3} | ConvertTo-Json
  $result = Invoke-RestMethod -Method PUT -Uri "$baseUrl/emergency/config" -Body $body -ContentType "application/json"
  Write-Host "✓ PASS - Updated emergency config" -ForegroundColor Green
  Write-Host "  Repeat Count: $($result.bell.repeatCount), Interval: $($result.bell.repeatInterval)s" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 11: POST /emergency/trigger
Write-Host "`nTEST 11: POST /emergency/trigger (Trigger Emergency Bell)" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method POST -Uri "$baseUrl/emergency/trigger"
  Write-Host "✓ PASS - Emergency bell triggered" -ForegroundColor Green
  Write-Host "  Triggered at: $($result.triggeredAt), Repeats: $($result.repeatCount)" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 12: GET /announcement/list
Write-Host "`nTEST 12: GET /announcement/list" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method GET -Uri "$baseUrl/announcement/list"
  Write-Host "✓ PASS - Retrieved announcement list" -ForegroundColor Green
  Write-Host "  Files: $($result.count)" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 13: POST /announcement/play-file
Write-Host "`nTEST 13: POST /announcement/play-file (Play Audio File)" -ForegroundColor Yellow
try {
  $body = @{filename="test.wav"} | ConvertTo-Json
  $result = Invoke-RestMethod -Method POST -Uri "$baseUrl/announcement/play-file" -Body $body -ContentType "application/json"
  Write-Host "✓ PASS - Playing file: $($result.filename)" -ForegroundColor Green
  Write-Host "  URL: $($result.url)" -ForegroundColor White
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 14: POST /announcement/stop
Write-Host "`nTEST 14: POST /announcement/stop (Stop Playback)" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method POST -Uri "$baseUrl/announcement/stop"
  Write-Host "✓ PASS - Stop command sent: $($result.command)" -ForegroundColor Green
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 15: DELETE /api/schedules/:id
Write-Host "`nTEST 15: DELETE /api/schedules/api-test-tts (Delete Schedule)" -ForegroundColor Yellow
try {
  $result = Invoke-RestMethod -Method DELETE -Uri "$baseUrl/api/schedules/api-test-tts"
  Write-Host "✓ PASS - Deleted schedule: $($result.id)" -ForegroundColor Green
} catch {
  Write-Host "✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUITE COMPLETED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan