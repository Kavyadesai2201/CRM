// /server/controllers/whatsappController.js
import axios from "axios";

const GRAPH_URL = "https://graph.facebook.com/v19.0";

export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

export const handleWebhook = (req, res) => {
  const body = req.body;
  if (body.object === "whatsapp_business_account") {
    body.entry?.forEach((entry) => {
      entry.changes?.forEach((change) => {
        const messages = change.value?.messages;
        if (messages) console.log("[WhatsApp] Incoming:", JSON.stringify(messages));
      });
    });
    return res.sendStatus(200);
  }
  res.sendStatus(404);
};

export const sendMessage = async (req, res) => {
  const { to, message } = req.body;
  try {
    const { data } = await axios.post(
      `${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to, type: "text", text: { body: message } },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};
