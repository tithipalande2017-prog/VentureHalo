var admin = require("firebase-admin");

// Check if app is already initialized to prevent duplicate app errors
if (!admin.apps.length) {
  // Validate required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("[Firebase Admin] CRITICAL ERROR: Missing required environment variables");
    console.error("[Firebase Admin] Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    console.error("[Firebase Admin] Current status:");
    console.error("  - FIREBASE_PROJECT_ID:", projectId ? "SET" : "MISSING");
    console.error("  - FIREBASE_CLIENT_EMAIL:", clientEmail ? "SET" : "MISSING");
    console.error("  - FIREBASE_PRIVATE_KEY:", privateKey ? "SET" : "MISSING");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
  console.log("[Firebase Admin] App initialized successfully");
  console.log("[Firebase Admin] Project ID:", projectId);
  console.log("[Firebase Admin] Service Account Email:", clientEmail);
} else {
  console.log("[Firebase Admin] App already initialized, using existing instance");
}

const db = admin.firestore();
// Try to explicitly set the database ID to "(default)"
try {
  db.settings({
    ignoreUndefinedProperties: true
  });
  console.log("[Firebase Admin] Firestore settings configured");
} catch (e) {
  console.log("[Firebase Admin] Could not set Firestore settings:", e.message);
}
console.log("[Firebase Admin] Firestore instance created");

module.exports = { admin, db };
