import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = admin.initializeApp();

// Example: Cloud Function to create order
export const createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { customerId, items, totalAmount } = data;

  try {
    const orderRef = await admin.firestore().collection("orders").add({
      customerId,
      items,
      totalAmount,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, orderId: orderRef.id };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Example: Cloud Function to update production status
export const updateProductionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { orderId, status, notes } = data;

  try {
    await admin.firestore().collection("production").doc(orderId).update({
      status,
      notes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Example: Trigger on order creation
export const onOrderCreated = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    // Create production record
    await admin.firestore().collection("production").add({
      orderId: context.params.orderId,
      status: "pending",
      assignedTo: null,
      estimatedCompletion: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
