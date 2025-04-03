import React, { useState, useEffect } from "react";
import TwilioService from "../services/twilio";

const SmsSettings = () => {
  // Load settings from localStorage, or use defaults
  const [twilioSettings, setTwilioSettings] = useState(() => {
    return TwilioService.getSettings();
  });

  // State for WhatsApp setting
  const [useWhatsApp, setUseWhatsApp] = useState(() => {
    return localStorage.getItem("useWhatsApp") === null
      ? true
      : localStorage.getItem("useWhatsApp") === "true";
  });

  // Default settings - in a real app, these would come from a secure backend
  const defaultSettings = {
    enabled: true,
    provider: "twilio",
    sendOnCreate: true,
    sendOnStatusChange: true,
    accountSid: "AC_PLACEHOLDER_ACCOUNT_SID",
    authToken: "auth_token_placeholder",
    fromNumber: "+10000000000",
    smsTemplate: "default",
    promptTemplate: false,
  };

  // Pre-fill with the provided credentials if empty
  useEffect(() => {
    if (!twilioSettings.accountSid) {
      setTwilioSettings((prev) => ({
        ...prev,
        accountSid: defaultSettings.accountSid,
        authToken: defaultSettings.authToken,
        fromNumber: defaultSettings.fromNumber,
      }));
    }
  }, [twilioSettings.accountSid, defaultSettings]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTwilioSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle WhatsApp toggle change
  const handleWhatsAppChange = (e) => {
    const newValue = e.target.checked;
    setUseWhatsApp(newValue);
    localStorage.setItem("useWhatsApp", newValue);
  };

  // Save settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Validate SID format
      if (
        twilioSettings.accountSid &&
        !twilioSettings.accountSid.startsWith("AC")
      ) {
        setError("Twilio Account SID must start with 'AC'");
        setIsSubmitting(false);
        return;
      }

      // Validate phone number format
      if (
        twilioSettings.fromNumber &&
        !twilioSettings.fromNumber.startsWith("+")
      ) {
        setError(
          "Phone number must start with '+' and country code (e.g., +1 for US)"
        );
        setIsSubmitting(false);
        return;
      }

      // Save settings using Twilio service
      TwilioService.updateSettings(twilioSettings);

      // Display success message
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(`Failed to save settings: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto my-4">
      <h2 className="text-2xl font-semibold mb-4">SMS Settings</h2>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <p className="text-blue-700">
          Configure your Twilio credentials to enable SMS notifications for
          bills.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <p className="text-green-700">Settings saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSaveSettings}>
        {/* WhatsApp toggle */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useWhatsApp"
              checked={useWhatsApp}
              onChange={handleWhatsAppChange}
              className="mr-2 h-5 w-5 text-blue-600"
            />
            <label
              htmlFor="useWhatsApp"
              className="text-yellow-700 font-medium"
            >
              Use WhatsApp for notifications instead of SMS
            </label>
          </div>
          <p className="text-yellow-600 mt-2 text-sm">
            When enabled, bill notifications will be sent via WhatsApp instead
            of SMS. This may be more reliable in browser environments.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="accountSid">
            Twilio Account SID
          </label>
          <input
            type="text"
            id="accountSid"
            name="accountSid"
            value={twilioSettings.accountSid || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="AC_PLACEHOLDER_ACCOUNT_SID"
          />
          <p className="text-sm text-gray-500 mt-1">
            Starts with 'AC' and can be found in your Twilio dashboard
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="authToken">
            Twilio Auth Token
          </label>
          <input
            type="password"
            id="authToken"
            name="authToken"
            value={twilioSettings.authToken || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your Twilio Auth Token"
          />
          <p className="text-sm text-gray-500 mt-1">
            Find this in your Twilio dashboard
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="fromNumber">
            Twilio Phone Number
          </label>
          <input
            type="text"
            id="fromNumber"
            name="fromNumber"
            value={twilioSettings.fromNumber || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1234567890"
          />
          <p className="text-sm text-gray-500 mt-1">
            Must include country code with + (e.g., +1 for US)
          </p>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              id="enableSms"
              name="enableSms"
              checked={twilioSettings.enableSms}
              onChange={handleInputChange}
              className="mr-2 h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Enable SMS Notifications</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          SMS Templates
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Here's a preview of how SMS messages will look to your customers:
        </p>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 whitespace-pre-line text-sm mb-4">
          <strong>Pending Bill SMS Template:</strong>
          <div className="mt-2 bg-white p-3 rounded border border-gray-200">
            📋 BILL NOTIFICATION
            <br />
            <br />
            Dear [Customer Name],
            <br />
            <br />
            Your bill from Mammtas Food is ready!
            <br />
            <br />
            📌 Bill #123
            <br />
            📆 Date: 2023-05-01
            <br />
            🛒 Items:
            <br />
            Product A x2 - ₹200.00
            <br />
            Product B x1 - ₹150.00
            <br />
            💰 Total Amount: ₹350.00
            <br />
            📊 Status: PENDING
            <br />
            <br />
            Your payment is pending.
            <br />
            <br />
            📱 Pay via UPI: 9309908454@ybl
            <br />
            <br />
            Note: Updates will be sent via SMS
            <br />
            <br />
            📞 For assistance: +91 XXXXXXXXXX
            <br />
            💼 Mammtas Food
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsSettings;
