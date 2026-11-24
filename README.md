# Internship Records REST API

A Node.js, Express, and SQLite REST API for managing internship records with Zod input validation, pagination, filtering, and predictable JSON error contracts.

## Quick Start

```bash
git clone <your-repo-url>
cd internship-records-api
npm install
npm run seed
npm start
```

The API runs on `http://localhost:3000`.

## API Contract

Every response follows a consistent envelope:

- **Success:** `{ "success": true, "data": ..., "pagination": { ... } }`
- **Error:** `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] } }`

### Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/internships` | List internships with pagination (`page`, `limit`) & filters (`mode`, `domain`, `open`) | `200`, `400` |
| `GET` | `/api/internships/:id` | Fetch a single internship by ID | `200`, `404` |
| `POST` | `/api/internships` | Create a new internship record | `201`, `400`, `409` |
| `PATCH` | `/api/internships/:id` | Partially update an existing internship | `200`, `400`, `404` |
| `DELETE` | `/api/internships/:id` | Delete an internship by ID | `200`, `404` |

## `curl` Examples

### 1. List with Pagination & Filter
```bash
curl "http://localhost:3000/api/internships?page=1&limit=3&mode=Remote"
```

### 2. Get Single Record
```bash
curl "http://localhost:3000/api/internships/INT-101"
```

### 3. Create Record
```bash
curl -X POST http://localhost:3000/api/internships \
  -H "Content-Type: application/json" \
  -d '{
    "id": "INT-201",
    "title": "Backend Node.js Intern",
    "domain": "Full Stack Development",
    "mode": "Remote",
    "location": "Chennai",
    "duration_weeks": 8,
    "skills": ["Node.js", "Express", "SQLite"],
    "openings": 2,
    "applications_open": true
  }'
```

### 4. Update Record
```bash
curl -X PATCH http://localhost:3000/api/internships/INT-201 \
  -H "Content-Type: application/json" \
  -d '{"openings": 4, "applications_open": false}'
```

### 5. Delete Record
```bash
curl -X DELETE http://localhost:3000/api/internships/INT-201
```

### 6. Trigger Validation Error (`400 Bad Request`)
```bash
curl -X POST http://localhost:3000/api/internships \
  -H "Content-Type: application/json" \
  -d '{"id": "BAD-ID", "title": "Hi", "mode": "Mars"}'
```
