#!/bin/bash
# Quick Start: WhatsApp & Instagram Webhook Integration
# ──────────────────────────────────────────────────────

# 1. Install dependencies
npm install

# 2. Copy environment template
cp server/.env.example server/.env

# 3. Edit server/.env and fill in:
# WHATSAPP_ACCESS_TOKEN=<get from Meta Dashboard>
# WHATSAPP_PHONE_NUMBER_ID=<get from Meta Dashboard>
# WHATSAPP_VERIFY_TOKEN=<create any secure string>
# INSTAGRAM_ACCESS_TOKEN=<get from Meta Dashboard>
# INSTAGRAM_VERIFY_TOKEN=<create any secure string>
# DATABASE_URL=postgresql://user:password@localhost:5432/crm_db

# 4. Run database migration
node server/db/migrate.js

# 5. Start the server
npm run start:server

# 6. Test webhook verification (in another terminal)
# Replace tokens with actual values from .env
curl "http://localhost:5000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"

# Expected response: test123

# 7. Test inbound message (POST)
curl -X POST http://localhost:5000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {"phone_number_id": "123"},
          "contacts": [{"profile": {"name": "John"}, "wa_id": "14155552671"}],
          "messages": [{
            "from": "14155552671",
            "id": "msg1",
            "timestamp": "1712345678",
            "text": {"body": "Hi there!"},
            "type": "text"
          }]
        }
      }]
    }]
  }'

# Expected response: 200 OK

# 8. Check database
psql $DATABASE_URL -c "SELECT id, phone, last_message, source FROM leads LIMIT 5;"

# 📖 For detailed setup, see:
# - server/WEBHOOKS.md (comprehensive testing guide)
# - server/WEBHOOK_INTEGRATION_SUMMARY.md (architecture overview)
