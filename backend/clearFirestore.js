const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function clearCollection(collectionName) {
  console.log(`[Clear] Starting to clear collection: ${collectionName}`);
  
  const snapshot = await db.collection(collectionName).get();
  const batchSize = snapshot.size;
  
  if (batchSize === 0) {
    console.log(`[Clear] Collection ${collectionName} is already empty`);
    return 0;
  }
  
  console.log(`[Clear] Found ${batchSize} documents in ${collectionName}`);
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`[Clear] Successfully deleted ${batchSize} documents from ${collectionName}`);
  return batchSize;
}

async function clearAllData() {
  console.log("========================================");
  console.log("CLEARING ALL FIRESTORE DATA");
  console.log("========================================");
  
  const collections = ['meetings', 'notifications', 'users'];
  let totalDeleted = 0;
  
  for (const collection of collections) {
    try {
      const deleted = await clearCollection(collection);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`[Error] Failed to clear ${collection}:`, error.message);
    }
  }
  
  console.log("========================================");
  console.log(`TOTAL DOCUMENTS DELETED: ${totalDeleted}`);
  console.log("========================================");
  console.log("All Firestore data has been cleared.");
  
  process.exit(0);
}

clearAllData().catch((error) => {
  console.error("[Fatal Error] Failed to clear Firestore:", error);
  process.exit(1);
});
