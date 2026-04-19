# 🎬 FireBot — Telegram Video Upload Bot

<div align="center">

![FireBot Banner](https://img.shields.io/badge/FireBot-Telegram%20%2B%20Firebase-orange?style=for-the-badge&logo=telegram&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Firebase](https://img.shields.io/badge/Firebase-Storage%20%2B%20Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Telegram Bot API](https://img.shields.io/badge/Telegram%20Bot%20API-v7.x-2CA5E0?style=flat-square&logo=telegram&logoColor=white)](https://core.telegram.org/bots/api)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Ayusman%20Samasi-purple?style=flat-square)](https://github.com/ayusmansamasi)

> **A powerful Telegram bot that allows authenticated users to upload videos directly to Firebase Storage — secured by Firebase Auth UID.**

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Bot Flow Diagram](#-bot-flow-diagram)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Configuration](#-configuration)
- [Firebase Rules](#-firebase-storage-rules)
- [Bot Commands](#-bot-commands)
- [API Reference](#-api-reference)
- [Upload Limits & Specs](#-upload-limits--specs)
- [Error Codes](#-error-codes)
- [Roadmap](#-roadmap)
- [Author](#-author)
- [License](#-license)

---

## 🌟 Overview

**FireBot** is a Telegram bot that bridges Telegram's file-sharing capabilities with Firebase's powerful cloud infrastructure. Users authenticate via their **Firebase Auth UID**, and all uploaded videos are stored in Firebase Storage under their unique UID path — ensuring privacy, ownership, and security.

Each video upload is:
- Tied to a verified Firebase Auth UID
- Stored at a unique path: `videos/{uid}/{timestamp}_{filename}`
- Metadata logged to Firestore for tracking
- Instantly shareable via a signed Firebase URL

---

## ✨ Features

| Feature | Description | Status |
|---|---|---|
| 🔐 Firebase Auth UID Verification | Authenticate users via UID before any upload | ✅ Live |
| 🎥 Video Upload | Upload videos directly from Telegram chat | ✅ Live |
| 🗂️ Organized Storage | Files stored under `videos/{uid}/` path | ✅ Live |
| 🔗 Signed URLs | Get a time-limited download link after upload | ✅ Live |
| 📊 Upload History | View past uploads with metadata | ✅ Live |
| 🚫 File Size Validation | Reject oversized files before upload | ✅ Live |
| 🔄 Progress Feedback | Real-time upload progress messages | ✅ Live |
| 🧹 Auto Cleanup | Temp local files removed after upload | ✅ Live |
| 📁 Multiple Formats | Supports MP4, MOV, AVI, MKV, WEBM | ✅ Live |
| 🔔 Admin Notifications | Notify admin on errors or abuse | 🔧 Beta |
| 🌐 Multi-language Support | Localized bot responses | 🗓️ Planned |
| 📦 Batch Upload | Upload multiple videos at once | 🗓️ Planned |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Telegram)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │  sends video + UID
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     TELEGRAM BOT SERVER                      │
│                   (python-telegram-bot)                      │
│                                                             │
│   Handler → UID Validator → Downloader → Uploader          │
└──────────────┬──────────────────────────────┬──────────────┘
               │ verify UID                   │ upload file
               ▼                              ▼
┌──────────────────────┐        ┌─────────────────────────────┐
│   Firebase Auth      │        │     Firebase Storage         │
│                      │        │                             │
│  UID Lookup &        │        │  videos/{uid}/{filename}    │
│  Validation          │        │                             │
└──────────────────────┘        └──────────────┬──────────────┘
                                               │ metadata
                                               ▼
                                ┌─────────────────────────────┐
                                │       Cloud Firestore        │
                                │                             │
                                │  users/{uid}/uploads/       │
                                │  { name, url, size, time }  │
                                └─────────────────────────────┘
```

---

## 🔄 Bot Flow Diagram

```
User sends /start
        │
        ▼
Bot sends Welcome + asks for Firebase UID
        │
        ▼
User sends Firebase Auth UID
        │
        ▼
   ┌────┴────┐
   │ Validate│
   │  UID    │
   └────┬────┘
        │
   ┌────▼────┐         ┌─────────────────┐
   │  Valid? ├── NO ──▶│ Send Error MSG  │
   └────┬────┘         │ Ask to retry    │
        │ YES          └─────────────────┘
        ▼
Bot confirms auth, asks user to send video
        │
        ▼
User sends video file
        │
        ▼
   ┌────┴──────────┐
   │  File Check   │
   │  (size/type)  │
   └────┬──────────┘
        │
   ┌────▼────┐         ┌─────────────────┐
   │  Valid? ├── NO ──▶│ Reject + Reason │
   └────┬────┘         └─────────────────┘
        │ YES
        ▼
Download from Telegram → Upload to Firebase Storage
        │
        ▼
   Log metadata to Firestore
        │
        ▼
Send signed download URL to user ✅
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Bot Framework | [python-telegram-bot](https://python-telegram-bot.org/) | 21.x |
| Language | Python | 3.10+ |
| Authentication | Firebase Admin SDK (Auth) | 6.x |
| File Storage | Firebase Storage | — |
| Database | Cloud Firestore | — |
| Environment Config | `python-dotenv` | 1.x |
| HTTP Client | `httpx` / `aiohttp` | — |
| Temp File Handling | `tempfile` (stdlib) | — |

---

## 📁 Project Structure

```
firebot/
│
├── bot/
│   ├── __init__.py
│   ├── main.py                  # Entry point, polling setup
│   ├── handlers/
│   │   ├── start.py             # /start command handler
│   │   ├── auth.py              # UID verification handler
│   │   ├── upload.py            # Video upload handler
│   │   └── history.py           # /history command handler
│   └── utils/
│       ├── firebase.py          # Firebase Admin SDK helpers
│       ├── validator.py         # File type & size validators
│       └── messages.py          # Bot message templates
│
├── config/
│   └── settings.py              # Config loader from .env
│
├── firebase/
│   └── serviceAccountKey.json   # 🔒 DO NOT COMMIT THIS FILE
│
├── tests/
│   ├── test_auth.py
│   ├── test_upload.py
│   └── test_validator.py
│
├── .env.example                 # Example environment variables
├── .gitignore
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.10 or higher
- A [Telegram Bot Token](https://t.me/BotFather) from BotFather
- A Firebase project with **Storage** and **Authentication** enabled
- Firebase Admin SDK service account JSON key

---

### 1. Clone the Repository

```bash
git clone https://github.com/ayusmansamasi/firebot.git
cd firebot
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Add Firebase Credentials

Download your Firebase service account key from:

> Firebase Console → Project Settings → Service Accounts → Generate new private key

Save it as:

```
firebase/serviceAccountKey.json
```

> ⚠️ **Never commit this file to version control.** It is already in `.gitignore`.

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Configuration](#-configuration)).

### 6. Run the Bot

```bash
python bot/main.py
```

---

## ⚙️ Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# ─── Telegram ───────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# ─── Firebase ───────────────────────────────────────────────
FIREBASE_CREDENTIALS_PATH=firebase/serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_PROJECT_ID=your-project-id

# ─── Upload Limits ──────────────────────────────────────────
MAX_FILE_SIZE_MB=200
ALLOWED_FORMATS=mp4,mov,avi,mkv,webm

# ─── Signed URL Expiry ──────────────────────────────────────
SIGNED_URL_EXPIRY_HOURS=48

# ─── Admin ──────────────────────────────────────────────────
ADMIN_TELEGRAM_ID=your_telegram_user_id
```

| Variable | Description | Default |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | — |
| `FIREBASE_CREDENTIALS_PATH` | Path to service account JSON | `firebase/serviceAccountKey.json` |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name | — |
| `MAX_FILE_SIZE_MB` | Max allowed video size in MB | `200` |
| `ALLOWED_FORMATS` | Comma-separated allowed extensions | `mp4,mov,avi,mkv,webm` |
| `SIGNED_URL_EXPIRY_HOURS` | Hours before download URL expires | `48` |
| `ADMIN_TELEGRAM_ID` | Admin Telegram user ID for alerts | — |

---

## 🔒 Firebase Storage Rules

Apply these rules in your Firebase Console under **Storage → Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Allow users to read/write only their own video directory
    match /videos/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

> 📌 The bot uses the **Firebase Admin SDK** which bypasses these rules (admin privilege). Rules protect direct client-side access.

---

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Welcome message and UID authentication prompt |
| `/auth <UID>` | Authenticate with your Firebase Auth UID |
| `/upload` | Instructions to send a video for upload |
| `/history` | View your last 10 uploaded videos |
| `/status` | Check current bot and Firebase connection status |
| `/help` | Show all available commands |
| `/cancel` | Cancel current operation |

---

## 📡 API Reference

### UID Verification Flow

```python
import firebase_admin
from firebase_admin import auth

def verify_uid(uid: str) -> bool:
    """
    Verifies a Firebase Auth UID exists in the project.
    Returns True if valid, False otherwise.
    """
    try:
        user = auth.get_user(uid)
        return user is not None
    except auth.UserNotFoundError:
        return False
```

### Upload to Firebase Storage

```python
from firebase_admin import storage
import uuid
from datetime import timedelta

def upload_video(uid: str, file_path: str, filename: str) -> str:
    """
    Uploads a video to Firebase Storage under videos/{uid}/.
    Returns a signed download URL valid for 48 hours.
    """
    bucket = storage.bucket()
    blob_path = f"videos/{uid}/{uuid.uuid4()}_{filename}"
    blob = bucket.blob(blob_path)

    blob.upload_from_filename(file_path, content_type="video/mp4")

    signed_url = blob.generate_signed_url(
        expiration=timedelta(hours=48),
        method="GET"
    )
    return signed_url
```

### Log to Firestore

```python
from firebase_admin import firestore
from datetime import datetime

def log_upload(uid: str, filename: str, url: str, size_mb: float):
    """
    Logs upload metadata to Firestore under users/{uid}/uploads/
    """
    db = firestore.client()
    db.collection("users").document(uid).collection("uploads").add({
        "filename": filename,
        "url": url,
        "size_mb": round(size_mb, 2),
        "uploaded_at": datetime.utcnow().isoformat(),
    })
```

---

## 📊 Upload Limits & Specs

```
Video Upload Constraints
════════════════════════════════════════════════════════

  Max File Size    ████████████████████░░░░  200 MB
  Supported Ext    MP4 · MOV · AVI · MKV · WEBM
  Max Duration     No limit (within size cap)
  Storage Path     videos/{firebase_uid}/{uuid}_{filename}
  URL Validity     48 hours (signed URL)
  Rate Limit       10 uploads per user per day

════════════════════════════════════════════════════════
```

| Format | MIME Type | Max Resolution | Notes |
|---|---|---|---|
| MP4 | `video/mp4` | 4K (3840×2160) | Recommended |
| MOV | `video/quicktime` | 4K | Apple devices |
| AVI | `video/x-msvideo` | 1080p | Legacy support |
| MKV | `video/x-matroska` | 4K | Open format |
| WEBM | `video/webm` | 4K | Web optimized |

---

## ❌ Error Codes

| Code | Error | Cause | Resolution |
|---|---|---|---|
| `E001` | `UID_NOT_FOUND` | Firebase UID doesn't exist | Check UID in Firebase Console |
| `E002` | `FILE_TOO_LARGE` | Video exceeds 200 MB limit | Compress the video before sending |
| `E003` | `UNSUPPORTED_FORMAT` | File format not in allowed list | Convert to MP4 or MOV |
| `E004` | `UPLOAD_FAILED` | Firebase Storage write failed | Check storage rules and quota |
| `E005` | `AUTH_EXPIRED` | Session expired, re-auth needed | Send `/auth <UID>` again |
| `E006` | `RATE_LIMITED` | Too many uploads in 24 hours | Wait before uploading more |
| `E007` | `FIRESTORE_WRITE_ERROR` | Failed to log metadata | Check Firestore rules/quota |

---

## 🗺️ Roadmap

```
v1.0  ✅  Core upload with UID auth
v1.1  ✅  Upload history command
v1.2  ✅  Signed URL generation
v1.3  🔧  Admin alert notifications (Beta)
v2.0  🗓️  Batch video upload support
v2.1  🗓️  Multi-language bot responses
v2.2  🗓️  Thumbnail generation on upload
v2.3  🗓️  Web dashboard for upload management
v3.0  🗓️  OAuth login via Firebase (no manual UID)
```

---

## 📈 How Uploads Are Stored

```
Firebase Storage Bucket
└── videos/
    ├── uid_abc123/
    │   ├── 1701234567_myvideo.mp4       (User A - Upload 1)
    │   └── 1701298765_clip2.mov         (User A - Upload 2)
    ├── uid_xyz789/
    │   └── 1701334567_tutorial.mp4      (User B - Upload 1)
    └── uid_def456/
        └── 1701412345_recording.mkv     (User C - Upload 1)

Firestore Database
└── users/
    ├── uid_abc123/
    │   └── uploads/
    │       ├── doc1: { filename, url, size_mb, uploaded_at }
    │       └── doc2: { filename, url, size_mb, uploaded_at }
    └── uid_xyz789/
        └── uploads/
            └── doc1: { filename, url, size_mb, uploaded_at }
```

---

## 🧪 Running Tests

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=bot --cov-report=term-missing

# Run specific test
pytest tests/test_upload.py -v
```

---

## 🐳 Docker Deployment

```bash
# Build image
docker build -t firebot .

# Run container
docker run -d \
  --name firebot \
  --env-file .env \
  -v $(pwd)/firebase:/app/firebase \
  firebot
```

---

## 👤 Author

<div align="center">

### **Ayusman Samasi**

[![GitHub](https://img.shields.io/badge/GitHub-ayusmansamasi-181717?style=for-the-badge&logo=github)](https://github.com/ayusmansamasi)
[![Telegram](https://img.shields.io/badge/Telegram-@ayusmansamasi-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/ayusmansamasi)

*Built with ❤️ using Python, Firebase & Telegram Bot API*

</div>

---

## 📄 License

```
MIT License

Copyright (c) 2025 Ayusman Samasi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

⭐ **If this project helped you, please give it a star!** ⭐

Made by [Ayusman Samasi](https://github.com/ayusmansamasi) • Powered by 🔥 Firebase + 🤖 Telegram

</div>
