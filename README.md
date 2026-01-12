"# EventSnap 📅

**Convert event flyers into calendar invites instantly using AI.**

EventSnap is a web application that allows users to upload or photograph event flyers, automatically extracts event details using GPT-5.2 vision, and enables one-click addition to Google Calendar.

![EventSnap](https://img.shields.io/badge/AI-GPT--5.2%20Vision-purple) ![React](https://img.shields.io/badge/Frontend-React-blue) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)

---

## ✨ Features

- **Image Upload** - Drag & drop, file picker, or camera capture
- **AI-Powered Extraction** - GPT-5.2 vision extracts event title, date, time, location, and description
- **Google Calendar Integration** - One-click \"Add to Calendar\" opens Google Calendar with pre-filled event
- **Share Events** - Copy event details + calendar link to share with friends
- **Download .ics** - Export calendar file for Apple Calendar, Outlook, etc.
- **Mobile Friendly** - Responsive dark theme UI with native share support on mobile

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (optional - for event logging)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd eventsnap
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=\"mongodb://localhost:27017\"
DB_NAME=\"eventsnap\"
CORS_ORIGINS=\"*\"
EMERGENT_LLM_KEY=your_emergent_llm_key_here
EOF
```

3. **Frontend Setup**
```bash
cd frontend
yarn install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
```

4. **Run the Application**

Backend:
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Frontend:
```bash
cd frontend
yarn start
```

5. **Open** http://localhost:3000

---

## 📁 Project Structure

```
eventsnap/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Custom styles
│   │   ├── index.css     # Global styles & theme
│   │   └── components/ui/ # Shadcn UI components
│   ├── package.json      # Node dependencies
│   └── .env             # Environment variables
└── README.md
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:8001/api
```

### Endpoints

#### `GET /api/`
Health check endpoint.

**Response:**
```json
{
  \"message\": \"EventSnap API is running\"
}
```

---

#### `POST /api/extract-event`
Extract event details from an uploaded image.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (image file - JPEG, PNG, or WebP)

**Response:**
```json
{
  \"id\": \"uuid-string\",
  \"event\": {
    \"title\": \"Tech Conference 2025\",
    \"date\": \"2025-03-15\",
    \"time\": \"09:00\",
    \"end_time\": \"17:00\",
    \"location\": \"Convention Center, 123 Main St\",
    \"description\": \"Annual tech conference with networking and talks\"
  },
  \"created_at\": \"2025-01-11T15:30:00Z\"
}
```

**Error Response:**
```json
{
  \"detail\": \"File must be an image\"
}
```

---

#### `POST /api/generate-ics`
Generate an ICS calendar file from event data.

**Request:**
```json
{
  \"title\": \"Tech Conference 2025\",
  \"date\": \"2025-03-15\",
  \"time\": \"09:00\",
  \"end_time\": \"17:00\",
  \"location\": \"Convention Center\",
  \"description\": \"Annual tech conference\"
}
```

**Response:**
- Content-Type: `text/calendar`
- Returns downloadable `.ics` file

---

## ⚙️ Environment Variables

### Backend (`/backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URL` | MongoDB connection string | Yes |
| `DB_NAME` | Database name | Yes |
| `EMERGENT_LLM_KEY` | Emergent Universal Key for GPT-5.2 | Yes |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No (default: `*`) |

### Frontend (`/frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_BACKEND_URL` | Backend API URL | Yes |

---

## 🚢 Deployment

### Emergent Platform
1. Click **Deploy** in the Emergent UI
2. Environment variables are auto-configured
3. Cost: 50 credits/month

### Render

**Backend (Web Service):**
```bash
Build Command: pip install -r requirements.txt
Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

**Frontend (Static Site):**
```bash
Build Command: yarn build
Publish Directory: build
```

### Docker

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD [\"uvicorn\", \"server:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8001\"]
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Tailwind CSS, Shadcn UI |
| Backend | FastAPI, Python 3.11 |
| AI | OpenAI GPT-5.2 Vision (via Emergent) |
| Database | MongoDB (optional) |
| Styling | Dark theme, Outfit + Manrope fonts |

---

## 📱 User Flow

```
┌─────────────────┐
│  Upload Flyer   │ ← Drag & drop, file picker, or camera
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Extracts    │ ← GPT-5.2 vision analyzes image
│  Event Details  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Review & Edit  │ ← User can modify extracted data
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ Add to│ │ Share │ ← Copy link or native share
│ GCal  │ │ Event │
└───────┘ └───────┘
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- Built with [Emergent](https://emergent.sh) AI prototyping platform
- UI components from [Shadcn/UI](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**Made with 💜 by EventSnap Team**
"
