const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load the root .env file from one directory up
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("[Venture Halo Backend] Starting server setup...");

// 1. Initialize Firebase Admin SDK securely with credential loading checks
let admin, db;
try {
  const firebaseAdmin = require("./firebaseAdmin.js");
  admin = firebaseAdmin.admin;
  db = firebaseAdmin.db;
  console.log("[Venture Halo Backend] Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("\n========================================================");
  console.error("CRITICAL ERROR: Failed to initialize Firebase Admin SDK!");
  console.error("Please ensure environment variables are set:");
  console.error("  - FIREBASE_PROJECT_ID");
  console.error("  - FIREBASE_CLIENT_EMAIL");
  console.error("  - FIREBASE_PRIVATE_KEY");
  console.error("Error details:", error.stack || error.message);
  console.error("========================================================\n");
  process.exit(1); // Graceful termination on invalid credentials
}
const { generateZoomMeeting } = require("./zoomService.js");

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middlewares
app.use(cors({
  origin: '*', // Allow all origins for development and Render deployment
  credentials: true
}));
app.use(express.json());

// Global timeout middleware (60 seconds)
app.use((req, res, next) => {
  res.setTimeout(60000, () => {
    console.error('[Server] Request timeout:', req.method, req.url);
    res.status(504).json({
      success: false,
      message: 'Request timeout - server took too long to respond'
    });
  });
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Server] HIT: ${req.method} ${req.url}`);
  console.log(`[Server] Query params:`, req.query);
  console.log(`[Server] Body:`, req.body);
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[Server] RESPONSE: ${res.statusCode}`, data);
    originalSend.call(this, data);
  };
  
  next();
});

// API Endpoints

// Health check route
app.get("/health", (req, res) => {
  console.log("[Health] Health check requested");
  res.status(200).send("OK");
});

// A. POST /api/create-meeting
app.post("/api/create-meeting", async (req, res) => {
  console.log("[Route] POST /create-meeting");
  try {
    const { title, time, participants, uid, founderId, investorId, timezone } = req.body;

    if (!title || !time || !participants || !uid) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'title', 'time', 'participants', and 'uid' are all required."
      });
    }

    // Step 1: Create Zoom Meeting link
    console.log("[Server] Step 1: Generating Zoom meeting link...");
    const zoomResult = await generateZoomMeeting();
    if (!zoomResult || !zoomResult.success) {
      console.error("[Server] Zoom meeting generation failed:", zoomResult?.message);
      return res.status(502).json({
        success: false,
        message: zoomResult?.message || "Failed to generate meeting link through Zoom API."
      });
    }

    console.log("[Server] Zoom meeting generated successfully");
    console.log("[Server] Join URL:", zoomResult.joinUrl);
    console.log("[Server] Meeting ID:", zoomResult.meetingId);
    console.log("[Server] Password:", zoomResult.password ? "PRESENT" : "MISSING");

    // Step 2: Assemble Firestore document structure with standardized UTC time
    const meetingDoc = {
      title,
      participants,
      time: new Date(time).toISOString(), // UTC standard ISO string
      joinUrl: zoomResult.joinUrl,
      meetingId: String(zoomResult.meetingId),
      createdBy: uid,
      founderId: founderId || uid, // Default to createdBy if not provided
      investorId: investorId || null, // Will be set by investor when they schedule
      timezone: timezone || 'UTC', // Store timezone for scheduling
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Step 3: Write to Firestore only after Zoom meeting creation success
    console.log("[Server] Step 2: Saving meeting to Firestore...");
    console.log("[Firestore] Document structure:", {
      title: meetingDoc.title,
      participants: meetingDoc.participants,
      time: meetingDoc.time,
      joinUrl: meetingDoc.joinUrl,
      meetingId: meetingDoc.meetingId,
      createdBy: meetingDoc.createdBy,
      founderId: meetingDoc.founderId,
      investorId: meetingDoc.investorId
    });

    let docRef;
    try {
      docRef = await db.collection("meetings").add(meetingDoc);
      console.log("[Firestore] Meeting saved successfully with ID:", docRef.id);
    } catch (firestoreError) {
      console.error("[Firestore] Failed to save meeting:", firestoreError);
      return res.status(500).json({
        success: false,
        message: `Firestore save failed: ${firestoreError.message}`
      });
    }
    
    // Return the meeting data directly without fetching to avoid NOT_FOUND errors
    // The document is already saved, we just need the ID
    const responseData = {
      id: docRef.id,
      ...meetingDoc
    };

    return res.status(201).json({
      success: true,
      meeting: responseData
    });

  } catch (error) {
    console.error("Endpoint Error (/create-meeting):", error);
    return res.status(500).json({
      success: false,
      message: `Server-side error during meeting generation: ${error.message}`
    });
  }
});

// B. GET /api/meetings
app.get("/api/meetings", async (req, res) => {
  console.log("[Route] GET /meetings");
  try {
    console.log("[Meetings] Loading meetings...");
    const { uid, role } = req.query;
    
    console.log("[Meetings] Query parameters:");
    console.log("  - uid:", uid);
    console.log("  - role:", role);
    
    if (!uid) {
      console.error("[Meetings] Missing uid parameter");
      return res.status(400).json({
        success: false,
        message: "Missing required query parameter: 'uid' is required to fetch meetings."
      });
    }

    if (!role || (role !== 'founder' && role !== 'investor')) {
      console.error("[Meetings] Invalid or missing role parameter:", role);
      return res.status(400).json({
        success: false,
        message: "Invalid or missing 'role' parameter. Must be either 'founder' or 'investor'."
      });
    }

    // Query collection based on role
    // Founder: query where founderId == uid
    // Investor: query where investorId == uid
    console.log("[Meetings] Determining query strategy based on role:", role);
    let queryField;
    let queryDescription;
    if (role === 'founder') {
      queryField = "founderId";
      queryDescription = "Founder meetings (founderId == uid)";
    } else if (role === 'investor') {
      queryField = "investorId";
      queryDescription = "Investor meetings (investorId == uid)";
    }
    
    console.log("[Meetings] Query strategy:", queryDescription);
    console.log("[Meetings] Query field:", queryField);
    console.log("[Meetings] Query value:", uid);
    console.log("[Meetings] NOTE: If query returns no results, the field", queryField, "may not exist in Firestore documents");
    
    let snapshot;
    try {
      console.log("[Firestore] Executing query on 'meetings' collection...");
      console.log("[Firestore] Query: where(", queryField, "==", uid, ")");
      snapshot = await db.collection("meetings").where(queryField, "==", uid).get();
      console.log("[Firestore] Query successful, found", snapshot.size, "meetings");
    } catch (queryError) {
      console.error("[Firestore] Query error:", queryError);
      console.error("[Firestore] Error details:", {
        message: queryError.message,
        code: queryError.code,
        stack: queryError.stack
      });
      // If collection doesn't exist or query fails, return empty array
      return res.status(200).json({
        success: true,
        meetings: []
      });
    }
    
    console.log("[Meetings] Processing", snapshot.size, "meeting documents");
    const meetings = [];
    snapshot.forEach((doc) => {
      try {
        const data = doc.data();
        
        if (!data) {
          console.warn("[Meetings] Document", doc.id, "has no data, skipping");
          return;
        }

        console.log("[Meetings] Processing document:", doc.id);
        console.log("[Meetings] Document fields:", Object.keys(data));
        
        // Convert Firestore Timestamp to serializable string
        if (data.createdAt && typeof data.createdAt.toDate === "function") {
          data.createdAt = data.createdAt.toDate().toISOString();
        }
        
        // Validate required fields
        if (!data.time) {
          console.warn("[Meetings] Document", doc.id, "missing 'time' field");
        }
        if (!data.title) {
          console.warn("[Meetings] Document", doc.id, "missing 'title' field");
        }
        
        meetings.push({
          id: doc.id,
          ...data
        });
      } catch (docError) {
        console.error("[Meetings] Error processing document:", doc.id, docError);
      }
    });

    console.log("[Meetings] Successfully processed", meetings.length, "meetings");

    // Chronologically sort in Node (ascending: earliest first)
    try {
      meetings.sort((a, b) => new Date(a.time) - new Date(b.time));
      console.log("[Meetings] Meetings sorted chronologically");
    } catch (sortError) {
      console.error("[Meetings] Error sorting meetings:", sortError);
      // Continue without sorting if it fails
    }

    console.log("[Meetings] Returning", meetings.length, "meetings to client");
    return res.status(200).json({
      success: true,
      meetings
    });

  } catch (error) {
    console.error("[Meetings] Endpoint Error (/meetings):", error);
    console.error("[Meetings] Error stack:", error.stack);
    console.error("[Meetings] Error details:", {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return res.status(500).json({
      success: false,
      message: `Server-side error during meetings query: ${error.message}`
    });
  }
});

// D. GET /api/notifications
app.get("/api/notifications", async (req, res) => {
  console.log("[Route] GET /notifications");
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameter: 'uid' is required to fetch notifications."
      });
    }

    console.log("[Notifications] Querying notifications for uid:", uid);
    let snapshot;
    try {
      snapshot = await db.collection("notifications").where("recipientId", "==", uid).get();
      console.log("[Notifications] Query successful, found", snapshot.size, "notifications");
    } catch (queryError) {
      console.error("[Notifications] Query error:", queryError);
      return res.status(200).json({
        success: true,
        notifications: []
      });
    }
    
    const notifications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to serializable string
      if (data.createdAt && typeof data.createdAt.toDate === "function") {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      
      notifications.push({
        id: doc.id,
        ...data
      });
    });

    // Sort by createdAt descending (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error("Endpoint Error (/notifications):", error);
    return res.status(500).json({
      success: false,
      message: `Server-side error during notifications query: ${error.message}`
    });
  }
});

// E. POST /api/mark-notification-read
app.post("/api/mark-notification-read", async (req, res) => {
  console.log("[Route] POST /mark-notification-read");
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: 'notificationId'."
      });
    }

    console.log("[Notifications] Marking notification as read:", notificationId);

    await db.collection("notifications").doc(notificationId).update({
      read: true
    });

    console.log("[Notifications] Notification marked as read successfully");

    return res.status(200).json({
      success: true,
      message: "Notification marked as read."
    });

  } catch (error) {
    console.error("Endpoint Error (/mark-notification-read):", error);
    return res.status(500).json({
      success: false,
      message: `Server-side error marking notification as read: ${error.message}`
    });
  }
});

// C. POST /api/reschedule-meeting
app.post("/api/reschedule-meeting", async (req, res) => {
  console.log("[Route] POST /reschedule-meeting");
  try {
    const { meetingId, uid, newTime, rescheduleMessage } = req.body;

    console.log("[Reschedule] Reschedule payload:", { meetingId, uid, newTime, rescheduleMessage });

    if (!meetingId || !uid || !newTime) {
      console.error("[Reschedule] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'meetingId', 'uid', and 'newTime' are required."
      });
    }

    console.log("[Reschedule] Attempting to reschedule meeting:", meetingId, "by user:", uid);

    // Fetch the meeting document
    const meetingDoc = await db.collection("meetings").doc(meetingId).get();
    
    if (!meetingDoc.exists) {
      console.error("[Reschedule] Meeting not found:", meetingId);
      return res.status(404).json({
        success: false,
        message: "Meeting not found."
      });
    }

    const meetingData = meetingDoc.data();
    console.log("[Reschedule] Current meeting data:", {
      title: meetingData.title,
      time: meetingData.time,
      joinUrl: meetingData.joinUrl ? "PRESENT" : "MISSING",
      meetingId: meetingData.meetingId
    });

    // Security check: only allow rescheduling by founder or investor
    const isFounder = meetingData.founderId === uid;
    const isInvestor = meetingData.investorId === uid;
    
    if (!isFounder && !isInvestor) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reschedule this meeting."
      });
    }

    // Validate new time is in the future
    const newDateTime = new Date(newTime);
    const now = new Date();
    if (newDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "New meeting time must be in the future."
      });
    }

    // Store old time for notification
    const oldTime = meetingData.time;

    // Update meeting with new time and reschedule info
    // NOTE: We are NOT updating joinUrl or meetingId - Zoom link remains unchanged
    console.log("[Reschedule] Updating meeting in Firestore...");
    console.log("[Reschedule] Update payload:", {
      time: newTime,
      rescheduled: true,
      rescheduledBy: uid,
      rescheduleMessage: rescheduleMessage || ""
    });
    console.log("[Reschedule] Preserving Zoom link:", meetingData.joinUrl ? "YES" : "NO");
    
    await db.collection("meetings").doc(meetingId).update({
      time: newTime,
      rescheduled: true,
      rescheduledBy: uid,
      rescheduledAt: admin.firestore.FieldValue.serverTimestamp(),
      rescheduleMessage: rescheduleMessage || ""
    });

    console.log("[Reschedule] Meeting rescheduled successfully:", meetingId);
    console.log("[Reschedule] Zoom link preserved:", meetingData.joinUrl ? "YES" : "NO");

    // Create notification for the other participant
    try {
      // Determine the recipient (the other participant)
      const recipientId = isFounder ? meetingData.investorId : meetingData.founderId;
      
      if (recipientId) {
        const notificationDoc = {
          type: "meeting_rescheduled",
          recipientId: recipientId,
          senderId: uid,
          meetingId: meetingId,
          meetingTitle: meetingData.title,
          oldDate: oldTime,
          newDate: newTime,
          rescheduleMessage: rescheduleMessage || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        };

        await db.collection("notifications").add(notificationDoc);
        console.log("[Reschedule] Notification created successfully for recipient:", recipientId);
      }
    } catch (notificationError) {
      console.error("[Reschedule] Failed to create notification:", notificationError);
      // Don't fail the rescheduling if notification creation fails
    }

    return res.status(200).json({
      success: true,
      message: "Meeting rescheduled successfully."
    });

  } catch (error) {
    console.error("Endpoint Error (/reschedule-meeting):", error);
    return res.status(500).json({
      success: false,
      message: `Server-side error during meeting rescheduling: ${error.message}`
    });
  }
});

// D. POST /api/cancel-meeting
app.post("/api/cancel-meeting", async (req, res) => {
  console.log("[Route] POST /cancel-meeting");
  try {
    const { meetingId, uid, cancellationMessage } = req.body;

    if (!meetingId || !uid) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'meetingId' and 'uid' are required."
      });
    }

    console.log("[Cancel] Attempting to cancel meeting:", meetingId, "by user:", uid);

    // Fetch the meeting document
    const meetingDoc = await db.collection("meetings").doc(meetingId).get();
    
    if (!meetingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found."
      });
    }

    const meetingData = meetingDoc.data();

    // Security check: only allow cancellation by founder or investor
    const isFounder = meetingData.founderId === uid;
    const isInvestor = meetingData.investorId === uid;
    
    if (!isFounder && !isInvestor) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to cancel this meeting."
      });
    }

    // Update meeting status to cancelled
    await db.collection("meetings").doc(meetingId).update({
      status: "cancelled",
      cancelledBy: uid,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancellationMessage: cancellationMessage || ""
    });

    console.log("[Cancel] Meeting cancelled successfully:", meetingId);

    // Create notification for the other participant
    try {
      // Determine the recipient (the other participant)
      const recipientId = isFounder ? meetingData.investorId : meetingData.founderId;
      
      if (recipientId) {
        const notificationDoc = {
          type: "meeting_cancelled",
          recipientId: recipientId,
          senderId: uid,
          meetingId: meetingId,
          meetingTitle: meetingData.title,
          meetingDate: meetingData.time,
          cancellationMessage: cancellationMessage || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        };

        await db.collection("notifications").add(notificationDoc);
        console.log("[Cancel] Notification created successfully for recipient:", recipientId);
      }
    } catch (notificationError) {
      console.error("[Cancel] Failed to create notification:", notificationError);
      // Don't fail the cancellation if notification creation fails
    }

    return res.status(200).json({
      success: true,
      message: "Meeting cancelled successfully."
    });

  } catch (error) {
    console.error("Endpoint Error (/cancel-meeting):", error);
    return res.status(500).json({
      success: false,
      message: `Server-side error during meeting cancellation: ${error.message}`
    });
  }
});

// Unhandled Promise/Exception handling
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: `Unexpected internal server error: ${err.message}`
  });
});

app.listen(PORT, () => {
  console.log(`[Venture Halo Server] Running on http://localhost:${PORT}`);
});
