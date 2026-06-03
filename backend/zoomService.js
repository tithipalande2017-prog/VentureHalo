const path = require("path");
const dotenv = require("dotenv");

// Load the root .env file securely from one directory up
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Communicates with the Zoom API using Server-to-Server OAuth to generate a new meeting.
 * @returns {Promise<Object>} Success/error payload with joinUrl, meetingId, and password.
 */
async function generateZoomMeeting() {
  console.log("[Zoom] Checking environment variables...");
  const hasClientId = !!process.env.ZOOM_CLIENT_ID;
  const hasClientSecret = !!process.env.ZOOM_CLIENT_SECRET;
  const hasAccountId = !!process.env.ZOOM_ACCOUNT_ID;
  
  console.log("[Zoom] Environment variable status:");
  console.log("  - ZOOM_CLIENT_ID:", hasClientId ? "DETECTED" : "MISSING");
  console.log("  - ZOOM_CLIENT_SECRET:", hasClientSecret ? "DETECTED" : "MISSING");
  console.log("  - ZOOM_ACCOUNT_ID:", hasAccountId ? "DETECTED" : "MISSING");

  if (!hasClientId || !hasClientSecret || !hasAccountId) {
    return {
      success: false,
      message: "Zoom authentication failed: Missing Zoom API credentials in server environment variables."
    };
  }

  const authHeader = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  try {
    // 1. Get access token
    console.log("[Zoom] Requesting access token from https://zoom.us/oauth/token");
    const tokenResponse = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    console.log("[Zoom] Access token response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Zoom] Access token request failed. Status:", tokenResponse.status);
      console.error("[Zoom] Error response body:", errorText);
      return {
        success: false,
        message: `Zoom access token not generated: OAuth token request failed (${tokenResponse.status}): ${errorText}`
      };
    }

    const tokenData = await tokenResponse.json();
    const access_token = tokenData.access_token;

    if (!access_token) {
      console.error("[Zoom] Access token not present in response");
      console.error("[Zoom] Token response data:", JSON.stringify(tokenData));
      return {
        success: false,
        message: "Zoom access token not generated: Token was not present in the authorization response."
      };
    }

    console.log("[Zoom] Access token generated successfully");

    // 2. Create meeting
    const meetingRequestBody = {
      topic: "Website Generated Meeting",
      type: 1, // Instant meeting
      settings: {
        join_before_host: true,
      },
    };

    console.log("[Zoom] Creating meeting at https://api.zoom.us/v2/users/me/meetings");
    console.log("[Zoom] Request payload:", JSON.stringify(meetingRequestBody));
    console.log("[Zoom] Using bearer token (first 10 chars):", access_token.substring(0, 10) + "...");

    const meetingResponse = await fetch(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingRequestBody),
      }
    );

    console.log("[Zoom] Meeting creation response status:", meetingResponse.status);

    if (!meetingResponse.ok) {
      const errorText = await meetingResponse.text();
      console.error("[Zoom] Meeting creation failed. Status:", meetingResponse.status);
      console.error("[Zoom] Error response body:", errorText);
      return {
        success: false,
        message: `Zoom meeting creation failed: API call failed (${meetingResponse.status}): ${errorText}`
      };
    }

    const meetingData = await meetingResponse.json();
    console.log("[Zoom] Meeting creation response body:", JSON.stringify(meetingData));

    if (!meetingData || !meetingData.join_url) {
      console.error("[Zoom] Meeting response missing join_url");
      console.error("[Zoom] Meeting data:", JSON.stringify(meetingData));
      return {
        success: false,
        message: "Zoom meeting creation failed: Response did not return a valid join URL."
      };
    }

    console.log("[Zoom] Meeting created successfully");
    console.log("[Zoom] Meeting ID:", meetingData.id);
    console.log("[Zoom] Join URL:", meetingData.join_url);
    console.log("[Zoom] Password:", meetingData.password ? "PRESENT" : "MISSING");

    return {
      success: true,
      joinUrl: meetingData.join_url,
      meetingId: meetingData.id,
      password: meetingData.password || ""
    };

  } catch (error) {
    console.error("[Zoom] Unexpected error during Zoom meeting generation:", error);
    console.error("[Zoom] Error stack:", error.stack);
    return {
      success: false,
      message: `Zoom meeting generation failed: Unexpected error - ${error.message}`
    };
  }
}

module.exports = {
  generateZoomMeeting
};
