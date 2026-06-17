# WhatsApp & Instagram Webhook Integration

This guide covers setting up and testing the Meta webhook integration for WhatsApp and Instagram.

## Environment Setup

Add these to your `/server/.env` file (copy from `.env.example`):

```env
# WhatsApp Business API (https://developers.facebook.com/docs/whatsapp/cloud-api)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=your_custom_webhook_verify_token_here

# Instagram Graph API (https://developers.facebook.com/docs/instagram/webhooks)
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_VERIFY_TOKEN=your_custom_webhook_verify_token_here
```

### Getting Your Tokens

**WhatsApp:**
1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Select your app → WhatsApp → API Setup
3. Copy the **Access Token** and **Phone Number ID**
4. Create a **Verify Token** — any string you choose (e.g., `my_webhook_secret_2024`)

**Instagram:**
1. Go to Meta App Dashboard → Instagram → API Setup
2. Copy the **Access Token**
3. Create a **Verify Token** — any string you choose

---

## Endpoints

### WhatsApp

#### Webhook Verification (Automatic)
```
GET /api/webhooks/whatsapp
?hub.mode=subscribe
&hub.verify_token=your_custom_webhook_verify_token_here
&hub.challenge=random_challenge_string
```
**Response:** Returns `hub.challenge` (or 403 if token doesn't match)

#### Receive Inbound Message
```
POST /api/webhooks/whatsapp
```
**Payload:** See example in `webhookController.js`  
**Auto-Response:** Always returns 200, then processes asynchronously  
**Action:** Creates/updates lead in `leads` table

#### Send Message
```
POST /api/whatsapp/send
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "to": "1234567890",
  "message": "Hello! Thanks for reaching out."
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [{ "input": "1234567890", "wa_id": "1234567890" }],
    "messages": [{ "id": "wamid.XXX", "message_status": "accepted" }]
  }
}
```

---

### Instagram

#### Webhook Verification (Automatic)
```
GET /api/webhooks/instagram
?hub.mode=subscribe
&hub.verify_token=your_custom_webhook_verify_token_here
&hub.challenge=random_challenge_string
```
**Response:** Returns `hub.challenge` (or 403 if token doesn't match)

#### Receive Inbound DM
```
POST /api/webhooks/instagram
```
**Payload:** See example in `webhookController.js`  
**Auto-Response:** Always returns 200, then processes asynchronously  
**Action:** Creates/updates lead in `leads` table with `instagramId` and `lastMessage`

---

## Testing with Postman

### 1. Test Webhook Verification (WhatsApp)

**Request:**
```
GET http://localhost:5000/api/webhooks/whatsapp
?hub.mode=subscribe
&hub.verify_token=my_webhook_secret_2024
&hub.challenge=test_challenge_string_12345
```

**Expected Response:**
- Status: `200 OK`
- Body: `test_challenge_string_12345` (plain text)

### 2. Test Inbound WhatsApp Message (POST)

**URL:** `POST http://localhost:5000/api/webhooks/whatsapp`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "325095375343847",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "16505551234",
              "phone_number_id": "101234567890123"
            },
            "contacts": [
              {
                "profile": {
                  "name": "John Doe"
                },
                "wa_id": "14155552671"
              }
            ],
            "messages": [
              {
                "from": "14155552671",
                "id": "wamid.HBEUGoABCDEFG123456",
                "timestamp": "1712345678",
                "text": {
                  "body": "Hi there! I'm interested in your services."
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Expected Response:**
- Status: `200 OK`
- Body: `{}` or `OK`
- **Backend:** Creates a new lead with `phone='14155552671'`, `lastMessage='Hi there! ...'`, `source='whatsapp'`

Check database:
```sql
SELECT * FROM leads WHERE phone = '14155552671';
```

### 3. Test Inbound Instagram DM (POST)

**URL:** `POST http://localhost:5000/api/webhooks/instagram`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "17841401589712345",
      "time": 1712345678,
      "messaging": [
        {
          "sender": {
            "id": "987654321987654"
          },
          "recipient": {
            "id": "17841401589712345"
          },
          "timestamp": 1712345678000,
          "message": {
            "mid": "aWdtXzEyMzQ1Njc4OTAxMjM0NTpWUngzQVktQzAxMDpST0lEOmFm",
            "text": "Love your product! Can you send me pricing?"
          }
        }
      ]
    }
  ]
}
```

**Expected Response:**
- Status: `200 OK`
- Body: `{}` or `OK`
- **Backend:** Creates a new lead with `instagramId='987654321987654'`, `lastMessage='Love your product! ...'`, `source='instagram'`

Check database:
```sql
SELECT * FROM leads WHERE instagram_id = '987654321987654';
```

### 4. Test Send WhatsApp Message

First, get a valid JWT token by logging in:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@example.com",
    "password": "your_password"
  }'
```

Copy the `token` from the response.

Then send a WhatsApp message:

```bash
curl -X POST http://localhost:5000/api/whatsapp/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "14155552671",
    "message": "Thanks for your interest! How can I help you today?"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [
      {
        "input": "14155552671",
        "wa_id": "14155552671"
      }
    ],
    "messages": [
      {
        "id": "wamid.HBEUGoABCDEFG123456",
        "message_status": "accepted"
      }
    ]
  }
}
```

---

## Meta Webhook Setup (Production)

Once you're ready to connect real webhooks in Meta:

### WhatsApp

1. Go to Meta App Dashboard → WhatsApp → Configuration
2. Under **Webhook URL**, enter: `https://yourdomain.com/api/webhooks/whatsapp`
3. Under **Verify Token**, enter the value you used in `.env` (WHATSAPP_VERIFY_TOKEN)
4. Under **Webhooks fields to subscribe to**, check:
   - `messages`
   - `message_status` (optional, for delivery confirmations)
5. Click **Verify and Save**

### Instagram

1. Go to Meta App Dashboard → Instagram → Configuration
2. Under **Webhook URL**, enter: `https://yourdomain.com/api/webhooks/instagram`
3. Under **Verify Token**, enter the value you used in `.env` (INSTAGRAM_VERIFY_TOKEN)
4. Under **Webhooks fields to subscribe to**, check:
   - `messaging` (for DMs)
5. Click **Verify and Save**

---

## Database Schema

Leads created by webhooks are stored in the `leads` table:

```sql
CREATE TABLE leads (
  id               UUID PRIMARY KEY,
  name             VARCHAR(150),          -- Sender name (if available)
  phone            VARCHAR(30),           -- WhatsApp phone number
  instagram_id     VARCHAR(80),           -- Instagram PSID
  last_message     TEXT,                  -- Most recent inbound message
  last_activity_at TIMESTAMPTZ,           -- Timestamp of last webhook event
  source           VARCHAR(80),           -- "whatsapp" or "instagram"
  stage            VARCHAR(50),           -- Pipeline stage (default: "new")
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ
);
```

### Sample Query
```sql
-- Get all leads from WhatsApp
SELECT id, name, phone, last_message, last_activity_at 
FROM leads 
WHERE source = 'whatsapp' 
ORDER BY last_activity_at DESC;
```

---

## Error Handling

### Webhook Payload Malformed

**Scenario:** Meta sends invalid JSON or unexpected structure  
**Action:** Error is logged, but **200 OK is still returned** to Meta  
**Reason:** Prevents Meta from retrying and disabling the webhook  
**Log:** Check server logs for `[WhatsApp/Instagram] Error processing webhook payload`

### Missing Tokens

**Scenario:** `.env` missing WHATSAPP_ACCESS_TOKEN or INSTAGRAM_ACCESS_TOKEN  
**Action:** `/api/whatsapp/send` will fail with 500  
**Solution:** Verify all tokens in `.env` match your Meta app settings

### Token Verification Fails

**Scenario:** Webhook verification request has wrong `hub.verify_token`  
**Action:** Endpoint returns 403 Forbidden  
**Solution:** Ensure token in `.env` matches what Meta is sending

---

## Troubleshooting

### "Webhook verification failed — token mismatch"
- Ensure `WHATSAPP_VERIFY_TOKEN` and `INSTAGRAM_VERIFY_TOKEN` in `.env` match Meta dashboard

### "Message send failed: Invalid token"
- Verify `WHATSAPP_ACCESS_TOKEN` is valid and not expired
- Check token has `whatsapp_business_messaging` permission
- Verify `WHATSAPP_PHONE_NUMBER_ID` is correct

### "Lead not appearing in database"
- Check PostgreSQL is running and `DATABASE_URL` is correct
- Run migration: `npm run migrate` (if available) or manually run `server/db/migrate.js`
- Check server logs for upsertLead errors

### "Webhook returns 200 but no lead created"
- Check that the Message type is not non-text (images, stickers, etc. are skipped by design for now)
- Check the phone/instagramId in payload matches your test data
- Review server logs with: `docker logs <container-name>` or terminal output

---

## Notes

- **Lead Deduplication:** Leads are matched by `phone` (WhatsApp) or `instagramId` (Instagram). Duplicate messages update the existing lead's `last_message` and `last_activity_at`.
- **Rate Limiting:** Meta may rate-limit your webhook if you send too many messages. Check `message_status` webhook events for delivery feedback.
- **In Production:** Use HTTPS for your webhook URL. Meta will reject insecure (HTTP) endpoints in production.
