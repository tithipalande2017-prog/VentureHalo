import dotenv from "dotenv";
dotenv.config();

export async function generateZoomMeeting() {
  // Prevent execution if environment variables are missing
  if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET || !process.env.ZOOM_ACCOUNT_ID) {
    throw new Error("Missing Zoom API credentials in environment variables.");
  }

  const authHeader = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  try {
    // 1. Get access token
    const tokenResponse = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Zoom Auth Failed (${tokenResponse.status}): ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const access_token = tokenData.access_token;

    // 2. Create meeting
    const meetingResponse = await fetch(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: "Website Generated Meeting",
          type: 1, // Instant meeting
          settings: {
            join_before_host: true,
          },
        }),
      }
    );

    if (!meetingResponse.ok) {
      const errorText = await meetingResponse.text();
      throw new Error(`Zoom Meeting Creation Failed (${meetingResponse.status}): ${errorText}`);
    }

    const meetingData = await meetingResponse.json();

    // Returns the URL, or falls back to meeting ID if you just need the code
    return {
      joinUrl: meetingData.join_url,
      meetingId: meetingData.id,
      password: meetingData.password
    };

  } catch (error) {
    console.error("Zoom API Error:", error.message);
    return null; // Return null so your frontend knows the creation failed
  }
}