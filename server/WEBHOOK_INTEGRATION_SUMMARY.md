# WhatsApp & Instagram Webhook Integration — Summary

## What's Built

Your CRM backend now has a complete Meta webhook integration layer that:

1. **Receives WhatsApp messages** → Auto-creates/updates leads
2. **Receives Instagram DMs** → Auto-creates/updates leads  
3. **Sends WhatsApp messages** → With JWT authentication
4. **Auto-verifies webhooks** → Handles Meta's subscription flow
5. **Handles errors gracefully** → Never breaks webhook delivery
6. **Deduplicates leads** → By phone (WhatsApp) or instagramId (Instagram)

---

## File Structure

```
server/
├── index.js                              # Main Express app
├── .env.example                          # Environment variable template
├── db/
│   ├── pool.js                           # PostgreSQL connection pool
│   └── migrate.js                        # Database schema setup
│
├── controllers/
│   ├── webhookController.js              # ⭐ Meta webhook handlers (WhatsApp + Instagram)
│   ├── instagramController.js            # Legacy: Instagram comment replies only
│   └── [other controllers...]
│
├── services/
│   └── leadService.js                    # ⭐ upsertLead() — creates/updates leads
│
├── routes/
│   ├── webhooks.js                       # ⭐ Routes: /api/webhooks/whatsapp|instagram
│   ├── whatsapp.js                       # ⭐ Route: /api/whatsapp/send
│   ├── instagram.js                      # Route: /api/instagram/reply (legacy)
│   └── [other routes...]
│
├── middleware/
│   └── auth.js                           # JWT verification
│
└── WEBHOOKS.md                           # 📖 Complete testing & setup guide
```

---

## Key Functions

### 1. Webhook Verification (Auto-Handled)

**What happens:**
- Meta sends GET request with `hub.verify_token` and `hub.challenge`
- Your endpoint verifies token matches `.env` variable
- If valid, echoes back `hub.challenge` (HTTP 200)
- If invalid, returns HTTP 403

**Code:**
```javascript
// GET /api/webhooks/whatsapp
export const verifyWhatsAppWebhook = (req, res) => {
  const token = req.query["hub.verify_token"];
  if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  return res.sendStatus(403);
};
```

### 2. Inbound Message Handling + Lead Upsert

**What happens:**
1. Meta sends POST with inbound message payload
2. Endpoint extracts: sender ID, message text, timestamp
3. Calls `upsertLead()` with extracted data
4. `upsertLead()` checks if lead exists by phone/instagramId
5. If exists → update `last_message`, `last_activity_at`
6. If not → insert new lead with source "whatsapp" or "instagram"
7. Always returns HTTP 200 to Meta (even on errors)

**Code Flow:**
```javascript
// POST /api/webhooks/whatsapp
export const handleWhatsAppWebhook = async (req, res) => {
  res.sendStatus(200);  // ← Return immediately
  
  try {
    const { messages } = req.body.entry[0].changes[0].value;
    for (const msg of messages) {
      const phone = msg.from;
      const text = msg.text.body;
      
      // ← This updates leads table
      await upsertLead({
        phone,
        lastMessage: text,
        source: "whatsapp"
      });
    }
  } catch (err) {
    console.error(err);  // Log but don't throw
  }
};
```

### 3. Send WhatsApp Message (Authenticated)

**What happens:**
1. Agent makes POST request with JWT token
2. Auth middleware verifies token
3. Your CRM makes API call to Meta's endpoint
4. Message is queued on WhatsApp servers
5. Response includes message_id for tracking

**Code:**
```javascript
// POST /api/whatsapp/send
export const sendWhatsAppMessage = async (req, res) => {
  const { to, message } = req.body;
  
  const { data } = await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      }
    }
  );
  
  return res.json({ success: true, data });
};
```

### 4. Lead Upsert Service

**What happens:**
1. Called by webhook handlers with `{ phone, instagramId, lastMessage, source }`
2. Uses PostgreSQL connection pool
3. Queries for existing lead by phone OR instagramId
4. If found: UPDATE last_message, last_activity_at, source
5. If not: INSERT new lead with stage "new"
6. Returns lead row

**Code:**
```javascript
// server/services/leadService.js
export async function upsertLead({ phone, instagramId, lastMessage, source }) {
  // 1. Find existing lead
  let existing = await queryByPhone(phone) || await queryByInstagramId(instagramId);
  
  // 2. Update or Insert
  if (existing) {
    return updateLead(existing.id, { lastMessage });
  } else {
    return insertLead({ phone, instagramId, lastMessage, source });
  }
}
```

---

## Environment Variables Required

Add to `/server/.env`:

```env
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_webhook_verify_token

# Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=your_meta_access_token
INSTAGRAM_VERIFY_TOKEN=your_custom_webhook_verify_token

# Core
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
PORT=5000
```

---

## API Endpoints

### WhatsApp

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...` | Meta verification | None |
| POST | `/api/webhooks/whatsapp` | Receive inbound messages | None* |
| POST | `/api/whatsapp/send` | Send message | JWT |

*Webhook endpoints return 200 but process asynchronously

### Instagram

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...` | Meta verification | None |
| POST | `/api/webhooks/instagram` | Receive inbound DMs | None* |
| POST | `/api/instagram/reply` | Reply to comment (legacy) | JWT |

---

## Database Schema

```sql
CREATE TABLE leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(150),
  phone            VARCHAR(30),              -- WhatsApp phone
  instagram_id     VARCHAR(80),              -- Instagram PSID
  last_message     TEXT,                     -- Most recent inbound text
  last_activity_at TIMESTAMPTZ,              -- Webhook event timestamp
  source           VARCHAR(80),              -- "whatsapp" or "instagram"
  stage            VARCHAR(50) DEFAULT 'new',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate leads per channel
CREATE UNIQUE INDEX idx_leads_phone ON leads (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX idx_leads_instagram_id ON leads (instagram_id) WHERE instagram_id IS NOT NULL;
```

---

## Error Handling Strategy

### Webhook Receives Bad Payload
```javascript
try {
  // Parse and process
} catch (err) {
  console.error(err);           // Log error
  res.sendStatus(200);          // ← Still return 200 to Meta!
}
```
**Why?** Meta will retry indefinitely if we return non-200. Returning 200 prevents webhook disablement.

### Database Connection Fails
```javascript
try {
  await upsertLead(...);
} catch (err) {
  console.error("DB error:", err);
  // Webhook still returns 200 to Meta
  // Error is logged for debugging
}
```

### Invalid JWT Token (on /api/whatsapp/send)
```javascript
// Middleware rejects before reaching handler
res.status(401).json({ error: 'Invalid token' });
```

---

## Testing Checklist

- [ ] POST test data to `/api/webhooks/whatsapp` → Lead created
- [ ] POST test data to `/api/webhooks/instagram` → Lead created  
- [ ] Verify duplicate phone/instagramId → Lead updated not duplicated
- [ ] GET webhook verification → Returns hub.challenge
- [ ] POST `/api/whatsapp/send` with invalid JWT → Returns 401
- [ ] POST `/api/whatsapp/send` with valid JWT → Message accepted
- [ ] PostgreSQL `leads` table has rows after webhook POSTs
- [ ] Check logs show `[WhatsApp]` and `[Instagram]` messages

📖 **See `WEBHOOKS.md` for detailed Postman examples and curl commands**

---

## Deployment Notes

1. **HTTPS Required:** Meta will only accept HTTPS webhook URLs in production
2. **SSL Certificate:** Use Let's Encrypt or your hosting provider's SSL
3. **Firewall:** Ensure inbound traffic on port 5000 (or your PORT) is allowed
4. **Environment:** Copy `.env.example` → `.env`, fill in real tokens
5. **Database:** Run migration: `node server/db/migrate.js`
6. **PM2 or Docker:** For production, use process manager (PM2) or Docker container

---

## Support

See `/server/WEBHOOKS.md` for:
- Detailed integration steps
- Complete Postman testing guide
- Example cURL commands
- Troubleshooting FAQ
- Database query examples
