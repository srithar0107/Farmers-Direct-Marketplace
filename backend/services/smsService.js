const Notification = require("../models/Notification");

/**
 * Send an SMS or queue/simulate if provider credentials are not yet configured.
 *
 * Supported providers:
 * 1. Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 * 2. Fast2SMS (FAST2SMS_API_KEY)
 */
async function sendSmsAlert({ farmer, product, alertType, title, message, phone }) {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;

  let smsStatus = "PENDING_PROVIDER";
  let smsProvider = "In-App Only (Credentials Not Configured)";

  // Check if a recent alert of the same type for this product was already generated
  // within the last 12 hours to prevent duplicate spam
  if (product && product._id) {
    const existingRecent = await Notification.findOne({
      farmer: farmer._id || farmer,
      product: product._id,
      alertType,
      createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    });
    if (existingRecent) {
      console.log(`[ALERT] Skipped duplicate ${alertType} notification for product ${product.name}`);
      return existingRecent;
    }
  }

  const recipientPhone = phone || farmer.phone || "";

  // Attempt real Twilio dispatch if credentials provided
  if (twilioSid && twilioAuth && twilioFrom && recipientPhone) {
    try {
      // Dynamic import to avoid crash if optional twilio package is not installed
      const twilio = require("twilio");
      const client = twilio(twilioSid, twilioAuth);
      await client.messages.create({
        body: message,
        from: twilioFrom,
        to: recipientPhone.startsWith("+") ? recipientPhone : `+91${recipientPhone}`
      });
      smsStatus = "SENT";
      smsProvider = "Twilio";
      console.log(`[SMS DISPATCHED] Twilio sent to ${recipientPhone}: "${message}"`);
    } catch (err) {
      console.error("[SMS ERROR] Twilio dispatch failed:", err.message);
      smsStatus = "FAILED";
      smsProvider = "Twilio";
    }
  } else if (fast2SmsKey && recipientPhone) {
    try {
      const axios = require("axios");
      await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
          route: "q",
          message: message,
          language: "english",
          flash: 0,
          numbers: recipientPhone.replace(/\D/g, "")
        },
        { headers: { authorization: fast2SmsKey } }
      );
      smsStatus = "SENT";
      smsProvider = "Fast2SMS";
      console.log(`[SMS DISPATCHED] Fast2SMS sent to ${recipientPhone}: "${message}"`);
    } catch (err) {
      console.error("[SMS ERROR] Fast2SMS dispatch failed:", err.message);
      smsStatus = "FAILED";
      smsProvider = "Fast2SMS";
    }
  } else {
    // Graceful in-app fallback when external SMS keys are not yet configured in .env
    smsStatus = "PENDING_PROVIDER";
    smsProvider = "In-App (SMS Provider Keys Needed in .env)";
    console.log("--------------------------------------------------");
    console.log(`📱 [SIMULATED SMS / IN-APP ALERT]`);
    console.log(`To: ${recipientPhone || "Farmer Mobile"}`);
    console.log(`Type: ${alertType.toUpperCase()}`);
    console.log(`Message: "${message}"`);
    console.log(`Status: Logged to MongoDB Notification collection.`);
    console.log(`Note: To enable live carrier SMS delivery, add TWILIO or FAST2SMS keys to backend/.env`);
    console.log("--------------------------------------------------");
  }

  // Persist record to MongoDB Notification collection
  try {
    const record = await Notification.create({
      farmer: farmer._id || farmer,
      product: product ? product._id : undefined,
      alertType,
      title,
      message,
      phone: recipientPhone,
      smsStatus,
      smsProvider,
      read: false
    });
    return record;
  } catch (dbErr) {
    console.error("[ALERT DB ERROR] Could not save notification:", dbErr.message);
    return null;
  }
}

module.exports = {
  sendSmsAlert
};
