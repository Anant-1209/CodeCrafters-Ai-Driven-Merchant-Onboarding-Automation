// firestore.js
const admin = require('firebase-admin');
const serviceAccount = require('./merchant-onboard-hackathon-f834662bdf49.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Merchant collection reference
const merchantsCollection = db.collection('merchants');

// Create a new merchant
async function createMerchant(merchantId, data) {
  const merchantRef = merchantsCollection.doc(merchantId);
  await merchantRef.set({
    merchantId,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...data
  });
  return merchantRef;
}

// Get a merchant by ID
async function getMerchant(merchantId) {
  const merchantRef = merchantsCollection.doc(merchantId);
  const doc = await merchantRef.get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() };
}

// Update a merchant
async function updateMerchant(merchantId, data) {
  const merchantRef = merchantsCollection.doc(merchantId);
  await merchantRef.update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return merchantRef;
}

// Add or update a document for a merchant
async function updateMerchantDocument(merchantId, documentType, data) {
  const merchantRef = merchantsCollection.doc(merchantId);
  const updateData = {};
  updateData[`documents.${documentType}`] = {
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await merchantRef.update(updateData);
  return merchantRef;
}

// Get all merchants
async function getAllMerchants() {
  const snapshot = await merchantsCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update merchant status
async function updateMerchantStatus(merchantId, status) {
  const merchantRef = merchantsCollection.doc(merchantId);
  await merchantRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return merchantRef;
}

module.exports = {
  db,
  createMerchant,
  getMerchant,
  updateMerchant,
  updateMerchantDocument,
  getAllMerchants,
  updateMerchantStatus
};