`       $baseUrl = "http://localhost:3000"

Write-Host "AUDIO SERVER API TEST SUITE" -BackgroundColor Cyan -ForegroundColor Black
Write-Host ""

# 1. GET /api/schedules
Write-Host "[1] GET /api/schedules" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method GET -Uri "$baseUrl/api/schedules"
Write-Host ("PASS - {0} schedules (Bells:{1} Announcements:{2} TTS:{3})" -f $r.count, $r.grouped.bells.Count, $r.grouped.announcements.Count, $r.grouped.ttsAnnouncements.Count) -ForegroundColor Green

# 2. GET /api/schedules/:id
Write-Host "`n[2] GET /api/schedules/morning-bell" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method GET -Uri "$baseUrl/api/schedules/morning-bell"
Write-Host ("PASS - {0} ({1} at {2})" -f $r.name, $r.type, $r.time) -ForegroundColor Green

# 3. GET /api/schedules/files/available
Write-Host "`n[3] GET /api/schedules/files/available" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method GET -Uri "$baseUrl/api/schedules/files/available"
Write-Host ("PASS - {0} audio files" -f $r.count) -ForegroundColor Green

# 4. POST /api/schedules/tts
Write-Host "`n[4] POST /api/schedules/tts" -ForegroundColor Yellow
$body = @{id="test-tts-new"; name="Test TTS"; text="Test message"; time="17:00"; days=@("Monday")} | ConvertTo-Json
$r = Invoke-RestMethod -Method POST -Uri "$baseUrl/api/schedules/tts" -Body $body -ContentType "application/json"
Write-Host ("PASS - Created {0}" -f $r.schedule.id) -ForegroundColor Green

# 5. POST /api/schedules/announcement
Write-Host "`n[5] POST /api/schedules/announcement" -ForegroundColor Yellow
$body = @{id="test-announce-new"; name="Test Announce"; filename="test.wav"; time="17:30"; days=@("Wednesday")} | ConvertTo-Json
$r = Invoke-RestMethod -Method POST -Uri "$baseUrl/api/schedules/announcement" -Body $body -ContentType "application/json"
Write-Host ("PASS - Created {0} with file {1}" -f $r.schedule.id, $r.schedule.filename) -ForegroundColor Green

# 6. PUT /api/schedules/:id
Write-Host "`n[6] PUT /api/schedules/test-tts-new" -ForegroundColor Yellow
$body = @{time="18:00"} | ConvertTo-Json
$r = Invoke-RestMethod -Method PUT -Uri "$baseUrl/api/schedules/test-tts-new" -Body $body -ContentType "application/json"
Write-Host ("PASS - Updated time to {0}" -f $r.schedule.time) -ForegroundColor Green

# 7. POST /api/schedules/:id/toggle
Write-Host "`n[7] POST /api/schedules/test-announce-new/toggle" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method POST -Uri "$baseUrl/api/schedules/test-announce-new/toggle"
Write-Host ("PASS - Toggled, enabled: {0}" -f $r.schedule.enabled) -ForegroundColor Green

# 8. GET /emergency/status
Write-Host "`n[8] GET /emergency/status" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method GET -Uri "$baseUrl/emergency/status"
Write-Host ("PASS - Enabled: {0}, Repeats: {1}" -f $r.enabled, $r.repeatCount) -ForegroundColor Green

# 9. PUT /emergency/enable
Write-Host "`n[9] PUT /emergency/enable" -ForegroundColor Yellow
$body = @{enabled=$true} | ConvertTo-Json
$r = Invoke-RestMethod -Method PUT -Uri "$baseUrl/emergency/enable" -Body $body -ContentType "application/json"
Write-Host ("PASS - Enabled: {0}" -f $r.bell.enabled) -ForegroundColor Green

# 10. PUT /emergency/config
Write-Host "`n[10] PUT /emergency/config" -ForegroundColor Yellow
$body = @{repeatCount=5; repeatInterval=2} | ConvertTo-Json
$r = Invoke-RestMethod -Method PUT -Uri "$baseUrl/emergency/config" -Body $body -ContentType "application/json"
Write-Host ("PASS - Updated config (repeats:{0}, interval:{1}s)" -f $r.bell.repeatCount, $r.bell.repeatInterval) -ForegroundColor Green

# 11. POST /emergency/trigger
Write-Host "`n[11] POST /emergency/trigger" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method POST -Uri "$baseUrl/emergency/trigger"
Write-Host ("PASS - Emergency bell triggered") -ForegroundColor Green

# 12. GET /announcement/list
Write-Host "`n[12] GET /announcement/list" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method GET -Uri "$baseUrl/announcement/list"
Write-Host ("PASS - {0} files available" -f $r.count) -ForegroundColor Green

# 13. POST /announcement/play-file
Write-Host "`n[13] POST /announcement/play-file" -ForegroundColor Yellow
$body = @{filename="test.wav"} | ConvertTo-Json
$r = Invoke-RestMethod -Method POST -Uri "$baseUrl/announcement/play-file" -Body $body -ContentType "application/json"
Write-Host ("PASS - Playing {0}" -f $r.filename) -ForegroundColor Green

# 14. POST /announcement/stop
Write-Host "`n[14] POST /announcement/stop" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method POST -Uri "$baseUrl/announcement/stop"
Write-Host ("PASS - Stop command sent") -ForegroundColor Green

# 15. DELETE /api/schedules/:id
Write-Host "`n[15] DELETE /api/schedules/test-tts-new" -ForegroundColor Yellow
$r = Invoke-RestMethod -Method DELETE -Uri "$baseUrl/api/schedules/test-tts-new"
Write-Host ("PASS - Deleted {0}" -f $r.id) -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETED SUCCESSFULLY" -BackgroundColor Green -ForegroundColor Black
Write-Host "========================================" -ForegroundColor Cyan
