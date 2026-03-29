import axios from "axios";

/**
 * SMS Service - Abstraction for SMS providers
 * Currently supports: Fast2SMS, MSG91
 * Can be extended for other providers
 */

const SMS_PROVIDER = process.env.SMS_PROVIDER || "fast2sms";
const SMS_API_KEY = process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY;
const SMS_BASE_URL = process.env.SMS_BASE_URL;

/**
 * Send SMS using Fast2SMS provider
 * @param {string} phone - 10-digit phone number
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendViaFast2SMS = async (phone, otp) => {
  try {
    if (!SMS_API_KEY) {
      throw new Error("FAST2SMS_API_KEY not configured");
    }

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp,
        route: "otp",
        numbers: phone,
      },
      {
        headers: {
          authorization: SMS_API_KEY,
        },
      }
    );

    if (response.data?.return) {
      console.log(`[Fast2SMS] ✅ OTP sent to ${phone}. Request ID: ${response.data.request_id}`);
      return {
        success: true,
        messageId: response.data.request_id,
      };
    } else {
      console.error(`[Fast2SMS] ❌ Failed - ${response.data?.message}`);
      return {
        success: false,
        error: response.data?.message || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error(`[Fast2SMS] ❌ ERROR: ${error.response?.data?.message || error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send SMS using MSG91 provider
 * @param {string} phone - 10-digit phone number
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendViaMSG91 = async (phone, message) => {
  try {
    if (!SMS_API_KEY) {
      throw new Error("MSG91 API Key not configured");
    }

    const baseUrl = SMS_BASE_URL || "https://api.msg91.com/apiv5/flow";

    const response = await axios.post(
      `${baseUrl}`,
      {
        mobile: `91${phone}`,
        flowId: process.env.MSG91_FLOW_ID,
        var1: message,
      },
      {
        headers: {
          authkey: SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      return {
        success: true,
        messageId: response.data.request_id,
      };
    } else {
      return {
        success: false,
        error: response.data?.message || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error("MSG91 Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fallback/Mock SMS service for development
 * Use when SMS provider is in development mode
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to send
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
const sendViaMock = async (phone, otp) => {
  // In production, log this or store for testing
  console.log(`[MOCK SMS] Sending OTP "${otp}" to ${phone}`);
  
  return {
    success: true,
    messageId: `mock_${Date.now()}`,
  };
};

/**
 * Send OTP SMS - Main function
 * Routes to appropriate provider based on configuration
 * @param {string} phone - 10-digit phone number
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendOTPSMS = async (phone, otp) => {
  if (!phone || !otp) {
    return {
      success: false,
      error: "Phone and OTP are required",
    };
  }

  const message = `Your OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;

  if (process.env.NODE_ENV === "development" || !SMS_API_KEY) {
    console.warn(
      "SMS_API_KEY not configured or in development mode. Using mock sender."
    );
    return sendViaMock(phone, otp);
  }

  switch (SMS_PROVIDER.toLowerCase()) {
    case "msg91":
      return sendViaMSG91(phone, message);

    case "fast2sms":
    default:
      return sendViaFast2SMS(phone, message);
  }
};

/**
 * Send generic SMS - Can be used for other messages
 * @param {string} phone - 10-digit phone number
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendSMS = async (phone, message) => {
  if (!phone || !message) {
    return {
      success: false,
      error: "Phone and message are required",
    };
  }

  if (process.env.NODE_ENV === "development" || !SMS_API_KEY) {
    console.log(`[MOCK SMS] ${message} to ${phone}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }

  switch (SMS_PROVIDER.toLowerCase()) {
    case "msg91":
      return sendViaMSG91(phone, message);

    case "fast2sms":
    default:
      return sendViaFast2SMS(phone, message);
  }
};
