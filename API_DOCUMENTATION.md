# AI Studio API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:**

- Email must be valid format
- Password must be at least 6 characters
- Email must be unique

**Success Response:** `201 Created`

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input

```json
{
  "error": "Invalid email format",
  "status": 400
}
```

- `409 Conflict` - Email already exists

```json
{
  "error": "User with this email already exists",
  "status": 409
}
```

---

### Login User

Authenticate an existing user.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response:** `401 Unauthorized`

```json
{
  "error": "Invalid email or password",
  "status": 401
}
```

---

### Get Current User

Get information about the authenticated user.

**Endpoint:** `GET /api/auth/me`

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response:** `200 OK`

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2025-10-21T10:30:00.000Z"
  }
}
```

**Error Response:** `401 Unauthorized`

```json
{
  "error": "Invalid or expired token",
  "status": 401
}
```

---

## Generation Endpoints

### Create Generation

Create a new AI generation request.

**Endpoint:** `POST /api/generations`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:** (multipart/form-data)

- `image` (file): Image file (JPEG, PNG, GIF, WEBP, max 5MB)
- `prompt` (string): Text prompt (1-500 characters)

**Success Response:** `201 Created`

```json
{
  "message": "Generation started",
  "generation": {
    "id": 1,
    "status": "processing",
    "prompt": "A model wearing a red dress on a runway",
    "inputImageUrl": "/uploads/image-1234567890.jpg",
    "createdAt": "2025-10-21T10:30:00.000Z"
  }
}
```

**Processing Flow:**

1. Request returns immediately with `processing` status
2. Generation processes asynchronously (2-4 seconds)
3. 20% chance of random error
4. Status updates to `completed` or `failed`

**Error Responses:**

- `400 Bad Request` - Missing or invalid input

```json
{
  "error": "Image file is required",
  "status": 400
}
```

- `401 Unauthorized` - No token or invalid token

```json
{
  "error": "Invalid or expired token",
  "status": 401
}
```

---

### Get Generation by ID

Get details of a specific generation.

**Endpoint:** `GET /api/generations/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `id` (number): Generation ID

**Success Response:** `200 OK`

**Processing:**

```json
{
  "generation": {
    "id": 1,
    "status": "processing",
    "prompt": "A model wearing a red dress on a runway",
    "inputImageUrl": "/uploads/image-1234567890.jpg",
    "outputImageUrl": null,
    "errorMessage": null,
    "createdAt": "2025-10-21T10:30:00.000Z",
    "completedAt": null
  }
}
```

**Completed:**

```json
{
  "generation": {
    "id": 1,
    "status": "completed",
    "prompt": "A model wearing a red dress on a runway",
    "inputImageUrl": "/uploads/image-1234567890.jpg",
    "outputImageUrl": "/uploads/image-1234567890.jpg",
    "errorMessage": null,
    "createdAt": "2025-10-21T10:30:00.000Z",
    "completedAt": "2025-10-21T10:30:03.500Z"
  }
}
```

**Failed:**

```json
{
  "generation": {
    "id": 1,
    "status": "failed",
    "prompt": "A model wearing a red dress on a runway",
    "inputImageUrl": "/uploads/image-1234567890.jpg",
    "outputImageUrl": null,
    "errorMessage": "AI model is currently overloaded. Please try again.",
    "createdAt": "2025-10-21T10:30:00.000Z",
    "completedAt": "2025-10-21T10:30:03.200Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid ID

```json
{
  "error": "Invalid generation ID",
  "status": 400
}
```

- `403 Forbidden` - Not the owner

```json
{
  "error": "Access denied",
  "status": 403
}
```

- `404 Not Found` - Generation doesn't exist

```json
{
  "error": "Generation not found",
  "status": 404
}
```

---

### Get Recent Generations

Get the 5 most recent generations for the authenticated user.

**Endpoint:** `GET /api/generations/recent`

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response:** `200 OK`

```json
{
  "generations": [
    {
      "id": 3,
      "status": "completed",
      "prompt": "Latest generation",
      "inputImageUrl": "/uploads/image-3.jpg",
      "outputImageUrl": "/uploads/image-3.jpg",
      "errorMessage": null,
      "createdAt": "2025-10-21T10:35:00.000Z",
      "completedAt": "2025-10-21T10:35:03.000Z"
    },
    {
      "id": 2,
      "status": "failed",
      "prompt": "Second generation",
      "inputImageUrl": "/uploads/image-2.jpg",
      "outputImageUrl": null,
      "errorMessage": "Generation timeout",
      "createdAt": "2025-10-21T10:32:00.000Z",
      "completedAt": "2025-10-21T10:32:04.000Z"
    },
    {
      "id": 1,
      "status": "completed",
      "prompt": "First generation",
      "inputImageUrl": "/uploads/image-1.jpg",
      "outputImageUrl": "/uploads/image-1.jpg",
      "errorMessage": null,
      "createdAt": "2025-10-21T10:30:00.000Z",
      "completedAt": "2025-10-21T10:30:02.500Z"
    }
  ]
}
```

**Notes:**

- Returns maximum of 5 most recent generations
- Ordered by creation date (newest first)
- Includes all statuses (processing, completed, failed)

---

## Health Check

### Server Health

Check if the server is running.

**Endpoint:** `GET /api/health`

**Success Response:** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2025-10-21T10:30:00.000Z"
}
```

---

## Error Codes Summary

| Code | Description                             |
| ---- | --------------------------------------- |
| 200  | Success                                 |
| 201  | Created                                 |
| 400  | Bad Request - Invalid input             |
| 401  | Unauthorized - Missing or invalid token |
| 403  | Forbidden - Access denied               |
| 404  | Not Found - Resource doesn't exist      |
| 409  | Conflict - Duplicate resource           |
| 500  | Internal Server Error                   |

---

## Status Values

### Generation Status

- `processing` - Generation is in progress
- `completed` - Generation completed successfully
- `failed` - Generation failed with error

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing:

- Per-user rate limits
- IP-based rate limits
- Cost-based rate limiting for AI operations

---

## Image Upload Specifications

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WEBP (.webp)

### Constraints

- Maximum file size: 5MB (5,242,880 bytes)
- Files are stored in `/uploads` directory
- Files are accessible via `/uploads/<filename>`

### File Naming

Files are saved with format: `image-<timestamp>-<random>.<ext>`

Example: `image-1729506000000-123456789.jpg`

---

## Examples

### cURL Examples

#### Register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### Create Generation

```bash
curl -X POST http://localhost:3001/api/generations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "prompt=A model wearing a red dress"
```

#### Get Recent Generations

```bash
curl -X GET http://localhost:3001/api/generations/recent \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Development Notes

### AI Simulation Behavior

The AI service simulates real AI processing with:

- **Processing delay**: Random 2-4 seconds
- **Error rate**: 20% chance of failure
- **Error messages**: Random selection from predefined list

### Database Schema

**Users Table:**

- id (serial primary key)
- email (varchar unique)
- password_hash (varchar)
- created_at (timestamp)

**Generations Table:**

- id (serial primary key)
- user_id (foreign key)
- prompt (text)
- input_image_url (text)
- output_image_url (text, nullable)
- status (varchar: processing/completed/failed)
- error_message (text, nullable)
- created_at (timestamp)
- completed_at (timestamp, nullable)
