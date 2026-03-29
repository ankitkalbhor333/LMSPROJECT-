# API Documentation - Notes, Videos, and Free Tests

## Overview
This document outlines all the API endpoints for managing notes, videos, and free tests on the Coaching Website.

**Base URL:** `http://localhost:5000/api`

---

## Authentication
Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Only authenticated admin users can upload, update, or delete content.

---

## NOTES API

### Upload Notes
- **Route:** `POST /api/notes`
- **Access:** Private (Admin only)
- **Middleware:** Multer (PDF files only, max 50MB)

**Request:**
```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Authorization: Bearer <token>" \
  -F "title=Algebra Basics" \
  -F "subject=Mathematics" \
  -F "chapter=Chapter 1" \
  -F "file=@notes.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Notes uploaded successfully",
  "data": {
    "_id": "60d5ec49c1234567890abcde",
    "title": "Algebra Basics",
    "subject": "Mathematics",
    "chapter": "Chapter 1",
    "fileUrl": "/uploads/notes/1624900681234-notes.pdf",
    "fileSize": "2.45 MB",
    "downloads": 0,
    "createdAt": "2024-06-28T10:20:30.000Z",
    "updatedAt": "2024-06-28T10:20:30.000Z"
  }
}
```

### Get All Notes
- **Route:** `GET /api/notes`
- **Access:** Public
- **Query Parameters:**
  - `subject` - Filter by subject
  - `chapter` - Filter by chapter
  - `sortBy` - Sort field (default: createdAt)

**Request:**
```bash
curl http://localhost:5000/api/notes?subject=Mathematics&sortBy=createdAt
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### Get Notes by Subject
- **Route:** `GET /api/notes/subject/:subject`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/notes/subject/Mathematics
```

### Get Single Note
- **Route:** `GET /api/notes/:id`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/notes/60d5ec49c1234567890abcde
```

### Update Notes
- **Route:** `PUT /api/notes/:id`
- **Access:** Private (Admin only)
- **Request Body:** (all optional, can include new file)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/notes/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Algebra",
    "subject": "Mathematics",
    "chapter": "Chapter 2"
  }'
```

### Delete Notes
- **Route:** `DELETE /api/notes/:id`
- **Access:** Private (Admin only)

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/notes/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer <token>"
```

### Download Notes (Increment Counter)
- **Route:** `PUT /api/notes/:id/download`
- **Access:** Public

**Request:**
```bash
curl -X PUT http://localhost:5000/api/notes/60d5ec49c1234567890abcde/download
```

---

## VIDEOS API

### Upload Video
- **Route:** `POST /api/videos`
- **Access:** Private (Admin only)
- **Middleware:** Multer (Video files only, max 500MB)

**Request:**
```bash
curl -X POST http://localhost:5000/api/videos \
  -H "Authorization: Bearer <token>" \
  -F "title=Introduction to Physics" \
  -F "className=Class 10" \
  -F "exam=JEE" \
  -F "subject=Physics" \
  -F "duration=45:30" \
  -F "teacher=Dr. Smith" \
  -F "file=@video.mp4"
```

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "_id": "60d5ec49c1234567890abcde",
    "title": "Introduction to Physics",
    "className": "Class 10",
    "exam": "JEE",
    "subject": "Physics",
    "duration": "45:30",
    "teacher": "Dr. Smith",
    "videoUrl": "/uploads/videos/1624900681234-video.mp4",
    "createdAt": "2024-06-28T10:20:30.000Z",
    "updatedAt": "2024-06-28T10:20:30.000Z"
  }
}
```

### Get All Videos
- **Route:** `GET /api/videos`
- **Access:** Public
- **Query Parameters:**
  - `className` - Filter by class
  - `exam` - Filter by exam
  - `subject` - Filter by subject
  - `sortBy` - Sort field (default: createdAt)

**Request:**
```bash
curl http://localhost:5000/api/videos?exam=JEE&subject=Physics
```

### Get Videos by Class
- **Route:** `GET /api/videos/class/:className`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/videos/class/Class%2010
```

### Get Videos by Exam
- **Route:** `GET /api/videos/exam/:exam`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/videos/exam/JEE
```

### Get Videos by Subject
- **Route:** `GET /api/videos/subject/:subject`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/videos/subject/Physics
```

### Search Videos
- **Route:** `GET /api/videos/search/:query`
- **Access:** Public
- **Search Fields:** title, subject, teacher

**Request:**
```bash
curl http://localhost:5000/api/videos/search/thermodynamics
```

### Get Single Video
- **Route:** `GET /api/videos/:id`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/videos/60d5ec49c1234567890abcde
```

### Update Video
- **Route:** `PUT /api/videos/:id`
- **Access:** Private (Admin only)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/videos/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Physics",
    "duration": "50:00"
  }'
```

### Delete Video
- **Route:** `DELETE /api/videos/:id`
- **Access:** Private (Admin only)

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/videos/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer <token>"
```

---

## FREE TESTS API

### Create Test
- **Route:** `POST /api/freetests`
- **Access:** Private (Admin only)

**Request Body:**
```json
{
  "title": "Test 1 - Mathematics",
  "subject": "Mathematics",
  "timeLimit": 60,
  "questions": [
    {
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    },
    {
      "question": "What is the square root of 16?",
      "options": ["2", "4", "8", "16"],
      "correctAnswer": 1
    }
  ]
}
```

**Request:**
```bash
curl -X POST http://localhost:5000/api/freetests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

**Response:**
```json
{
  "success": true,
  "message": "Test created successfully",
  "data": {
    "_id": "60d5ec49c1234567890abcde",
    "title": "Test 1 - Mathematics",
    "subject": "Mathematics",
    "timeLimit": 60,
    "questions": [...],
    "createdAt": "2024-06-28T10:20:30.000Z",
    "updatedAt": "2024-06-28T10:20:30.000Z"
  }
}
```

### Get All Tests
- **Route:** `GET /api/freetests`
- **Access:** Public
- **Query Parameters:**
  - `subject` - Filter by subject
  - `sortBy` - Sort field (default: createdAt)

**Request:**
```bash
curl http://localhost:5000/api/freetests?subject=Mathematics
```

### Get Tests by Subject
- **Route:** `GET /api/freetests/subject/:subject`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/freetests/subject/Mathematics
```

### Get Single Test (With Answers - Admin)
- **Route:** `GET /api/freetests/:id`
- **Access:** Public (but shows all data including answers)

**Request:**
```bash
curl http://localhost:5000/api/freetests/60d5ec49c1234567890abcde
```

### Get Test for Attempt (Without Answers)
- **Route:** `GET /api/freetests/:id/attempt`
- **Access:** Public

**Request:**
```bash
curl http://localhost:5000/api/freetests/60d5ec49c1234567890abcde/attempt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49c1234567890abcde",
    "title": "Test 1 - Mathematics",
    "subject": "Mathematics",
    "timeLimit": 60,
    "questions": [
      {
        "_id": "60d5ec49c1234567890abcdf",
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"]
      }
    ]
  }
}
```

### Update Test
- **Route:** `PUT /api/freetests/:id`
- **Access:** Private (Admin only)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/freetests/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test 1 - Advanced Mathematics",
    "timeLimit": 90
  }'
```

### Delete Test
- **Route:** `DELETE /api/freetests/:id`
- **Access:** Private (Admin only)

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/freetests/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## File Upload Guidelines

### Notes
- **Accepted Format:** PDF only
- **Max File Size:** 50MB
- **Field Name:** `file`

### Videos
- **Accepted Formats:** MP4, MPEG, MOV, AVI
- **Max File Size:** 500MB
- **Field Name:** `file`

---

## Notes for Frontend Integration

1. Always include JWT token in `Authorization` header for protected routes
2. Use form-data when uploading files (not JSON)
3. Show appropriate error messages from API responses
4. Cache GET requests for better performance
5. Validate file types and sizes on frontend before uploading
6. Use the `/api/freetests/:id/attempt` endpoint when students are taking tests to hide correct answers

---

## Database Fields Reference

### Notes Schema
```javascript
{
  title: String,
  subject: String,
  chapter: String,
  fileUrl: String,
  fileSize: String,
  downloads: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Videos Schema
```javascript
{
  title: String,
  className: String,
  exam: String,
  subject: String,
  duration: String,
  teacher: String,
  videoUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### FreeTest Schema
```javascript
{
  title: String,
  subject: String,
  timeLimit: Number,
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```