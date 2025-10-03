// const functions = require('@google-cloud/functions-framework');
// const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
// const vision = require('@google-cloud/vision');
// const admin = require('firebase-admin');
// const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;

// // Initialize Firebase Admin SDK
// admin.initializeApp();
// const db = admin.firestore();

// // Initialize AI clients
// const docaiClient = new DocumentProcessorServiceClient();
// const visionClient = new vision.ImageAnnotatorClient();
// const predictionClient = new PredictionServiceClient();

// // Configuration - replace with your values
// const PROJECT_ID = 'merchant-onboard-hackathon';
// const DOC_PROCESSOR_NAME = `projects/${PROJECT_ID}/locations/us/processors/YOUR_PROCESSOR_ID`;
// const VERTEX_ENDPOINT = `projects/${PROJECT_ID}/locations/us-central1/endpoints/YOUR_ENDPOINT_ID`;

// // Helper functions for text extraction
// function extractPan(text) {
//   const match = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
//   return match ? match[0] : null;
// }

// function extractGst(text) {
//   const match = text.match(/\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d/);
//   return match ? match[0] : null;
// }

// function validatePan(pan) {
//   return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan || '');
// }

// function validateGst(gst) {
//   return /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d$/.test(gst || '');
// }

// // Risk score calculation (before Vertex AI integration)
// function calculateInitialRiskScore(data) {
//   let score = 50; // Default medium risk
  
//   // Lower risk if valid docs
//   if (data.panValid) score -= 15;
//   if (data.gstValid) score -= 10;
//   if (data.selfieStatus === 'face_verified') score -= 15;
  
//   // Increase risk for issues
//   if (data.duplicatePan) score += 30;
  
//   return Math.max(0, Math.min(100, score));
// }

// // Register the Cloud Event function with the Functions Framework
// functions.cloudEvent('processUpload', async (cloudEvent) => {
//   // Extract Storage event details from the Cloud Event
//   const event = cloudEvent.data;
//   const filePath = event.name;
//   const bucket = event.bucket;
//   const gcsUri = `gs://${bucket}/${filePath}`;
  
//   console.log(`Processing file: ${gcsUri}`);
  
//   try {
//     // Extract merchantId from filename pattern: uploads/merchantId_timestamp_filename
//     const pathParts = filePath.split('/');
//     const filenameParts = pathParts[1] ? pathParts[1].split('_') : [];
//     const merchantId = filenameParts[0];
    
//     if (!merchantId) {
//       console.error('Cannot extract merchantId from filename', filePath);
//       return;
//     }
    
//     // Base metadata to store
//     const metadata = {
//       file: filePath,
//       gcsUri,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     };
    
//     // Process based on file type (selfie vs document)
//     const isSelfie = filePath.toLowerCase().includes('selfie');
    
//     if (isSelfie) {
//       // Vision API for face detection in selfie
//       const [result] = await visionClient.faceDetection(gcsUri);
//       const faces = result.faceAnnotations || [];
      
//       metadata.type = 'SELFIE';
//       metadata.facesDetected = faces.length;
//       metadata.faceConfidences = faces.map(f => f.detectionConfidence);
//       metadata.selfieStatus = faces.length > 0 ? 'face_verified' : 'face_not_found';
      
//       // Update Firestore with selfie results
//       await db.collection('merchants').doc(merchantId).set(metadata, { merge: true });
//       console.log(`Selfie processed for merchant: ${merchantId}`);
//     } else {
//       // Document AI for document processing
//       const [result] = await docaiClient.processDocument({
//         name: DOC_PROCESSOR_NAME,
//         rawDocument: {
//           gcsDocument: {
//             gcsUri,
//             mimeType: 'application/pdf', // Adjust based on file type
//           },
//         },
//       });
      
//       const text = result.document?.text || '';
      
//       // Extract information using regex patterns
//       const panNumber = extractPan(text);
//       const gstNumber = extractGst(text);
      
//       metadata.type = 'DOCUMENT';
//       metadata.extractedText = text;
//       metadata.panNumber = panNumber;
//       metadata.gstNumber = gstNumber;
//       metadata.panValid = validatePan(panNumber);
//       metadata.gstValid = validateGst(gstNumber);
      
//       // Check for duplicate PAN numbers (fraud indicator)
//       if (panNumber) {
//         const duplicateCheck = await db.collection('merchants')
//           .where('panNumber', '==', panNumber)
//           .where('merchantId', '!=', merchantId)
//           .get();
        
//         metadata.duplicatePan = !duplicateCheck.empty;
//       }
      
//       // Update Firestore with document results
//       await db.collection('merchants').doc(merchantId).set(metadata, { merge: true });
//       console.log(`Document processed for merchant: ${merchantId}`);
//     }
    
//     // After processing, calculate overall merchant status
//     const merchantDoc = await db.collection('merchants').doc(merchantId).get();
//     const merchantData = merchantDoc.data() || {};
    
//     // Risk calculation logic (baseline)
//     const initialRiskScore = calculateInitialRiskScore(merchantData);
    
//     // Call Vertex AI if available (we'll implement later)
//     let finalRiskScore = initialRiskScore;
//     let status = 'processing';
    
//     // Decision logic
//     if (finalRiskScore < 30) {
//       status = 'approved';
//     } else if (finalRiskScore > 70) {
//       status = 'rejected';
//     } else {
//       status = 'review';
//     }
    
//     // Update final status
//     await db.collection('merchants').doc(merchantId).set({
//       status,
//       riskScore: finalRiskScore,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     }, { merge: true });
    
//     console.log(`Merchant ${merchantId} status updated to: ${status} (Risk: ${finalRiskScore})`);
//   } catch (error) {
//     console.error('Error processing file:', error);
//   }
// });

const functions = require('firebase-functions');
const vision = require('@google-cloud/vision');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const visionClient = new vision.ImageAnnotatorClient();

// Configuration
const PROJECT_ID = 'merchant-onboard-hackathon';

// This function triggers when a new file is uploaded to storage
exports.processUpload = functions.storage.object().onFinalize(async (object) => {
  // Skip if this is a folder or deletion
  if (object.contentType === 'application/x-www-form-urlencoded;charset=UTF-8' || !object.name) {
    console.log('Skipping folder or deleted file');
    return null;
  }
  
  // Check if this is a document we should process (in uploads folder)
  if (!object.name.startsWith('uploads/')) {
    console.log('Not a document upload, skipping');
    return null;
  }
  
  try {
    // Extract merchant ID and document type from filename
    // Format: uploads/[merchantId]_[timestamp]_[documentType]
    const nameParts = object.name.split('/')[1].split('_');
    if (nameParts.length < 3) {
      console.log('Invalid filename format, skipping');
      return null;
    }
    
    const merchantId = nameParts[0];
    const documentType = nameParts[2];
    
    console.log(`Processing ${documentType} document for merchant ${merchantId}`);
    
    // Process document with Vision API
    const results = await analyzeDocument(object.bucket, object.name, documentType);
    
    // Update Firestore with results
    const merchantRef = db.collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();
    
    if (!merchantDoc.exists) {
      // Create new merchant record
      await merchantRef.set({
        merchantId,
        status: 'pending',
        documents: {
          [documentType]: {
            path: object.name,
            status: results.verified ? 'approved' : 'pending',
            verificationNotes: results.notes,
            extractedData: results.extractedData,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing merchant
      const updateData = {};
      updateData[`documents.${documentType}`] = {
        path: object.name,
        status: results.verified ? 'approved' : 'pending',
        verificationNotes: results.notes,
        extractedData: results.extractedData,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      updateData['updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
      
      await merchantRef.update(updateData);
    }
    
    // Update merchant status
    await updateMerchantStatus(merchantId);
    
    return null;
  } catch (error) {
    console.error('Error processing document:', error);
    return null;
  }
});

// This function analyzes a document using Cloud Vision API
async function analyzeDocument(bucketName, filePath, documentType) {
  const gcsUri = `gs://${bucketName}/${filePath}`;
  
  // Default response
  const result = {
    verified: false,
    notes: 'Document requires manual verification.',
    extractedData: {}
  };
  
  if (documentType === 'selfie') {
    // Detect faces in selfie
    const [faceResult] = await visionClient.faceDetection(gcsUri);
    const faces = faceResult.faceAnnotations || [];
    
    if (faces.length === 1) {
      result.verified = true;
      result.notes = 'Face detected successfully.';
      
      // Extract face detection confidence
      result.extractedData.faceConfidence = faces[0].detectionConfidence;
      result.extractedData.rightEyeOpen = faces[0].rightEyeOpen;
      result.extractedData.leftEyeOpen = faces[0].leftEyeOpen;
    } else if (faces.length > 1) {
      result.verified = false;
      result.notes = 'Multiple faces detected in selfie.';
    } else {
      result.verified = false;
      result.notes = 'No face detected in selfie.';
    }
  } else {
    // Get text from document
    const [textResult] = await visionClient.textDetection(gcsUri);
    const fullText = textResult.fullTextAnnotation?.text || '';
    result.extractedData.fullText = fullText;
    
    // Document-specific verification logic
    if (documentType === 'pan') {
      // Verify PAN Card (format: ABCDE1234F)
      const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
      const panMatches = fullText.match(panRegex);
      
      if (panMatches && panMatches.length > 0) {
        result.verified = true;
        result.notes = 'PAN number detected and verified.';
        result.extractedData.panNumber = panMatches[0];
        
        // Try to extract name (common format on PAN cards)
        const nameRegex = /Name\s*[:\s]\s*([A-Z\s]+)/i;
        const nameMatch = fullText.match(nameRegex);
        if (nameMatch && nameMatch[1]) {
          result.extractedData.name = nameMatch[1].trim();
        }
      }
    } 
    else if (documentType === 'gst') {
      // Verify GST Certificate (format: 22AAAAA0000A1Z5)
      const gstRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[Z]{1}[0-9A-Z]{1}/g;
      const gstMatches = fullText.match(gstRegex);
      
      if (gstMatches && gstMatches.length > 0) {
        result.verified = true;
        result.notes = 'GST number detected and verified.';
        result.extractedData.gstNumber = gstMatches[0];
      }
    }
    else if (documentType === 'bank') {
      // Look for account number patterns
      const accountRegex = /[Aa]ccount\s*[Nn]o[.:]?\s*([0-9\s]{8,20})/;
      const accountMatch = fullText.match(accountRegex);
      
      // Look for IFSC code
      const ifscRegex = /IFSC\s*[:]?\s*([A-Z]{4}[0]\d{6})/;
      const ifscMatch = fullText.match(ifscRegex);
      
      if (accountMatch || ifscMatch) {
        result.verified = true;
        result.notes = 'Bank details detected.';
        
        if (accountMatch && accountMatch[1]) {
          result.extractedData.accountNumber = accountMatch[1].replace(/\s/g, '');
        }
        
        if (ifscMatch && ifscMatch[1]) {
          result.extractedData.ifscCode = ifscMatch[1];
        }
      }
    }
  }
  
  return result;
}

// Update merchant status based on document verification
async function updateMerchantStatus(merchantId) {
  const merchantRef = db.collection('merchants').doc(merchantId);
  const merchant = await merchantRef.get();
  
  if (!merchant.exists) return;
  
  const data = merchant.data();
  const documents = data.documents || {};
  
  // Required documents
  const requiredDocs = ['selfie', 'pan'];
  
  // Check if all required documents are verified
  const allVerified = requiredDocs.every(docType => 
    documents[docType] && documents[docType].status === 'approved'
  );
  
  if (allVerified) {
    await merchantRef.update({
      status: 'approved',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

// This function sends notifications when verification status changes
exports.sendVerificationNotification = functions.firestore
  .document('merchants/{merchantId}')
  .onUpdate((change, context) => {
    const merchantId = context.params.merchantId;
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Check if status changed
    if (newData.status !== oldData.status) {
      console.log(`Status changed for merchant ${merchantId}: ${oldData.status} -> ${newData.status}`);
      
      // Here you would implement notification logic (email, SMS, etc.)
      // For now, just log the change
    }
    
    return null;
  });