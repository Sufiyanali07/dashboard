// Declare mock data in the global scope so it persists between module reloads
// Try to load bills from localStorage first, or use default data if not available
import TwilioService from "./twilio";

// Always start with an empty array (no default bills)
let mockBills = [];

// Try to load from localStorage if available
try {
  const storedBills = localStorage.getItem("mockBills");
  if (storedBills) {
    mockBills = JSON.parse(storedBills);
  }
} catch (error) {
  console.error("Error loading bills from storage:", error);
}

// Global variables for SMS retry mechanism
let pendingSmsRetries = [];
const MAX_RETRY_ATTEMPTS = 3;

// Helper function to save bills to localStorage
const saveBillsToStorage = () => {
  localStorage.setItem("mockBills", JSON.stringify(mockBills));
  // Also save pending SMS retries
  localStorage.setItem("pendingSmsRetries", JSON.stringify(pendingSmsRetries));
};

// Helper function for adding to SMS retry queue
const addToSmsRetryQueue = (billId) => {
  const bill = mockBills.find((b) => b.id === billId);
  if (!bill) return;

  pendingSmsRetries.push({
    billId,
    phone: bill.phone,
    attempts: 1,
    lastAttempt: new Date().toISOString(),
    errorDetails: "Auto-SMS failed",
  });
  saveBillsToStorage();
};

// Helper function to simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to simulate an async response with delay
const asyncResponse = (callback) => {
  return new Promise(async (resolve, reject) => {
    try {
      await delay(800); // Simulate network delay
      const result = callback();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

// Generate a unique ID for bills
const generateId = () => {
  return mockBills.length > 0
    ? Math.max(...mockBills.map((bill) => bill.id)) + 1
    : 1;
};

// Helper function to load SMS retries from localStorage
const loadSmsRetries = () => {
  try {
    const savedRetries = localStorage.getItem("pendingSmsRetries");
    if (savedRetries) {
      pendingSmsRetries = JSON.parse(savedRetries);
      console.log("Loaded pending SMS retries:", pendingSmsRetries.length);
    }
  } catch (error) {
    console.error("Error loading SMS retries:", error);
  }
};

// Load SMS retries when the module is initialized
loadSmsRetries();

// Process any pending SMS retries
const processPendingSmsRetries = async () => {
  if (pendingSmsRetries.length === 0) return;

  console.log(`Processing ${pendingSmsRetries.length} pending SMS retries...`);

  // Take the first retry from the queue
  const retryItem = pendingSmsRetries.shift();

  try {
    console.log(
      `Retrying SMS for bill #${retryItem.billId} (Attempt ${retryItem.attempts}/${MAX_RETRY_ATTEMPTS})`
    );

    // Find the bill
    const bill = mockBills.find((b) => b.id === retryItem.billId);
    if (!bill) {
      console.error(`Cannot retry SMS: Bill #${retryItem.billId} not found`);
      return;
    }

    // Attempt to send the SMS
    await MockApiService.sendBillSMS(retryItem.billId, retryItem.phone);
    console.log(`Retry successful for bill #${retryItem.billId}`);

    // Save updated retry queue
    saveBillsToStorage();
  } catch (error) {
    console.error(`SMS retry failed for bill #${retryItem.billId}:`, error);

    // If we haven't reached max attempts, add it back to the queue
    if (retryItem.attempts < MAX_RETRY_ATTEMPTS) {
      pendingSmsRetries.push({
        ...retryItem,
        attempts: retryItem.attempts + 1,
        lastAttempt: new Date().toISOString(),
      });

      // Save updated retry queue
      saveBillsToStorage();
    } else {
      console.error(
        `Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached for bill #${retryItem.billId}`
      );
    }
  }
};

// Run the retry processor periodically (every 5 seconds)
setInterval(processPendingSmsRetries, 5000);

// Generate a receipt URL for a bill
const generateReceiptUrl = (billId, forCustomer = true) => {
  const baseUrl = window.location.origin;

  // Use the public receipt URL for customer-facing communications
  if (forCustomer) {
    return `${baseUrl}/p/receipt/${billId}`;
  }

  // Use the internal receipt URL for dashboard use
  return `${baseUrl}/receipt/${billId}`;
};

// Format the bill details for SMS with better formatting
// eslint-disable-next-line no-unused-vars
const formatSmsContent = (bill, billId, paymentLink) => {
  // Generate a properly formatted date string
  const formattedDate = new Date(bill.date).toLocaleDateString();

  // Format the currency properly
  const formattedAmount = `₹${bill.total.toFixed(2)}`;

  // Create receipt link - always use customer-facing URL for SMS
  const receiptLink = generateReceiptUrl(billId, true);

  // Generate different content based on payment status
  let statusSpecificContent = "";
  let statusEmoji = "⏳";
  let statusText = "PENDING";

  if (bill.status === "pending") {
    statusEmoji = "⏳";
    statusText = "PAYMENT PENDING";
    statusSpecificContent = `Your payment is pending.\n\n💳 Pay via UPI: 9309908454@ybl\n🔗 Pay online: ${paymentLink}\n\n📱 Payment updates via SMS`;
  } else if (bill.status === "paid") {
    statusEmoji = "✅";
    statusText = "PAYMENT COMPLETED";
    statusSpecificContent = `Thank you for your payment!\n\n🧾 View receipt: ${receiptLink}\n\nKeep this message to access your receipt anytime.`;
  } else if (bill.status === "cancelled") {
    statusEmoji = "❌";
    statusText = "CANCELLED";
    statusSpecificContent = `This bill has been cancelled. Please contact us if you have any questions.`;
  }

  // Create the full message with better emoji spacing and formatting
  return `📋 *BILL NOTIFICATION*\n\nDear ${bill.customerName},\n\nYour bill from Mammta's Food is ready!\n\n📌 Bill #${billId}\n📅 Date: ${formattedDate}\n💰 Amount: ${formattedAmount}\n🛍️ Items: ${bill.items}\n\n${statusEmoji} Status: ${statusText}\n\n${statusSpecificContent}\n\n📞 For assistance: +91 XXXXXXXXXX\n🏪 Mammta's Food`;
};

// Mock API service
const MockApiService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    console.log("MockApiService.getDashboardStats called");
    try {
      await delay(800);

      // Make sure we have the mock bills
      console.log("Mock bills available:", mockBills.length);

      // Calculate stats from bills
      const totalBills = mockBills.length;

      // Only count paid bills in total amount
      const totalAmount = mockBills
        .filter((bill) => bill.status === "paid")
        .reduce((sum, bill) => sum + bill.total, 0);

      // Calculate pending amount separately
      const pendingAmount = mockBills
        .filter((bill) => bill.status === "pending")
        .reduce((sum, bill) => sum + bill.total, 0);

      const paidBills = mockBills.filter(
        (bill) => bill.status === "paid"
      ).length;
      const pendingBills = mockBills.filter(
        (bill) => bill.status === "pending"
      ).length;

      const stats = {
        totalBills,
        totalAmount,
        pendingAmount,
        paidBills,
        pendingBills,
      };

      console.log("Returning dashboard stats:", stats);
      return stats;
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      throw error;
    }
  },

  // Get a bill by ID
  getBillById: async (billId) => {
    console.log("MockApiService.getBillById called", billId);
    return asyncResponse(() => {
      const bill = mockBills.find((b) => b.id === parseInt(billId));
      if (!bill) {
        throw new Error(`Bill #${billId} not found`);
      }
      return bill;
    });
  },

  // Get all bills
  getAllBills: async (page = 1, limit = 10) => {
    console.log("MockApiService.getAllBills called");
    try {
      await delay(800);
      console.log("Returning bills:", mockBills.length);
      return [...mockBills]; // Return a copy of the array
    } catch (error) {
      console.error("Error in getAllBills:", error);
      throw error;
    }
  },

  // Create a new bill
  createBill: (customerData, itemsData, itemsDetail = "") => {
    // Simulate API delay
    return asyncResponse(() => {
      console.log(
        "[MOCK-API] Creating bill with data:",
        JSON.stringify(customerData),
        JSON.stringify(itemsData)
      );

      try {
        // Generate a new bill ID
        const billId = generateId();
        const currentDate = new Date().toISOString();

        // Calculate total
        const total = itemsData.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );

        // Determine payment status (default to pending)
        const paymentStatus =
          customerData.paymentStatus === "paid" ? "paid" : "pending";
        const paidDate = paymentStatus === "paid" ? currentDate : null;

        // Ensure item details are properly formatted
        let formattedItemsDetail;
        if (itemsDetail && itemsDetail.trim() !== "") {
          formattedItemsDetail = itemsDetail;
        } else {
          // Create a more detailed format if itemsDetail is empty
          formattedItemsDetail = itemsData
            .map((item) => {
              const itemTotal = (item.quantity * item.price).toFixed(2);
              return `${item.name} (₹${item.price}) x ${item.quantity} = ₹${itemTotal}`;
            })
            .join(", ");
        }

        // Create the bill object with improved details
        const newBill = {
          id: billId,
          date: currentDate,
          customerName: customerData.name || "Guest Customer",
          phone: customerData.phone || "Not provided",
          items: itemsData.length,
          itemsDetail: formattedItemsDetail,
          itemsList: itemsData.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.quantity * item.price,
          })),
          total: total,
          status: paymentStatus,
          sms: {
            sent: false,
            sentAt: null,
            count: 0,
          },
          payment: {
            method:
              paymentStatus === "paid"
                ? customerData.paymentMethod || "upi"
                : null,
            paidAt: paidDate,
          },
        };

        // Save the new bill to the mock database
        mockBills.push(newBill);
        saveBillsToStorage();

        // Attempt to automatically send SMS notification
        try {
          console.log(
            `Automatically sending SMS notification for new bill #${newBill.id}`
          );
          // Call sendBillSMS but don't wait for it to complete
          MockApiService.sendBillSMS(newBill.id)
            .then((result) => {
              console.log(
                `Auto-SMS notification sent successfully for bill #${newBill.id}`
              );
            })
            .catch((error) => {
              console.error(
                `Failed to send auto-SMS notification for bill #${newBill.id}:`,
                error
              );
              // Add to retry queue if SMS failed
              addToSmsRetryQueue(newBill.id);
            });
        } catch (error) {
          console.error("Error in auto-notification:", error);
          // Add to retry queue if SMS failed
          addToSmsRetryQueue(newBill.id);
        }

        return { id: billId, success: true };
      } catch (error) {
        console.error("[MOCK-API] Error creating bill:", error);
        throw new Error("Failed to create bill. Please try again.");
      }
    });
  },

  // Delete a bill
  deleteBill: async (billId) => {
    console.log("MockApiService.deleteBill called", billId);
    try {
      await delay(500);

      // Filter out the bill with the given ID
      mockBills = mockBills.filter((bill) => bill.id !== billId);
      console.log(
        `Bill #${billId} deleted. Total bills now:`,
        mockBills.length
      );

      // Save to localStorage for persistence
      saveBillsToStorage();

      return { success: true, message: "Bill deleted successfully" };
    } catch (error) {
      console.error("Error in deleteBill:", error);
      throw error;
    }
  },

  // Send SMS for a bill
  sendBillSMS: async (billId, phone) => {
    console.log("MockApiService.sendBillSMS called", { billId, phone });
    try {
      // Validate phone number
      if (!phone || phone.trim() === "") {
        throw new Error("Cannot send SMS: Phone number is required");
      }

      console.log(
        `[MOCK-API] Processing SMS request for bill #${billId} to phone ${phone}`
      );

      // Make sure the phone is in international format
      const formattedPhone = phone.replace(/\s+/g, "");
      // Remove any non-numeric characters except for the + sign
      // eslint-disable-next-line no-useless-escape
      const cleanedPhone = formattedPhone.replace(/[^\d\+]/g, "");

      // Simple phone validation (can be expanded based on your requirements)
      // eslint-disable-next-line no-useless-escape
      const phoneRegex = /^[0-9\+\-\(\) ]{6,20}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        console.warn(
          `[MOCK-API] Phone number format may be invalid: ${cleanedPhone}`
        );
        // We'll still proceed but log a warning
      }

      // Find the bill by ID to include its details in the SMS
      const bill = mockBills.find((b) => b.id === billId);
      if (!bill) {
        throw new Error(`Bill #${billId} not found`);
      }

      console.log(`[MOCK-API] Found bill:`, JSON.stringify(bill, null, 2));

      // Ensure the bill has the phone number for Twilio service
      // The phone param is the one we want to send to, not necessarily what's stored in the bill
      const originalPhone = bill.phone;
      bill.phone = cleanedPhone;

      console.log(
        `[MOCK-API] Updated bill phone from [${originalPhone}] to [${bill.phone}]`
      );

      // Try to send WhatsApp message first if whatsAppEnabled flag is set
      try {
        // Check if WhatsApp is enabled (default to true)
        const whatsAppEnabled =
          localStorage.getItem("useWhatsApp") === null
            ? true
            : localStorage.getItem("useWhatsApp") === "true";

        if (whatsAppEnabled) {
          console.log(
            `[MOCK-API] WhatsApp messaging is enabled. Trying WhatsApp first.`
          );
          // Try to send via WhatsApp
          await MockApiService.sendWhatsAppNotification(bill, billId);

          // If we got here, WhatsApp was successful
          console.log(
            `[MOCK-API] WhatsApp notification successful for bill #${billId}`
          );

          // Update the bill to mark WhatsApp as sent
          const billIndex = mockBills.findIndex((b) => b.id === billId);
          if (billIndex >= 0) {
            mockBills[billIndex] = {
              ...mockBills[billIndex],
              whatsAppSent: true,
              whatsAppTimestamp: new Date().toISOString(),
              messageCount: (mockBills[billIndex].messageCount || 0) + 1,
            };
            // Save to localStorage for persistence
            saveBillsToStorage();
            console.log(
              `[MOCK-API] Updated bill record to reflect WhatsApp sent`
            );
          }

          // Return WhatsApp success response
          return {
            success: true,
            method: "whatsapp",
            timestamp: new Date().toISOString(),
            recipient: bill.phone,
            billId: billId,
          };
        }
      } catch (whatsAppError) {
        console.error(
          `[MOCK-API] WhatsApp notification failed: ${whatsAppError.message}. Falling back to SMS.`
        );
        // Continue to SMS method as fallback
      }

      // Send SMS using Twilio service as fallback
      console.log(
        `[MOCK-API] Sending SMS via Twilio to ${cleanedPhone} for bill #${billId}`
      );
      const twilioResponse = await TwilioService.sendBillNotification(
        bill,
        billId
      );
      console.log("[MOCK-API] Twilio response:", twilioResponse);

      // Update the bill to mark SMS as sent
      const billIndex = mockBills.findIndex((b) => b.id === billId);
      if (billIndex >= 0) {
        mockBills[billIndex] = {
          ...mockBills[billIndex],
          smsSent: true,
          smsTimestamp: new Date().toISOString(),
          smsCount: (mockBills[billIndex].smsCount || 0) + 1,
          lastMessageContent: twilioResponse.smsContent, // Store the last message sent
          twilioSid: twilioResponse.twilioResponse.sid, // Store Twilio message SID
        };
        // Save to localStorage for persistence
        saveBillsToStorage();
        console.log(`[MOCK-API] Updated bill record to reflect SMS sent`);
      }

      return twilioResponse;
    } catch (error) {
      console.error("Error in sendBillSMS:", error);

      // Even if there's an error, try to mark the SMS as needing retry
      try {
        pendingSmsRetries.push({
          billId,
          phone,
          attempts: 1,
          lastAttempt: new Date().toISOString(),
          errorDetails: error.message,
        });
        saveBillsToStorage();
      } catch (storageError) {
        console.error("Failed to save retry information:", storageError);
      }

      throw error;
    }
  },

  // Send bill notification via WhatsApp
  sendWhatsAppNotification: async (bill, billId) => {
    try {
      // Validate phone number
      if (!bill.phone) {
        throw new Error("No phone number available for WhatsApp");
      }

      // Format phone number for WhatsApp (remove any non-digit characters except +)
      let phoneNumber = bill.phone.replace(/[^\d+]/g, "");

      // Ensure phone number has country code
      if (!phoneNumber.startsWith("+")) {
        // Default to India country code
        phoneNumber = "+91" + phoneNumber;
      }

      // Remove any plus sign as WhatsApp API doesn't need it
      phoneNumber = phoneNumber.replace("+", "");

      // Get store information
      const storeName = localStorage.getItem("storeName") || "Mammta Fabrics";

      // Format the bill amount for readability
      const formattedTotal = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(bill.totalAmount);

      // Create different messages based on payment status
      let message = "";

      // Create a receipt or payment link based on bill status
      const baseUrl = window.location.origin;
      const receiptLink = `${baseUrl}/p/receipt/${billId}`;

      if (bill.status === "pending") {
        message = `*${storeName}*: Your bill #${billId} for ${formattedTotal} is ready.\n\n`;
        message += `Pay using PhonePe UPI: 9309908454@ybl\n\n`;
        message += `View or pay your bill: ${receiptLink}`;
      } else {
        message = `*${storeName}*: Thank you for your payment of ${formattedTotal} for bill #${billId}.\n\n`;
        message += `View your receipt: ${receiptLink}`;
      }

      // Add list of items
      if (bill.items && bill.items.length > 0) {
        message += "\n\n*Items:*\n";
        bill.items.forEach((item, index) => {
          message += `${index + 1}. ${item.name}: ${item.quantity} x ₹${
            item.price
          } = ₹${item.quantity * item.price}\n`;
        });
      }

      // Add footer with timestamp
      const date = new Date();
      message += `\n\nGenerated on: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;
      console.log("[MOCK API] WhatsApp URL:", whatsappUrl);

      // Check if this is a mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      // On mobile, store the current page URL in session storage to return after WhatsApp
      if (isMobile) {
        sessionStorage.setItem("returnToPage", window.location.href);
        window.location.href = whatsappUrl;
        return {
          success: true,
          method: "whatsapp-mobile",
          message: "Redirecting to WhatsApp app",
        };
      } else {
        // On desktop, open in a new window
        window.open(whatsappUrl, "_blank");
        return {
          success: true,
          method: "whatsapp-desktop",
          message: "WhatsApp message opened in new window",
        };
      }
    } catch (error) {
      console.error("[MOCK API] WhatsApp notification error:", error);
      throw new Error(`WhatsApp notification failed: ${error.message}`);
    }
  },

  // Clear all bills and reset the dashboard
  clearAllBills: async () => {
    console.log("MockApiService.clearAllBills called");
    try {
      await delay(500);

      // Clear bills array
      mockBills = [];
      pendingSmsRetries = [];

      // Save to localStorage for persistence
      saveBillsToStorage();

      console.log("All bills cleared successfully");
      return { success: true, message: "All bills cleared successfully" };
    } catch (error) {
      console.error("Error clearing bills:", error);
      throw error;
    }
  },

  // Reset the system - force clear all bills and localStorage
  resetSystem: () => {
    console.log("MockApiService.resetSystem called - forcing system reset");

    // Clear bills arrays
    mockBills = [];
    pendingSmsRetries = [];

    // Clear localStorage
    localStorage.removeItem("mockBills");
    localStorage.removeItem("pendingSmsRetries");

    console.log("System reset completed - all bills and data cleared");
    return { success: true, message: "System reset completed" };
  },

  // Mark a bill as paid (for UPI or QR code payments)
  markBillAsPaid: async (billId) => {
    console.log(`MockApiService.markBillAsPaid called for bill #${billId}`);
    try {
      await delay(500);

      // Find the bill index
      const billIndex = mockBills.findIndex((bill) => bill.id === billId);

      if (billIndex === -1) {
        throw new Error(`Bill #${billId} not found`);
      }

      // Check if bill is already paid
      if (mockBills[billIndex].status === "paid") {
        return {
          success: false,
          message: "Bill is already marked as paid",
          receiptUrl: generateReceiptUrl(billId, true),
        };
      }

      // Check if bill is cancelled
      if (mockBills[billIndex].status === "cancelled") {
        return {
          success: false,
          message: "Cannot mark a cancelled bill as paid",
        };
      }

      // Get the current date
      const paidDate = new Date().toISOString();

      // Update the bill status to paid
      mockBills[billIndex] = {
        ...mockBills[billIndex],
        status: "paid",
        paidDate: paidDate,
        paymentMethod: "upi",
      };

      // Save to localStorage for persistence
      saveBillsToStorage();

      console.log(`Bill #${billId} marked as paid`);

      // Generate receipt URL
      const receiptUrl = generateReceiptUrl(billId, true);

      return {
        success: true,
        message: `Bill #${billId} has been marked as paid`,
        bill: mockBills[billIndex],
        receiptUrl: receiptUrl,
      };
    } catch (error) {
      console.error(`Error marking bill #${billId} as paid:`, error);
      throw error;
    }
  },

  // Get receipt data for a bill
  getReceiptData: async (billId) => {
    console.log(`MockApiService.getReceiptData called for bill #${billId}`);
    try {
      await delay(300);

      // Find the bill
      const bill = mockBills.find((bill) => bill.id === billId);

      if (!bill) {
        throw new Error(`Bill #${billId} not found`);
      }

      // Check if bill is paid
      if (bill.status !== "paid") {
        return {
          success: false,
          message: "Cannot generate receipt for unpaid bill",
          bill: bill,
        };
      }

      // Return receipt data
      return {
        success: true,
        receiptData: {
          id: billId,
          customerName: bill.customerName,
          date: bill.date,
          paidDate: bill.paidDate || new Date().toISOString(),
          items: bill.itemsDetail,
          total: bill.total,
          paymentMethod: bill.paymentMethod || "upi",
          receiptNumber: `R-${billId}-${Math.floor(Math.random() * 1000)}`,
        },
      };
    } catch (error) {
      console.error(`Error getting receipt data for bill #${billId}:`, error);
      throw error;
    }
  },
};

// Log that the mockApi module has been loaded
console.log("MockApiService module loaded, bills:", mockBills.length);

// Add a test function for sending SMS
MockApiService.testSendSMS = async (phoneNumber) => {
  console.log("[TEST] Testing message sending to:", phoneNumber);

  // Create a test bill
  const testBill = {
    id: 9999,
    customerName: "Test Customer",
    phone: phoneNumber,
    date: new Date().toISOString().split("T")[0],
    total: 199.99,
    items: 2,
    itemsDetail: "Test Item 1 x1 - ₹99.99, Test Item 2 x1 - ₹100.00",
    status: "pending",
  };

  console.log("[TEST] Created test bill:", testBill);

  // Check if WhatsApp is enabled
  const useWhatsApp =
    localStorage.getItem("useWhatsApp") === null
      ? true
      : localStorage.getItem("useWhatsApp") === "true";

  try {
    let result;

    if (useWhatsApp) {
      // Try WhatsApp first
      console.log("[TEST] Using WhatsApp for message delivery");
      result = await MockApiService.sendWhatsAppNotification(
        testBill,
        testBill.id
      );
      console.log("[TEST] WhatsApp notification sent successfully:", result);
    } else {
      // Fall back to SMS
      console.log("[TEST] Using SMS for message delivery");
      result = await TwilioService.sendBillNotification(testBill, testBill.id);
      console.log("[TEST] SMS sent successfully:", result);
    }

    return {
      success: true,
      message: useWhatsApp
        ? "WhatsApp notification opened"
        : "Test SMS sent successfully",
      details: result,
    };
  } catch (error) {
    console.error("[TEST] Failed to send message:", error);
    return {
      success: false,
      message: "Failed to send message",
      error: error.message,
    };
  }
};

export default MockApiService;
