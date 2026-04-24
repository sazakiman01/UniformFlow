const admin = require("firebase-admin");

// Load service account key
const serviceAccount = require("../uniformflow-ee6df-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createAdminUser() {
  const uid = "Xz04AomxqkW4MD3V6xnwdZDi2DE2";
  const email = "sazakiman01@gmail.com";

  try {
    const docRef = db.collection("users").doc(uid);
    await docRef.set({
      email,
      role: "admin",
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Admin user created successfully!");
    console.log(`   UID: ${uid}`);
    console.log(`   Email: ${email}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
