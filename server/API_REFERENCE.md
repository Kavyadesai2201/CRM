# API REFERENCE — Complete Endpoint Listing

Quick reference for all 30+ endpoints in the CRM backend.

---

## Authentication (3 endpoints)

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
```

**Example:**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"sales123"}'

# Response: { "token": "eyJ...", "user": {...} }
```

---

## Leads (5 endpoints)

```
GET    /api/leads?page=1&limit=20&stage=&source=&search=
GET    /api/leads/:id
POST   /api/leads
PUT    /api/leads/:id
DELETE /api/leads/:id
```

**Query Parameters:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20)
- `stage` — Filter by stage (new, contacted, qualified, proposal_sent, closed_won, closed_lost)
- `source` — Filter by source (whatsapp, instagram, web, email, manual)
- `search` — Search by name or email

**Example:**
```bash
# Get leads, filter by stage
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/leads?stage=qualified&limit=50"

# Create lead
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+14155552671",
    "company": "Acme Inc",
    "source": "whatsapp",
    "stage": "new"
  }' \
  http://localhost:5000/api/leads

# Update lead
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "contacted",
    "assigned_to": "550e8400-e29b-41d4-a716-446655440002"
  }' \
  http://localhost:5000/api/leads/550e8400-e29b-41d4-a716-446655550001

# Delete lead
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/leads/550e8400-e29b-41d4-a716-446655550001
```

---

## Messages (1 endpoint)

```
GET    /api/leads/:leadId/messages?page=1&limit=50
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "lead_id": "uuid",
      "direction": "inbound",
      "channel": "whatsapp",
      "content": "Hi, interested in your product",
      "sent_at": "2024-06-11T10:30:00Z",
      "created_at": "2024-06-11T10:30:05Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 12, "pages": 1 }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/leads/550e8400-e29b-41d4-a716-446655550001/messages?limit=100"
```

---

## Notes (3 endpoints)

```
GET    /api/notes/:leadId?page=1&limit=50
POST   /api/notes/:leadId
DELETE /api/notes/:leadId/:noteId
```

**Example:**
```bash
# Get notes
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/notes/550e8400-e29b-41d4-a716-446655550001"

# Add note
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Customer requested demo on Friday"}' \
  http://localhost:5000/api/notes/550e8400-e29b-41d4-a716-446655550001

# Delete note (admin or author only)
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notes/550e8400-e29b-41d4-a716-446655550001/770e8400-e29b-41d4-a716-446655550001
```

---

## Analytics (4 endpoints)

```
GET    /api/analytics/dashboard
GET    /api/analytics/leads-by-source
GET    /api/analytics/conversion
GET    /api/analytics/revenue
```

**Dashboard Response:**
```json
{
  "totalLeads": 5,
  "newToday": 1,
  "bySource": {
    "whatsapp": 1,
    "instagram": 1,
    "web": 1,
    "email": 1,
    "manual": 1
  },
  "byStage": {
    "new": 1,
    "contacted": 1,
    "qualified": 1,
    "proposal_sent": 1,
    "closed_won": 1,
    "closed_lost": 0
  },
  "new_leads_30d": 4,
  "total_won": 1,
  "total_lost": 0,
  "total_revenue": 150000,
  "pipeline_value": 260000
}
```

**Example:**
```bash
# Dashboard stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/dashboard

# Leads by source
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/leads-by-source

# Conversion funnel
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/conversion

# Revenue timeline
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/revenue
```

---

## Pipeline (3 endpoints)

```
GET    /api/pipeline/stages
GET    /api/pipeline/stats
PATCH  /api/pipeline/:leadId/stage
```

**Example:**
```bash
# Get stage breakdown
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/pipeline/stages

# Get pipeline stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/pipeline/stats

# Move lead to stage
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage": "proposal_sent"}' \
  http://localhost:5000/api/pipeline/550e8400-e29b-41d4-a716-446655550001/stage
```

---

## Webhooks (4 endpoints)

```
GET    /api/webhooks/whatsapp
POST   /api/webhooks/whatsapp
GET    /api/webhooks/instagram
POST   /api/webhooks/instagram
```

**Note:** Webhook endpoints don't require JWT. Meta verifies using `hub.verify_token`.

**Example:**
```bash
# Webhook verification (automatic during Meta setup)
curl "http://localhost:5000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=MY_TOKEN&hub.challenge=abc123"

# Inbound message handler (Meta posts JSON automatically)
curl -X POST http://localhost:5000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{...}]
  }'
```

---

## WhatsApp Message Sending (1 endpoint)

```
POST   /api/whatsapp/send (Authenticated)
```

**Example:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+14155552671",
    "message": "Hello! Thanks for your interest."
  }' \
  http://localhost:5000/api/whatsapp/send
```

---

## Instagram Comment Reply (1 endpoint)

```
POST   /api/instagram/reply (Authenticated)
```

**Example:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"commentId": "123456", "message": "Thanks!"}' \
  http://localhost:5000/api/instagram/reply
```

---

## Health Check (1 endpoint)

```
GET    /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "CRM API",
  "version": "1.0.0",
  "timestamp": "2024-06-11T10:30:00.000Z"
}
```

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Lead retrieved, message sent |
| 201 | Created | Lead created, note added |
| 204 | No Content | Lead deleted |
| 400 | Bad Request | Missing required field, invalid data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't have permission (role check) |
| 404 | Not Found | Lead, note, or resource doesn't exist |
| 500 | Server Error | Database error, internal failure |

---

## Authentication Pattern

All endpoints except `/auth/*` and `/webhooks/*` require:

```
Authorization: Bearer <JWT_TOKEN>
```

**Get token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Then use `token` value in all subsequent requests:
```bash
curl -H "Authorization: Bearer eyJ..." http://localhost:5000/api/leads
```

---

## Pagination Pattern

List endpoints support pagination:

```
?page=1&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Error Response Format

```json
{
  "error": "Lead not found"
}
```

Or with more details:

```json
{
  "error": "Forbidden: Admin access required",
  "userRole": "sales_rep"
}
```

---

## Common Workflows

### Create Lead → Add Notes → Move Through Pipeline

```bash
# 1. Create lead
LEAD_ID=$(curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "email": "contact@acme.com", "source": "manual"}' \
  http://localhost:5000/api/leads | jq -r .id)

# 2. Add note
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Initial contact made"}' \
  http://localhost:5000/api/notes/$LEAD_ID

# 3. Move to "contacted" stage
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage": "contacted"}' \
  http://localhost:5000/api/pipeline/$LEAD_ID/stage

# 4. View conversation & notes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/leads/$LEAD_ID/messages

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notes/$LEAD_ID
```

---

## Performance Tips

- Use `?limit=50` for large lists
- Filter by `stage` or `source` before search
- Pagination is indexed for fast retrieval
- Messages are ordered by `sent_at` DESC
- Notes are ordered by `created_at` DESC

---

**See QUICKSTART.md for complete setup and testing guide.**
