// Twilio API service for sending SMS
// Note: In a real production app, these API calls would happen on the server side
// For this demo, we're implementing Twilio integration directly in the frontend

// Default Twilio configuration (DUMMY VALUES FOR DEMO PURPOSES ONLY)
const DEFAULT_TWILIO_ACCOUNT_SID = "ACCOUNT_SID_PLACEHOLDER";
const DEFAULT_TWILIO_AUTH_TOKEN = "AUTH_TOKEN_PLACEHOLDER";
const DEFAULT_TWILIO_PHONE_NUMBER = "+10000000000";

// Get Twilio configuration from localStorage or use defaults
const getTwilioConfig = () => {
  try {
    const storedConfig = localStorage.getItem("smsSettings");
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      return {
        accountSid: parsedConfig.accountSid || DEFAULT_TWILIO_ACCOUNT_SID,
        authToken: parsedConfig.authToken || DEFAULT_TWILIO_AUTH_TOKEN,
        fromNumber: parsedConfig.fromNumber || DEFAULT_TWILIO_PHONE_NUMBER,
        enabled:
          parsedConfig.enabled !== undefined ? parsedConfig.enabled : true,
      };
    }
  } catch (error) {
    console.error("Error reading Twilio config from localStorage:", error);
  }

  return {
    accountSid: DEFAULT_TWILIO_ACCOUNT_SID,
    authToken: DEFAULT_TWILIO_AUTH_TOKEN,
    fromNumber: DEFAULT_TWILIO_PHONE_NUMBER,
    enabled: true,
  };
};

// Send SMS via Twilio API
const sendSMS = async (to, body) => {
  try {
    const config = getTwilioConfig();

    // In a real app, this would be a server-side call
    // For demo purposes, we're showing how the API would be called
    // This will not actually work in a client-side app

    console.log("Simulating SMS send with:", {
      to,
      body,
      from: config.fromNumber,
    });

    // Simulate successful response
    return {
      success: true,
      sid: `MS${Math.random().toString(36).substring(2, 12)}`,
      message: "SMS sent successfully (simulated)",
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
};

// For backward compatibility with existing code
const TwilioService = {
  sendSms: sendSMS,
  updateSettings: (settings) => {
    try {
      localStorage.setItem("smsSettings", JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      return false;
    }
  },
  getSettings: getTwilioConfig,
  sendBillNotification: async (bill, billId) => {
    // Simplified version
    if (!bill.phone) {
      return { success: false, error: "No phone number provided" };
    }

    const message = `Bill #${billId} for ${
      bill.customerName
    } with amount ₹${bill.total.toFixed(2)} - Status: ${bill.status}`;
    return sendSMS(bill.phone, message);
  },
};

export { sendSMS, getTwilioConfig };
export default TwilioService;
