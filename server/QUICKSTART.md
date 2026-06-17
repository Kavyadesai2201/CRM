# Complete CRM Backend — QUICKSTART Guide

Welcome! This guide will help you set up, test, and deploy the complete CRM backend built with Node.js, Express, and PostgreSQL.

## System Requirements

- **Node.js** 16+ (check: `node --version`)
- **PostgreSQL** 12+ (check: `psql --version`)
- **npm** or **yarn** for package management
- **Postman** or **curl** for API testing (optional)

---

## Step 1: Install Dependencies

```bash
cd /path/to/CRM
npm install
npm install --prefix server
npm install --prefix client
```

---

## Step 2: Configure Environment

Copy the example env file and fill in your values:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crm_db

# Auth
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development

# WhatsApp (optional for webhooks)
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_VERIFY_TOKEN=your_token

# Instagram (optional for webhooks)
INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_VERIFY_TOKEN=your_token
```

---

## Step 3: Initialize Database

Run migrations to create all tables (users, leads, messages, notes, activities):

```bash
node server/db/migrate.js
```

Expected output:
```
🐘 PostgreSQL connected
✅ Migration complete
```

---

## Step 4: Load Sample Data (Optional)

Populate database with 5 sample leads, 2 users, messages, and notes:

```bash
psql $DATABASE_URL < server/db/seed.sql
```

This creates:
- 2 sample users (admin + sales_rep)
- 5 sample leads across all pipeline stages
- Sample messages (WhatsApp, Instagram, Email)
- Sample notes with team annotations

**Login credentials (after seed):**
- Admin: alice@example.com / admin123
- Sales Rep: bob@example.com / sales123

---

## Step 5: Start the Server

```bash
npm run start:server
```

Expected output:
```
🚀 CRM Server running on http://localhost:5000
🐘 PostgreSQL connected
```

---

## Step 6: Test the API

### A. Get Auth Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "sales123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Bob Sales",
    "email": "bob@example.com",
    "role": "sales_rep"
  }
}
```

**Save the token for the following requests:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### B. Get All Leads (Paginated)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/leads?page=1&limit=20
```

Response:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655550001",
      "name": "John Anderson",
      "email": "john@acme.com",
      "stage": "new",
      "source": "whatsapp",
      "assigned_to": "550e8400-e29b-41d4-a716-446655440002",
      "created_at": "2024-06-11T..."
    }
  ],
  "page": 1,
  "limit": 20
}
```

### C. Filter Leads by Stage

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/leads?stage=qualified"
```

### D. Filter Leads by Source

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/leads?source=whatsapp"
```

### E. Search Leads by Name

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/leads?search=John"
```

### F. Get Lead Details

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/leads/550e8400-e29b-41d4-a716-446655550001
```

### G. Get Message Thread for a Lead

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/leads/550e8400-e29b-41d4-a716-446655550001/messages?page=1&limit=50"
```

Response:
```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655550001",
      "lead_id": "550e8400-e29b-41d4-a716-446655550001",
      "direction": "inbound",
      "channel": "whatsapp",
      "content": "Hi, I'm interested in learning more about your product",
      "sent_at": "2024-06-11T12:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 2, "pages": 1 }
}
```

### H. Get All Notes for a Lead

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/notes/550e8400-e29b-41d4-a716-446655550001"
```

Response:
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655550001",
      "lead_id": "550e8400-e29b-41d4-a716-446655550001",
      "author_id": "550e8400-e29b-41d4-a716-446655440002",
      "author_name": "Bob Sales",
      "body": "Initial contact via WhatsApp. Customer seemed very interested.",
      "created_at": "2024-06-11T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 1, "pages": 1 }
}
```

### I. Add a Note to a Lead

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Customer requested follow-up call tomorrow"}' \
  http://localhost:5000/api/notes/550e8400-e29b-41d4-a716-446655550001
```

Response:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655550099",
  "lead_id": "550e8400-e29b-41d4-a716-446655550001",
  "author_id": "550e8400-e29b-41d4-a716-446655440002",
  "author_name": "Bob Sales",
  "body": "Customer requested follow-up call tomorrow",
  "created_at": "2024-06-11T15:45:00Z"
}
```

### J. Update a Lead (Assign, Change Stage, Update Info)

```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Anderson",
    "email": "john.anderson@acme.com",
    "phone": "+14155552671",
    "stage": "contacted",
    "assigned_to": "550e8400-e29b-41d4-a716-446655440002"
  }' \
  http://localhost:5000/api/leads/550e8400-e29b-41d4-a716-446655550001
```

### K. Create a New Lead (Manual)

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Customer",
    "email": "newcustomer@company.com",
    "phone": "+14155559999",
    "company": "Tech Solutions Ltd",
    "source": "manual",
    "stage": "new"
  }' \
  http://localhost:5000/api/leads
```

### L. Get Dashboard Stats

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/dashboard
```

Response:
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

### M. Get Leads by Source (Analytics)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/leads-by-source
```

### N. Get Conversion Funnel

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/conversion
```

---

## API Reference

### Authentication

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/auth/login` | `{ email, password }` | None |
| POST | `/api/auth/register` | `{ name, email, password }` | None |
| GET | `/api/auth/me` | None | JWT |

### Leads Management

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/leads?page=1&limit=20&stage=&source=&search=` | List leads (paginated, filterable) | JWT |
| GET | `/api/leads/:id` | Get lead details | JWT |
| POST | `/api/leads` | Create lead | JWT |
| PUT | `/api/leads/:id` | Update lead | JWT |
| DELETE | `/api/leads/:id` | Delete lead | JWT |

### Messages

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/leads/:id/messages?page=1&limit=50` | Get message thread | JWT |

### Notes

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/notes/:leadId?page=1&limit=50` | Get notes for lead | JWT |
| POST | `/api/notes/:leadId` | Add note to lead | JWT |
| DELETE | `/api/notes/:leadId/:noteId` | Delete note | JWT (admin or author) |

### Analytics

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/analytics/dashboard` | Dashboard KPIs | JWT |
| GET | `/api/analytics/leads-by-source` | Breakdown by channel | JWT |
| GET | `/api/analytics/conversion` | Funnel with percentages | JWT |
| GET | `/api/analytics/revenue` | Monthly revenue timeline | JWT |

### Pipeline

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/pipeline/stages` | Leads per stage | JWT |
| GET | `/api/pipeline/stats` | Pipeline value by stage | JWT |
| PATCH | `/api/pipeline/:leadId/stage` | Move lead to stage | JWT |

---

## Common Errors & Solutions

### 401 Unauthorized
- **Issue:** Missing or invalid JWT token
- **Solution:** Re-login with valid credentials and use new token

### 403 Forbidden
- **Issue:** User doesn't have permission for this action
- **Solution:** Check user role (must be admin for certain endpoints)

### 404 Not Found
- **Issue:** Lead, note, or resource doesn't exist
- **Solution:** Verify the ID is correct with a GET request first

### 500 Internal Server Error
- **Issue:** Database connection or query error
- **Solution:** Check database is running, migrations completed, and env variables correct

---

## Database Schema

### Tables Created

1. **users** — Team members (admin, sales_rep, viewer)
2. **leads** — Prospects/customers (CRM core entities)
3. **messages** — Communication history (WhatsApp, Instagram, Email, SMS)
4. **notes** — Agent annotations on leads
5. **activities** — Audit trail and historical events

For full schema documentation, see: `/server/db/schema.sql`

---

## Testing Postman Collection

Create a Postman collection with these endpoints:

1. **Auth:**
   - POST /api/auth/login
   - GET /api/auth/me

2. **Leads:**
   - GET /api/leads (with filters)
   - GET /api/leads/:id
   - POST /api/leads
   - PUT /api/leads/:id
   - DELETE /api/leads/:id

3. **Messages & Notes:**
   - GET /api/leads/:id/messages
   - GET /api/notes/:leadId
   - POST /api/notes/:leadId
   - DELETE /api/notes/:leadId/:noteId

4. **Analytics:**
   - GET /api/analytics/dashboard
   - GET /api/analytics/leads-by-source
   - GET /api/analytics/conversion
   - GET /api/analytics/revenue

Set up Postman environment variables:
```json
{
  "BASE_URL": "http://localhost:5000",
  "TOKEN": "{{save from login response}}",
  "LEAD_ID": "550e8400-e29b-41d4-a716-446655550001"
}
```

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (min 32 characters)
- [ ] Enable `SSL` for PostgreSQL in production
- [ ] Configure `CORS` for your frontend domain
- [ ] Use `.env` file with production values (never commit)
- [ ] Run migrations on production database
- [ ] Set up database backups
- [ ] Configure logging/monitoring (e.g., Winston, Sentry)
- [ ] Use process manager (PM2, Systemd, Docker)
- [ ] Enable rate limiting on API endpoints
- [ ] Set up HTTPS certificates (Let's Encrypt)
- [ ] Configure firewall rules

---

## Useful PostgreSQL Queries

### View all tables
```sql
\dt
```

### Check leads by stage
```sql
SELECT stage, COUNT(*) FROM leads GROUP BY stage;
```

### View message thread
```sql
SELECT * FROM messages WHERE lead_id = '550e8400-e29b-41d4-a716-446655550001' ORDER BY sent_at;
```

### See notes with authors
```sql
SELECT n.body, u.name, n.created_at FROM notes n
LEFT JOIN users u ON n.author_id = u.id
WHERE n.lead_id = '550e8400-e29b-41d4-a716-446655550001' ORDER BY n.created_at DESC;
```

### Calculate conversion funnel
```sql
SELECT stage, COUNT(*) as count,
  ROUND(COUNT(*)*100.0/NULLIF(SUM(COUNT(*)) OVER (),0),2) as percentage
FROM leads GROUP BY stage;
```

---

## Next Steps

- [ ] Start the server (`npm run start:server`)
- [ ] Test endpoints with Postman or curl
- [ ] Integrate webhooks (WhatsApp, Instagram)
- [ ] Build frontend UI
- [ ] Set up CI/CD pipeline
- [ ] Configure production database
- [ ] Deploy to AWS/Heroku/GCP

---

## Support

For more information, see:
- `/server/db/schema.sql` — Complete database schema
- `/server/db/migrate.js` — Migration script
- `/server/routes/` — API route definitions
- `/server/controllers/` — Business logic

Good luck! 🚀
