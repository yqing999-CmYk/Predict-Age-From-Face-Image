# AI Predict Age From Face

Upload a photo → detect all faces → predict each person's age.

## Stack

| Layer  | Tech |
|--------|------|
| Mobile | React Native (Expo) |
| Backend | FastAPI (Python) + DeepFace |
| Face detection | OpenCV (via DeepFace) |
| Age prediction | VGG-Face model (via DeepFace) |

---

## Project Structure

```
AI-Predict-Age-From-Face/
├── backend/
│   ├── main.py            # FastAPI app, /predict-age endpoint + logging
│   ├── face_age.py        # Face detection + age prediction logic
│   ├── requirements.txt
│   ├── start.ps1          # Windows launch script (handles env vars)
│   └── age_results.log    # Append-only prediction log (auto-created)
├── mobile/
│   ├── src/
│   │   ├── screens/HomeScreen.tsx   # Main UI
│   │   └── services/api.ts          # API calls to backend
│   ├── App.tsx
│   └── app.json
├── Plan/
│   └── plan.txt
└── README.md
```

---

## Setup & Run

### 1. Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
.\start.ps1
```

Backend runs at: http://localhost:5000
API docs at:     http://localhost:5000/docs

> Note: First run will download DeepFace model weights (~500 MB). This only happens once.

---

### 2. Mobile App

```bash
cd mobile
npm install

# Start Expo dev server
npx expo start
```

Then:
- **Android Emulator**: Press `a` in the terminal
- **Physical Android device**: Install [Expo Go](https://expo.dev/go) → scan the QR code

---

### IP Address Configuration

By default the app targets `http://10.0.2.2:5000` (Android emulator → localhost).

If you're testing on a **physical device**, update [mobile/src/services/api.ts](mobile/src/services/api.ts):

```typescript
// Find your PC's local IP: run `ipconfig` → look for IPv4 Address
export const API_BASE_URL = "http://192.168.x.x:5000";
```

Your phone and PC must be on the same WiFi network.

---

## API Reference

### `POST /predict-age`

Upload an image file.

**Request:** `multipart/form-data` with field `file`

**Response:**

```json
{
  "faces_found": 2,
  "ages": [28, 45],
  "message": "2 faces detected. Person 1: ~28, Person 2: ~45"
}
```

No face detected:
```json
{
  "faces_found": 0,
  "ages": [],
  "message": "No face found in the image."
}
```

---

## Improving Accuracy

To use a more accurate face detector, change `detector_backend` in [backend/face_age.py](backend/face_age.py):

| Backend | Speed | Accuracy | Extra install |
|---------|-------|----------|---------------|
| `opencv` | Fast | Good | None |
| `ssd`   | Fast | Good | None |
| `mtcnn` | Medium | Better | `pip install mtcnn` |
| `retinaface` | Slow | Best | `pip install retina-face` |

---

## Testing the API

With the backend running, you can test it directly from a terminal **without the mobile app**.

**Health check:**
```bash
curl http://localhost:5000/
```

**Predict age from a local image file:**
```bash
curl -X POST http://localhost:5000/predict-age \
     -F "file=@/path/to/photo.jpg"
```

**Example response (two faces detected):**
```json
{
  "faces_found": 2,
  "ages": [28, 45],
  "message": "2 faces detected. Person 1: ~28, Person 2: ~45"
}
```

**Interactive Swagger UI** (browser):
```
http://localhost:5000/docs
```
Use the `/predict-age` endpoint → "Try it out" → upload any image.

**Check the prediction log:**
```bash
# Windows PowerShell
Get-Content backend\age_results.log

# Mac/Linux
tail -f backend/age_results.log
```

---

## Docker Deployment

Docker packages the backend so it runs identically on any server — no Python install needed on the target machine.

### 1. Build the image

```bash
cd backend
docker build -t age-predict-api .
```

### 2. Run the container

```bash
docker run -d \
  --name age-api \
  -p 5000:5000 \
  -v $(pwd)/age_results.log:/app/age_results.log \
  age-predict-api
```

- `-p 5000:5000` — exposes the API on the host
- `-v ...age_results.log` — persists the log file outside the container so it survives restarts

### 3. Or use docker-compose (recommended)

Create `docker-compose.yml` in the project root:

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend/age_results.log:/app/age_results.log
    restart: unless-stopped
```

Then:
```bash
docker compose up -d          # start
docker compose logs -f        # watch logs
docker compose down           # stop
```

### 4. Dockerfile (already in backend/)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps for OpenCV
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py face_age.py ./

EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
```

### 5. Update mobile app for production server

Once deployed to a cloud server (e.g. AWS EC2, DigitalOcean), update `mobile/src/services/api.ts`:

```typescript
export const API_BASE_URL = "http://YOUR_SERVER_IP:5000";
// or with a domain:
export const API_BASE_URL = "https://api.yourdomain.com";
```

Then rebuild the Expo app:
```bash
cd mobile
npx expo build:android   # or use EAS Build: npx eas build -p android
```
