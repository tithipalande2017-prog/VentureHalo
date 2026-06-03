var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

// Check if app is already initialized to prevent duplicate app errors
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log("[Firebase Admin] App initialized successfully");
  console.log("[Firebase Admin] Project ID:", serviceAccount.project_id);
  console.log("[Firebase Admin] Service Account Email:", serviceAccount.client_email);
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
