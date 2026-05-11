# IoT Smart Bell UI

Responsive vanilla HTML/CSS/JS dashboard for the existing `audio_server` backend.

## UI structure

```text
smart_bell_ui/
├── index.html   # Main dashboard layout
├── styles.css   # Responsive professional styling
├── app.js       # API calls and UI logic
└── README.md    # Setup notes
```

## Backend APIs used

- `GET /health`
- `POST /bell/on`
- `POST /bell/off`
- `GET /announcement/list`
- `POST /announcement/test`
- `POST /announcement/play-file`
- `POST /announcement/stop`
- `GET /audio/volume`
- `PUT /audio/volume`
- `POST /announcement/upload`
- `POST /announcement/upload-and-play`
- `GET /announcement/tts/languages`
- `POST /announcement/tts`
- `POST /announcement/tts/preview`
- `POST /announcement/ai`
- `GET /api/schedules`
- `POST /api/schedules/bell`
- `POST /api/schedules/announcement`
- `POST /api/schedules/tts`
- `POST /api/schedules/:id/toggle`
- `DELETE /api/schedules/:id`
- `GET /api/schedules/files/available`
- `GET /emergency/status`
- `POST /emergency/trigger`
- `PUT /emergency/enable`
- `PUT /emergency/config`

## How to use

1. Copy these files into your backend folder:

```text
audio_server/ui/
```

2. Start your backend:

```bash
npm start
```

3. Open:

```text
http://localhost:3000/ui
```

or:

```text
http://YOUR_LAPTOP_IP:3000/ui
```

If you open `index.html` directly from file explorer, go to **Settings** and set API URL to `http://localhost:3000` or your backend LAN IP.
