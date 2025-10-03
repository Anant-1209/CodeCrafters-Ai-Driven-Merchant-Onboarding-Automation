// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { Storage } = require('@google-cloud/storage');
// const vision = require('@google-cloud/vision');
// const visionClient = new vision.ImageAnnotatorClient();
// const admin = require('firebase-admin');
// const db = admin.firestore();
// const app = express();
// app.use(cors());
// app.use(express.json());

// const projectId = process.env.GCLOUD_PROJECT;
// const bucketName = process.env.BUCKET_NAME;
// const storage = new Storage({ projectId });
// const bucket = storage.bucket(bucketName);




// // API endpoint to generate signed URLs for secure uploads
// app.get('/api/signed-url', async (req, res) => {
//   try {
//     const { filename, contentType = 'application/octet-stream', merchantId } = req.query;
//     if (!filename || !merchantId) {
//       return res.status(400).json({ error: 'filename & merchantId required' });
//     }

//     // Create object name with merchantId prefix for correlation
//     const objectName = `uploads/${merchantId}_${Date.now()}_${filename}`;
//     const file = bucket.file(objectName);

//     // Generate signed URL with 15-minute expiration
//     const [url] = await file.getSignedUrl({
//       version: 'v4',
//       action: 'write',
//       expires: Date.now() + 15 * 60 * 1000, // 15 minutes
//       contentType,
//     });

//     res.json({ url, objectName });
//   } catch (err) {
//     console.error('Error generating signed URL:', err);
//     res.status(500).json({ error: 'Failed to generate signed URL' });
//   }
// });

// // API endpoint to check merchant onboarding status
// app.get('/api/merchant/:merchantId/status', async (req, res) => {
//   try {
//     // This would typically check Firestore for merchant status
//     // For now, return a placeholder response
//     res.json({ 
//       status: 'processing',
//       message: 'Documents under review'
//     });
//   } catch (err) {
//     console.error('Error checking status:', err);
//     res.status(500).json({ error: 'Failed to check status' });
//   }
// });



// // Process document after upload
// app.post('/api/process-document', async (req, res) => {
//   try {
//     const { merchantId, documentType, filePath, bucketName } = req.body;
    
//     // Process the document using Vision API
//     const results = await analyzeDocument(bucketName, filePath, documentType);
    
//     // Store results in Firestore
//     const merchantRef = db.collection('merchants').doc(merchantId);
//     const merchantDoc = await merchantRef.get();
    
//     if (!merchantDoc.exists) {
//       await merchantRef.set({
//         merchantId,
//         status: 'pending',
//         documents: {
//           [documentType]: {
//             path: filePath,
//             status: results.verified ? 'approved' : 'pending',
//             verificationNotes: results.notes,
//             extractedData: results.extractedData,
//             uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//             verifiedAt: admin.firestore.FieldValue.serverTimestamp()
//           }
//         },
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       });
//     } else {
//       // Update existing merchant
//       const updateData = {};
//       updateData[`documents.${documentType}`] = {
//         path: filePath,
//         status: results.verified ? 'approved' : 'pending',
//         verificationNotes: results.notes,
//         extractedData: results.extractedData,
//         uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//         verifiedAt: admin.firestore.FieldValue.serverTimestamp()
//       };
//       updateData['updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
      
//       await merchantRef.update(updateData);
//     }
    
//     // Check if all documents are verified and update merchant status
//     await updateMerchantStatus(merchantId);
    
//     res.json({ 
//       success: true, 
//       verified: results.verified,
//       notes: results.notes,
//       extractedData: results.extractedData
//     });
//   } catch (error) {
//     console.error('Error processing document:', error);
//     res.status(500).json({ error: 'Failed to process document' });
//   }
// });

// // Analyze document using Cloud Vision API
// async function analyzeDocument(bucketName, filePath, documentType) {
//   const gcsUri = `gs://${bucketName}/${filePath}`;
  
//   // Get text from document
//   const [textResult] = await visionClient.textDetection(gcsUri);
//   const fullText = textResult.fullTextAnnotation?.text || '';
  
//   // Default response
//   const result = {
//     verified: false,
//     notes: 'Document requires manual verification.',
//     extractedData: { fullText }
//   };
  
//   // Document-specific verification logic
//   if (documentType === 'pan') {
//     // Verify PAN Card (format: ABCDE1234F)
//     const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
//     const panMatches = fullText.match(panRegex);
    
//     if (panMatches && panMatches.length > 0) {
//       result.verified = true;
//       result.notes = 'PAN number detected and verified.';
//       result.extractedData.panNumber = panMatches[0];
      
//       // Try to extract name (common format on PAN cards)
//       const nameRegex = /Name\s*[:\s]\s*([A-Z\s]+)/i;
//       const nameMatch = fullText.match(nameRegex);
//       if (nameMatch && nameMatch[1]) {
//         result.extractedData.name = nameMatch[1].trim();
//       }
//     }
//   } 
//   else if (documentType === 'gst') {
//     // Verify GST Certificate (format: 22AAAAA0000A1Z5)
//     const gstRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[Z]{1}[0-9A-Z]{1}/g;
//     const gstMatches = fullText.match(gstRegex);
    
//     if (gstMatches && gstMatches.length > 0) {
//       result.verified = true;
//       result.notes = 'GST number detected and verified.';
//       result.extractedData.gstNumber = gstMatches[0];
//     }
//   }
//   else if (documentType === 'bank') {
//     // Look for account number patterns
//     const accountRegex = /[Aa]ccount\s*[Nn]o[.:]?\s*([0-9\s]{8,20})/;
//     const accountMatch = fullText.match(accountRegex);
    
//     // Look for IFSC code
//     const ifscRegex = /IFSC\s*[:]?\s*([A-Z]{4}[0]\d{6})/;
//     const ifscMatch = fullText.match(ifscRegex);
    
//     if (accountMatch || ifscMatch) {
//       result.verified = true;
//       result.notes = 'Bank details detected.';
      
//       if (accountMatch && accountMatch[1]) {
//         result.extractedData.accountNumber = accountMatch[1].replace(/\s/g, '');
//       }
      
//       if (ifscMatch && ifscMatch[1]) {
//         result.extractedData.ifscCode = ifscMatch[1];
//       }
//     }
//   }
//   else if (documentType === 'selfie') {
//     // Detect faces in selfie
//     const [faceResult] = await visionClient.faceDetection(gcsUri);
//     const faces = faceResult.faceAnnotations || [];
    
//     if (faces.length === 1) {
//       result.verified = true;
//       result.notes = 'Face detected successfully.';
      
//       // Extract face detection confidence
//       result.extractedData.faceConfidence = faces[0].detectionConfidence;
//       // Check if eyes are open, smiling, etc.
//       result.extractedData.rightEyeOpen = faces[0].rightEyeOpen;
//       result.extractedData.leftEyeOpen = faces[0].leftEyeOpen;
//     } else if (faces.length > 1) {
//       result.verified = false;
//       result.notes = 'Multiple faces detected in selfie.';
//     } else {
//       result.verified = false;
//       result.notes = 'No face detected in selfie.';
//     }
//   }
  
//   return result;
// }

// // Update overall merchant status based on document verification
// async function updateMerchantStatus(merchantId) {
//   const merchantRef = db.collection('merchants').doc(merchantId);
//   const merchant = await merchantRef.get();
  
//   if (!merchant.exists) return;
  
//   const data = merchant.data();
//   const documents = data.documents || {};
  
//   // Required documents
//   const requiredDocs = ['selfie', 'pan'];
  
//   // Check if all required documents are verified
//   const allVerified = requiredDocs.every(docType => 
//     documents[docType] && documents[docType].status === 'approved'
//   );
  
//   if (allVerified) {
//     await merchantRef.update({
//       status: 'approved',
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     });
//   }
// }

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
// Add this to the top of your index.js if not already there
// Update your Firebase Admin initialization to be more explicit

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { Storage } = require('@google-cloud/storage');
// const vision = require('@google-cloud/vision');
// const admin = require('firebase-admin');

// // Simplified Firebase Admin initialization
// const serviceAccount = require('./merchant-onboard-hackathon-f834662bdf49.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });


// const db = admin.firestore();
// const visionClient = new vision.ImageAnnotatorClient();
// const app = express();
// app.use(cors());
// app.use(express.json());

// const projectId = process.env.GCLOUD_PROJECT;
// const bucketName = process.env.BUCKET_NAME;
// const storage = new Storage({ projectId });
// const bucket = storage.bucket(bucketName);






// // API endpoint to generate signed URLs for secure uploads
// app.get('/api/signed-url', async (req, res) => {
//   try {
//     const { filename, contentType = 'application/octet-stream', merchantId } = req.query;
//     if (!filename || !merchantId) {
//       return res.status(400).json({ error: 'filename & merchantId required' });
//     }

//     // Create object name with merchantId prefix for correlation
//     const objectName = `uploads/${merchantId}_${Date.now()}_${filename}`;
//     const file = bucket.file(objectName);

//     // Generate signed URL with 15-minute expiration
//     const [url] = await file.getSignedUrl({
//       version: 'v4',
//       action: 'write',
//       expires: Date.now() + 15 * 60 * 1000, // 15 minutes
//       contentType,
//     });

//     res.json({ url, objectName });
//   } catch (err) {
//     console.error('Error generating signed URL:', err);
//     res.status(500).json({ error: 'Failed to generate signed URL' });
//   }
// });

// // API endpoint to check merchant onboarding status
// app.get('/api/merchant/:merchantId/status', async (req, res) => {
//   try {
//     const { merchantId } = req.params;
    
//     // Query Firestore for the merchant status
//     const merchantRef = db.collection('merchants').doc(merchantId);
//     const merchantDoc = await merchantRef.get();
    
//     if (!merchantDoc.exists) {
//       return res.status(404).json({ 
//         status: 'not_found',
//         message: 'Merchant not found' 
//       });
//     }
    
//     // Return the actual merchant data
//     res.json(merchantDoc.data());
//   } catch (err) {
//     console.error('Error checking status:', err);
//     res.status(500).json({ error: 'Failed to check status' });
//   }
// });

// // Process document after upload
// app.post('/api/process-document', async (req, res) => {
//   try {
//     const { merchantId, documentType, filePath, bucketName } = req.body;
    
//     if (!merchantId || !documentType || !filePath) {
//       return res.status(400).json({ error: 'Missing required parameters' });
//     }
    
//     // Process the document using Vision API
//     const results = await analyzeDocument(bucketName, filePath, documentType);
    
//     // Store results in Firestore
//     const merchantRef = db.collection('merchants').doc(merchantId);
//     const merchantDoc = await merchantRef.get();
    
//     if (!merchantDoc.exists) {
//       await merchantRef.set({
//         merchantId,
//         status: 'pending',
//         documents: {
//           [documentType]: {
//             path: filePath,
//             status: results.verified ? 'approved' : 'pending',
//             verificationNotes: results.notes,
//             extractedData: results.extractedData,
//             uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//             verifiedAt: admin.firestore.FieldValue.serverTimestamp()
//           }
//         },
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       });
//     } else {
//       // Update existing merchant
//       const updateData = {};
//       updateData[`documents.${documentType}`] = {
//         path: filePath,
//         status: results.verified ? 'approved' : 'pending',
//         verificationNotes: results.notes,
//         extractedData: results.extractedData,
//         uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//         verifiedAt: admin.firestore.FieldValue.serverTimestamp()
//       };
//       updateData['updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
      
//       await merchantRef.update(updateData);
//     }
    
//     // Check if all documents are verified and update merchant status
//     await updateMerchantStatus(merchantId);
    
//     res.json({ 
//       success: true, 
//       verified: results.verified,
//       notes: results.notes,
//       extractedData: results.extractedData
//     });
//   } catch (error) {
//     console.error('Error processing document:', error);
//     res.status(500).json({ error: 'Failed to process document', details: error.message });
//   }
// });

// // Analyze document using Cloud Vision API
// async function analyzeDocument(bucketName, filePath, documentType) {
//   const gcsUri = `gs://${bucketName}/${filePath}`;
  
//   // Get text from document
//   const [textResult] = await visionClient.textDetection(gcsUri);
//   const fullText = textResult.fullTextAnnotation?.text || '';
  
//   // Default response
//   const result = {
//     verified: false,
//     notes: 'Document requires manual verification.',
//     extractedData: { fullText }
//   };
  
//   // Document-specific verification logic
//   if (documentType === 'pan') {
//     // Verify PAN Card (format: ABCDE1234F)
//     const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
//     const panMatches = fullText.match(panRegex);
    
//     if (panMatches && panMatches.length > 0) {
//       result.verified = true;
//       result.notes = 'PAN number detected and verified.';
//       result.extractedData.panNumber = panMatches[0];
      
//       // Try to extract name (common format on PAN cards)
//       const nameRegex = /Name\s*[:\s]\s*([A-Z\s]+)/i;
//       const nameMatch = fullText.match(nameRegex);
//       if (nameMatch && nameMatch[1]) {
//         result.extractedData.name = nameMatch[1].trim();
//       }
//     }
//   } 
//   else if (documentType === 'gst') {
//     // Verify GST Certificate (format: 22AAAAA0000A1Z5)
//     const gstRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[Z]{1}[0-9A-Z]{1}/g;
//     const gstMatches = fullText.match(gstRegex);
    
//     if (gstMatches && gstMatches.length > 0) {
//       result.verified = true;
//       result.notes = 'GST number detected and verified.';
//       result.extractedData.gstNumber = gstMatches[0];
//     }
//   }
//   else if (documentType === 'bank') {
//     // Look for account number patterns
//     const accountRegex = /[Aa]ccount\s*[Nn]o[.:]?\s*([0-9\s]{8,20})/;
//     const accountMatch = fullText.match(accountRegex);
    
//     // Look for IFSC code
//     const ifscRegex = /IFSC\s*[:]?\s*([A-Z]{4}[0]\d{6})/;
//     const ifscMatch = fullText.match(ifscRegex);
    
//     if (accountMatch || ifscMatch) {
//       result.verified = true;
//       result.notes = 'Bank details detected.';
      
//       if (accountMatch && accountMatch[1]) {
//         result.extractedData.accountNumber = accountMatch[1].replace(/\s/g, '');
//       }
      
//       if (ifscMatch && ifscMatch[1]) {
//         result.extractedData.ifscCode = ifscMatch[1];
//       }
//     }
//   }
//   else if (documentType === 'selfie') {
//     // Detect faces in selfie
//     const [faceResult] = await visionClient.faceDetection(gcsUri);
//     const faces = faceResult.faceAnnotations || [];
    
//     if (faces.length === 1) {
//       result.verified = true;
//       result.notes = 'Face detected successfully.';
      
//       // Extract face detection confidence
//       result.extractedData.faceConfidence = faces[0].detectionConfidence;
//       // Check if eyes are open, smiling, etc.
//       result.extractedData.rightEyeOpen = faces[0].rightEyeOpen;
//       result.extractedData.leftEyeOpen = faces[0].leftEyeOpen;
//     } else if (faces.length > 1) {
//       result.verified = false;
//       result.notes = 'Multiple faces detected in selfie.';
//     } else {
//       result.verified = false;
//       result.notes = 'No face detected in selfie.';
//     }
//   }
  
//   return result;
// }

// // Update overall merchant status based on document verification
// async function updateMerchantStatus(merchantId) {
//   const merchantRef = db.collection('merchants').doc(merchantId);
//   const merchant = await merchantRef.get();
  
//   if (!merchant.exists) return;
  
//   const data = merchant.data();
//   const documents = data.documents || {};
  
//   // Required documents
//   const requiredDocs = ['selfie', 'pan'];
  
//   // Check if all required documents are verified
//   const allVerified = requiredDocs.every(docType => 
//     documents[docType] && documents[docType].status === 'approved'
//   );
  
//   if (allVerified) {
//     await merchantRef.update({
//       status: 'approved',
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     });
//   }
// }

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
// Required dependencies





// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path');
// const { Storage } = require('@google-cloud/storage');
// const vision = require('@google-cloud/vision');
// const bodyParser = require('body-parser');
// const crypto = require('crypto');

// // Add these new imports - make sure these files exist
// const { verifyFace } = require('./face-verification');
// const { validateAcrossDocuments } = require('./cross-validator');
// const { assessMerchantRisk } = require('./risk-engine');

// // Initialize Express
// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // Initialize Vision API client
// const visionClient = new vision.ImageAnnotatorClient();

// // Setup for Google Cloud Storage
// const projectId = process.env.GCLOUD_PROJECT;
// const bucketName = process.env.BUCKET_NAME;
// const storage = new Storage({ projectId });
// const bucket = storage.bucket(bucketName);

// // Simple file-based storage instead of Firestore
// const DATA_FILE = path.join(__dirname, 'merchants_data.json');

// // Initialize data file if it doesn't exist
// if (!fs.existsSync(DATA_FILE)) {
//   fs.writeFileSync(DATA_FILE, JSON.stringify({}));
// }

// // Helper functions for file-based storage
// function readData() {
//   try {
//     return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
//   } catch (err) {
//     console.error('Error reading data file:', err);
//     return {};
//   }
// }

// function writeData(data) {
//   try {
//     fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
//   } catch (err) {
//     console.error('Error writing data file:', err);
//   }
// }

// // Utility functions
// function generateMerchantId(length = 8) {
//   return crypto.randomBytes(length).toString('hex');
// }

// function isValidMerchantId(id) {
//   return /^[0-9a-f]{16}$/.test(id) || id === '123'; // Allow test ID '123'
// }

// function calculateOverallRiskScore(documents) {
//   if (!documents || Object.keys(documents).length === 0) {
//     return 1.0; // Maximum risk if no documents
//   }
  
//   let totalRisk = 0;
//   let count = 0;
  
//   // Weights for different document types
//   const weights = {
//     'pan': 0.35,
//     'selfie': 0.25,
//     'gst': 0.25,
//     'bank': 0.15
//   };
  
//   // Calculate weighted risk
//   Object.entries(documents).forEach(([type, doc]) => {
//     if (doc.riskScore !== undefined && weights[type]) {
//       totalRisk += doc.riskScore * weights[type];
//       count += weights[type];
//     }
//   });
  
//   // Return normalized risk score
//   return count > 0 ? totalRisk / count : 1.0;
// }

// // Simple test endpoint to verify server is working
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
// });

// // Generate a new merchant ID - THIS IS THE ENDPOINT THAT'S GIVING YOU THE 404
// app.get('/api/merchant/new', (req, res) => {
//   try {
//     console.log('Generating new merchant ID');
//     const merchantId = generateMerchantId(8);
//     console.log('Generated merchant ID:', merchantId);
//     res.json({ merchantId });
//   } catch (err) {
//     console.error('Error generating merchant ID:', err);
//     res.status(500).json({ error: 'Failed to generate merchant ID' });
//   }
// });

// // Save merchant profile information
// app.post('/api/merchant/:merchantId/profile', (req, res) => {
//   try {
//     const { merchantId } = req.params;
//     const { businessName, email, phoneNumber, createdAt } = req.body;
    
//     if (!businessName || !email) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }
    
//     // Get data from file
//     const data = readData();
    
//     // Create or update merchant profile
//     if (!data[merchantId]) {
//       data[merchantId] = {
//         merchantId,
//         status: 'pending',
//         documents: {},
//         createdAt: new Date().toISOString()
//       };
//     }
    
//     data[merchantId].profile = {
//       businessName,
//       email,
//       phoneNumber,
//       createdAt: createdAt || new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
    
//     // Save to file
//     writeData(data);
    
//     res.json({ success: true, merchantId });
//   } catch (err) {
//     console.error('Error saving merchant profile:', err);
//     res.status(500).json({ error: 'Failed to save merchant profile' });
//   }
// });

// // API endpoint to generate signed URLs for secure uploads
// app.get('/api/signed-url', async (req, res) => {
//   try {
//     const { filename, contentType = 'application/octet-stream', merchantId } = req.query;
//     if (!filename || !merchantId) {
//       return res.status(400).json({ error: 'filename & merchantId required' });
//     }

//     // Create object name with merchantId prefix for correlation
//     const objectName = `uploads/${merchantId}_${Date.now()}_${filename}`;
//     const file = bucket.file(objectName);

//     // Generate signed URL with 15-minute expiration
//     const [url] = await file.getSignedUrl({
//       version: 'v4',
//       action: 'write',
//       expires: Date.now() + 15 * 60 * 1000, // 15 minutes
//       contentType,
//     });

//     res.json({ url, objectName });
//   } catch (err) {
//     console.error('Error generating signed URL:', err);
//     res.status(500).json({ error: 'Failed to generate signed URL' });
//   }
// });

// // Validate a merchant ID
// app.get('/api/merchant/validate/:merchantId', (req, res) => {
//   try {
//     const { merchantId } = req.params;
//     const isValid = isValidMerchantId(merchantId);
//     res.json({ valid: isValid });
//   } catch (err) {
//     console.error('Error validating merchant ID:', err);
//     res.status(500).json({ error: 'Failed to validate merchant ID' });
//   }
// });

// // API endpoint to check merchant onboarding status
// app.get('/api/merchant/:merchantId/status', async (req, res) => {
//   try {
//     const { merchantId } = req.params;
    
//     // Get merchant from JSON file
//     const data = readData();
//     const merchant = data[merchantId];
    
//     if (!merchant) {
//       return res.status(404).json({ 
//         status: 'not_found',
//         message: 'Merchant not found' 
//       });
//     }
    
//     // Ensure risk assessment is up to date
//     if (!merchant.riskAssessment) {
//       merchant.riskAssessment = assessMerchantRisk(merchant);
//       writeData(data);
//     }
    
//     res.json(merchant);
//   } catch (err) {
//     console.error('Error checking status:', err);
//     res.status(500).json({ error: 'Failed to check status' });
//   }
// });

// // Process document after upload
// app.post('/api/process-document', async (req, res) => {
//   try {
//     console.log('Processing document request:', req.body);
//     const { merchantId, documentType, filePath, bucketName } = req.body;
    
//     if (!merchantId || !documentType || !filePath || !bucketName) {
//       return res.status(400).json({ 
//         error: 'Missing required parameters',
//         received: req.body
//       });
//     }
    
//     // Process the document
//     let results;
//     if (documentType === 'selfie') {
//       // Use enhanced face verification for selfies
//       results = await verifyFace(bucketName, filePath);
//     } else {
//       // Use regular document analysis for other documents
//       results = await analyzeDocument(bucketName, filePath, documentType);
//     }
    
//     // Store results in JSON file
//     const data = readData();
    
//     if (!data[merchantId]) {
//       data[merchantId] = {
//         merchantId,
//         status: 'pending',
//         documents: {},
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString()
//       };
//     }
    
//     data[merchantId].documents[documentType] = {
//       path: filePath,
//       status: results.verified ? 'approved' : 'pending',
//       verificationNotes: results.notes,
//       extractedData: results.extractedData,
//       riskScore: results.riskScore,
//       confidenceScore: results.confidenceScore,
//       uploadedAt: new Date().toISOString(),
//       verifiedAt: new Date().toISOString()
//     };
    
//     // Add specialized fields for selfie
//     if (documentType === 'selfie') {
//       data[merchantId].documents[documentType].liveness = results.liveness;
//       data[merchantId].documents[documentType].qualityScore = results.qualityScore;
//       data[merchantId].documents[documentType].fraudProbability = results.fraudProbability;
//       data[merchantId].documents[documentType].faceAttributes = results.faceAttributes;
//       data[merchantId].documents[documentType].imageQuality = results.imageQuality;
//       data[merchantId].documents[documentType].safetyChecks = results.safetyChecks;
//     }
    
//     // Perform cross-document validation if we have multiple documents
//     if (Object.keys(data[merchantId].documents).length > 1) {
//       const validationResults = validateAcrossDocuments(data[merchantId].documents);
//       data[merchantId].crossValidation = validationResults;
//     }
    
//     // Perform comprehensive risk assessment
//     const riskAssessment = assessMerchantRisk(data[merchantId]);
//     data[merchantId].riskAssessment = riskAssessment;
    
//     // Update merchant status based on risk assessment
//     if (riskAssessment.decision === 'auto_approve') {
//       data[merchantId].status = 'approved';
//       data[merchantId].autoApproved = true;
//     } else if (riskAssessment.decision === 'reject') {
//       data[merchantId].status = 'rejected';
//       data[merchantId].rejectionReasons = riskAssessment.reasons;
//     } else {
//       data[merchantId].status = 'pending';
//     }
    
//     data[merchantId].updatedAt = new Date().toISOString();
//     writeData(data);
    
//     res.json({ 
//       success: true, 
//       verified: results.verified,
//       notes: results.notes,
//       extractedData: results.extractedData,
//       riskScore: results.riskScore,
//       confidenceScore: results.confidenceScore,
//       riskAssessment: riskAssessment
//     });
//   } catch (error) {
//     console.error('Detailed error:', error);
//     res.status(500).json({ 
//       error: 'Failed to process document', 
//       message: error.message,
//       stack: error.stack
//     });
//   }
// });

// // Get all merchants
// app.get('/api/merchants', (req, res) => {
//   try {
//     const data = readData();
//     const merchants = Object.entries(data).map(([id, merchant]) => {
//       // Use risk assessment if available, otherwise calculate risk score
//       const riskScore = merchant.riskAssessment ? 
//         merchant.riskAssessment.overallRiskScore : 
//         calculateOverallRiskScore(merchant.documents);
      
//       return {
//         merchantId: id,
//         status: merchant.status,
//         createdAt: merchant.createdAt,
//         updatedAt: merchant.updatedAt,
//         riskScore,
//         riskLevel: riskScore < 0.3 ? 'low' : riskScore < 0.7 ? 'medium' : 'high'
//       };
//     });
    
//     res.json(merchants);
//   } catch (err) {
//     console.error('Error fetching merchants:', err);
//     res.status(500).json({ error: 'Failed to fetch merchants' });
//   }
// });

// // Update document status
// app.post('/api/merchant/:merchantId/document/:documentType/status', (req, res) => {
//   try {
//     const { merchantId, documentType } = req.params;
//     const { status, notes } = req.body;
    
//     if (!status) {
//       return res.status(400).json({ error: 'Status is required' });
//     }
    
//     const data = readData();
    
//     if (!data[merchantId]) {
//       return res.status(404).json({ error: 'Merchant not found' });
//     }
    
//     if (!data[merchantId].documents || !data[merchantId].documents[documentType]) {
//       return res.status(404).json({ error: 'Document not found' });
//     }
    
//     // Update document status
//     data[merchantId].documents[documentType].status = status;
//     data[merchantId].documents[documentType].verificationNotes = notes || 'Updated by admin';
//     data[merchantId].documents[documentType].verifiedAt = new Date().toISOString();
//     data[merchantId].updatedAt = new Date().toISOString();
    
//     // Calculate new risk score after admin review
//     if (status === 'approved') {
//       data[merchantId].documents[documentType].riskScore = 0.1; // Very low risk for admin-approved docs
//     } else if (status === 'rejected') {
//       data[merchantId].documents[documentType].riskScore = 0.9; // High risk for rejected docs
//     }
    
//     // Re-perform risk assessment after document update
//     const riskAssessment = assessMerchantRisk(data[merchantId]);
//     data[merchantId].riskAssessment = riskAssessment;
    
//     // Update merchant status based on risk assessment
//     if (riskAssessment.decision === 'auto_approve') {
//       data[merchantId].status = 'approved';
//     } else if (riskAssessment.decision === 'reject') {
//       data[merchantId].status = 'rejected';
//       data[merchantId].rejectionReasons = riskAssessment.reasons;
//     }
    
//     writeData(data);
    
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Error updating document status:', err);
//     res.status(500).json({ error: 'Failed to update document status' });
//   }
// });

// // Update merchant status
// app.post('/api/merchant/:merchantId/status', (req, res) => {
//   try {
//     const { merchantId } = req.params;
//     const { status } = req.body;
    
//     if (!status) {
//       return res.status(400).json({ error: 'Status is required' });
//     }
    
//     const data = readData();
    
//     if (!data[merchantId]) {
//       return res.status(404).json({ error: 'Merchant not found' });
//     }
    
//     // Update merchant status
//     data[merchantId].status = status;
//     data[merchantId].updatedAt = new Date().toISOString();
    
//     // If manually approved by admin, set flag
//     if (status === 'approved') {
//       data[merchantId].manuallyApproved = true;
//     }
    
//     writeData(data);
    
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Error updating merchant status:', err);
//     res.status(500).json({ error: 'Failed to update merchant status' });
//   }
// });

// // Serve document files
// app.get('/api/document', (req, res) => {
//   try {
//     // Get the file path from the query parameter
//     const filePath = req.query.path;
    
//     if (!filePath) {
//       return res.status(400).json({ error: 'File path is required' });
//     }
    
//     const bucketFile = bucket.file(filePath);
    
//     bucketFile.getSignedUrl({
//       action: 'read',
//       expires: Date.now() + 15 * 60 * 1000 // 15 minutes
//     }).then(signedUrls => {
//       res.redirect(signedUrls[0]);
//     }).catch(err => {
//       console.error('Error getting signed URL:', err);
//       res.status(500).json({ error: 'Failed to get document URL' });
//     });
//   } catch (err) {
//     console.error('Error serving document:', err);
//     res.status(500).json({ error: 'Failed to serve document' });
//   }
// });

// // Enhanced document analysis
// async function analyzeDocument(bucketName, filePath, documentType) {
//   const gcsUri = `gs://${bucketName}/${filePath}`;
  
//   // Get text from document
//   const [textResult] = await visionClient.textDetection(gcsUri);
//   const fullText = textResult.fullTextAnnotation?.text || '';
  
//   // Default response
//   const result = {
//     verified: false,
//     notes: 'Document requires manual verification.',
//     extractedData: { fullText },
//     riskScore: 0.5,
//     confidenceScore: 0
//   };
  
//   // Document-specific verification logic with enhanced extraction
//   if (documentType === 'pan') {
//     // Verify PAN Card (format: ABCDE1234F)
//     const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
//     const panMatches = fullText.match(panRegex);
    
//     if (panMatches && panMatches.length > 0) {
//       result.verified = true;
//       result.notes = 'PAN number detected and verified.';
//       result.extractedData.panNumber = panMatches[0];
//       result.confidenceScore = 0.85;
      
//       // Try to extract name (common format on PAN cards)
//       const nameRegex = /Name\s*[:\s]\s*([A-Z\s]+)/i;
//       const nameMatch = fullText.match(nameRegex);
//       if (nameMatch && nameMatch[1]) {
//         result.extractedData.name = nameMatch[1].trim();
//       }
      
//       // Try to extract date of birth
//       const dobRegex = /Date\s*of\s*Birth\s*[:\s]\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i;
//       const dobMatch = fullText.match(dobRegex);
//       if (dobMatch && dobMatch[1]) {
//         result.extractedData.dateOfBirth = dobMatch[1];
//       }
      
//       // Try to extract father's name
//       const fatherRegex = /Father'?s?\s*Name\s*[:\s]\s*([A-Z\s]+)/i;
//       const fatherMatch = fullText.match(fatherRegex);
//       if (fatherMatch && fatherMatch[1]) {
//         result.extractedData.fatherName = fatherMatch[1].trim();
//       }
      
//       // Validate PAN number format and calculate risk
//       if (/[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(result.extractedData.panNumber)) {
//         result.riskScore = 0.2; // Low risk if format is valid
//       } else {
//         result.riskScore = 0.8; // High risk if format seems modified
//         result.verified = false;
//         result.notes = 'PAN number format appears invalid. Manual verification required.';
//       }
//     }
//   } 
//   else if (documentType === 'gst') {
//     // Verify GST Certificate (format: 22AAAAA0000A1Z5)
//     const gstRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[Z]{1}[0-9A-Z]{1}/g;
//     const gstMatches = fullText.match(gstRegex);
    
//     if (gstMatches && gstMatches.length > 0) {
//       result.verified = true;
//       result.notes = 'GST number detected and verified.';
//       result.extractedData.gstNumber = gstMatches[0];
//       result.confidenceScore = 0.85;
      
//       // Try to extract business name
//       const businessRegex = /Legal\s*Name\s*of\s*Business\s*[:\s]\s*([^\n]+)/i;
//       const businessMatch = fullText.match(businessRegex);
//       if (businessMatch && businessMatch[1]) {
//         result.extractedData.businessName = businessMatch[1].trim();
//       }
      
//       // Try to extract business address
//       const addressRegex = /Principal\s*Place\s*of\s*Business\s*[:\s]\s*([^\n]+)/i;
//       const addressMatch = fullText.match(addressRegex);
//       if (addressMatch && addressMatch[1]) {
//         result.extractedData.businessAddress = addressMatch[1].trim();
//       }
      
//       // Validate GST format and calculate risk
//       if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[Z]{1}[0-9A-Z]{1}$/.test(result.extractedData.gstNumber)) {
//         result.riskScore = 0.3; // Low-medium risk
//       } else {
//         result.riskScore = 0.7; // High risk
//         result.verified = false;
//         result.notes = 'GST number format appears invalid. Manual verification required.';
//       }
//     }
//   }
//   else if (documentType === 'bank') {
//     // Look for account number patterns
//     const accountRegex = /[Aa]ccount\s*[Nn]o[.:]?\s*([0-9\s]{8,20})/;
//     const accountMatch = fullText.match(accountRegex);
    
//     // Look for IFSC code
//     const ifscRegex = /IFSC\s*[:]?\s*([A-Z]{4}[0]\d{6})/;
//     const ifscMatch = fullText.match(ifscRegex);
    
//     // Look for account holder name
//     const holderRegex = /[Aa]ccount\s*[Hh]older\s*[Nn]ame\s*[:\s]\s*([^\n]+)/;
//     const holderMatch = fullText.match(holderRegex);
    
//     // Look for bank name
//     const bankNameRegex = /[Bb]ank\s*[Nn]ame\s*[:\s]\s*([^\n]+)/;
//     const bankNameMatch = fullText.match(bankNameRegex);
    
//     if (accountMatch || ifscMatch) {
//       result.verified = true;
//       result.notes = 'Bank details detected.';
//       result.confidenceScore = 0.75;
      
//       if (accountMatch && accountMatch[1]) {
//         result.extractedData.accountNumber = accountMatch[1].replace(/\s/g, '');
//       }
      
//       if (ifscMatch && ifscMatch[1]) {
//         result.extractedData.ifscCode = ifscMatch[1];
//       }
      
//       if (holderMatch && holderMatch[1]) {
//         result.extractedData.accountHolderName = holderMatch[1].trim();
//       }
      
//       if (bankNameMatch && bankNameMatch[1]) {
//         result.extractedData.bankName = bankNameMatch[1].trim();
//       }
      
//       // Calculate risk based on available information
//       let detailsCount = 0;
//       if (result.extractedData.accountNumber) detailsCount++;
//       if (result.extractedData.ifscCode) detailsCount++;
//       if (result.extractedData.accountHolderName) detailsCount++;
//       if (result.extractedData.bankName) detailsCount++;
      
//       // Risk is lower when more details are available
//       result.riskScore = 1 - (detailsCount / 4) * 0.7;
//     }
//   }
//   else if (documentType === 'selfie') {
//     // Detect faces in selfie
//     const [faceResult] = await visionClient.faceDetection(gcsUri);
//     const faces = faceResult.faceAnnotations || [];
    
//     if (faces.length === 1) {
//       result.verified = true;
//       result.notes = 'Face detected successfully.';
      
//       // Extract face detection confidence
//       result.extractedData.faceConfidence = faces[0].detectionConfidence;
//       result.confidenceScore = faces[0].detectionConfidence;
      
//       // Check if eyes are open, smiling, etc.
//       result.extractedData.rightEyeOpen = faces[0].rightEyeOpen;
//       result.extractedData.leftEyeOpen = faces[0].leftEyeOpen;
//       result.extractedData.joyLikelihood = faces[0].joyLikelihood;
//       result.extractedData.sorrowLikelihood = faces[0].sorrowLikelihood;
//       result.extractedData.angerLikelihood = faces[0].angerLikelihood;
//       result.extractedData.headwearLikelihood = faces[0].headwearLikelihood;
      
//       // Calculate a risk score based on face detection confidence and quality
//       const eyesOpen = faces[0].rightEyeOpen > 0.7 && faces[0].leftEyeOpen > 0.7;
//       const goodQuality = faces[0].detectionConfidence > 0.8;
//       const noHeadwear = faces[0].headwearLikelihood < 2; // VERY_UNLIKELY or UNLIKELY
      
//       if (eyesOpen && goodQuality && noHeadwear) {
//         result.riskScore = 0.1; // Very low risk
//       } else if (goodQuality && (eyesOpen || noHeadwear)) {
//         result.riskScore = 0.3; // Low risk
//       } else {
//         result.riskScore = 0.6; // Medium risk
//       }
//     } else if (faces.length > 1) {
//       result.verified = false;
//       result.notes = 'Multiple faces detected in selfie.';
//       result.riskScore = 0.9; // High risk
//     } else {
//       result.verified = false;
//       result.notes = 'No face detected in selfie.';
//       result.riskScore = 0.95; // Very high risk
//     }
//   }
  
//   return result;
// }

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Backend running on port ${PORT}`);
//   console.log(`Endpoints available:`);
//   console.log(`- GET /api/test - Test server connection`);
//   console.log(`- GET /api/merchant/new - Generate new merchant ID`);
//   console.log(`- POST /api/merchant/:merchantId/profile - Create merchant profile`);
// });




require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const vision = require('@google-cloud/vision');
const bodyParser = require('body-parser');
const crypto = require('crypto');

// Add these new imports - make sure these files exist
const { verifyFace } = require('./face-verification');
const { validateAcrossDocuments } = require('./cross-validator');
const { assessMerchantRisk } = require('./risk-engine');

// Initialize Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Vision API client
const visionClient = new vision.ImageAnnotatorClient();

// Setup for Google Cloud Storage
const projectId = process.env.GCLOUD_PROJECT;
const bucketName = process.env.BUCKET_NAME;
const storage = new Storage({ projectId });
const bucket = storage.bucket(bucketName);

// Simple file-based storage instead of Firestore
const DATA_FILE = path.join(__dirname, 'merchants_data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// Helper functions for file-based storage
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading data file:', err);
    return {};
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// Utility functions
function generateMerchantId(length = 8) {
  return crypto.randomBytes(length).toString('hex');
}

function isValidMerchantId(id) {
  return /^[0-9a-f]{16}$/.test(id) || id === '123'; // Allow test ID '123'
}

function calculateOverallRiskScore(documents) {
  if (!documents || Object.keys(documents).length === 0) {
    return 1.0; // Maximum risk if no documents
  }
  
  let totalRisk = 0;
  let count = 0;
  
  // Weights for different document types
  const weights = {
    'pan': 0.35,
    'selfie': 0.25,
    'gst': 0.25,
    'bank': 0.15
  };
  
  // Calculate weighted risk
  Object.entries(documents).forEach(([type, doc]) => {
    if (doc.riskScore !== undefined && weights[type]) {
      totalRisk += doc.riskScore * weights[type];
      count += weights[type];
    }
  });
  
  // Return normalized risk score
  return count > 0 ? totalRisk / count : 1.0;
}

// Simple test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Generate a new merchant ID
// app.get('/api/merchant/new', (req, res) => {
//   try {
//     console.log('Generating new merchant ID');
//     const merchantId = generateMerchantId(8);
//     console.log('Generated merchant ID:', merchantId);
//     res.json({ merchantId });
//   } catch (err) {
//     console.error('Error generating merchant ID:', err);
//     res.status(500).json({ error: 'Failed to generate merchant ID' });
//   }
// });

// Save merchant profile information
app.post('/api/merchant/:merchantId/profile', (req, res) => {
  try {
    const { merchantId } = req.params;
    const { businessName, email, phoneNumber, createdAt } = req.body;
    
    if (!businessName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get data from file
    const data = readData();
    
    // Create or update merchant profile
    if (!data[merchantId]) {
      data[merchantId] = {
        merchantId,
        status: 'pending',
        documents: {},
        createdAt: new Date().toISOString()
      };
    }
    
    data[merchantId].profile = {
      businessName,
      email,
      phoneNumber,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to file
    writeData(data);
    
    res.json({ success: true, merchantId });
  } catch (err) {
    console.error('Error saving merchant profile:', err);
    res.status(500).json({ error: 'Failed to save merchant profile' });
  }
});

// API endpoint to generate signed URLs for secure uploads
app.get('/api/signed-url', async (req, res) => {
  try {
    const { filename, contentType = 'application/octet-stream', merchantId } = req.query;
    if (!filename || !merchantId) {
      return res.status(400).json({ error: 'filename & merchantId required' });
    }

    // Create object name with merchantId prefix for correlation
    const objectName = `uploads/${merchantId}_${Date.now()}_${filename}`;
    const file = bucket.file(objectName);

    // Generate signed URL with 15-minute expiration
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    res.json({ url, objectName });
  } catch (err) {
    console.error('Error generating signed URL:', err);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// ZIP UPLOAD ENDPOINTS - START

// API endpoint to generate signed URLs for secure ZIP uploads
app.get('/api/signed-url-zip', async (req, res) => {
  try {
    const { filename, contentType = 'application/zip', merchantId } = req.query;
    if (!filename || !merchantId) {
      return res.status(400).json({ error: 'filename & merchantId required' });
    }

    // Create object name with merchantId prefix for correlation
    const objectName = `zips/${merchantId}_${Date.now()}_${filename}`;
    const file = bucket.file(objectName);

    // Generate signed URL with 15-minute expiration
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    res.json({ url, objectName });
  } catch (err) {
    console.error('Error generating ZIP signed URL:', err);
    res.status(500).json({ error: 'Failed to generate signed URL for ZIP' });
  }
});

// Process ZIP file after upload
app.post('/api/process-zip', async (req, res) => {
  try {
    const { merchantId, zipPath, bucketName } = req.body;
    
    if (!merchantId || !zipPath) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // This would typically extract the ZIP and process each document
    // For now, we'll return a mock response
    
    res.json({ 
      success: true, 
      message: 'ZIP file received and being processed',
      zipPath,
      documentCount: 4, // Mock number of documents
      status: 'processing'
    });
    
    // In a real implementation, you would:
    // 1. Download the ZIP from storage
    // 2. Extract its contents
    // 3. Process each document
    // 4. Update the merchant's document status
    
  } catch (error) {
    console.error('Error processing ZIP:', error);
    res.status(500).json({ error: 'Failed to process ZIP file', details: error.message });
  }
});

// ZIP UPLOAD ENDPOINTS - END

// Validate a merchant ID
app.get('/api/merchant/validate/:merchantId', (req, res) => {
  try {
    const { merchantId } = req.params;
    const isValid = isValidMerchantId(merchantId);
    res.json({ valid: isValid });
  } catch (err) {
    console.error('Error validating merchant ID:', err);
    res.status(500).json({ error: 'Failed to validate merchant ID' });
  }
});

// API endpoint to check merchant onboarding status
app.get('/api/merchant/:merchantId/status', async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    // Get merchant from JSON file
    const data = readData();
    const merchant = data[merchantId];
    
    if (!merchant) {
      return res.status(404).json({ 
        status: 'not_found',
        message: 'Merchant not found' 
      });
    }
    
    // Ensure risk assessment is up to date
    if (!merchant.riskAssessment) {
      merchant.riskAssessment = assessMerchantRisk(merchant);
      writeData(data);
    }
    
    res.json(merchant);
  } catch (err) {
    console.error('Error checking status:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Process document after upload
app.post('/api/process-document', async (req, res) => {
  try {
    console.log('Processing document request:', req.body);
    const { merchantId, documentType, filePath, bucketName } = req.body;
    
    if (!merchantId || !documentType || !filePath || !bucketName) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: req.body
      });
    }
    
    // Process the document
    let results;
    if (documentType === 'selfie') {
      // Use enhanced face verification for selfies
      results = await verifyFace(bucketName, filePath);
    } else {
      // Use regular document analysis for other documents
      results = await analyzeDocument(bucketName, filePath, documentType);
    }
    
    // Store results in JSON file
    const data = readData();
    
    if (!data[merchantId]) {
      data[merchantId] = {
        merchantId,
        status: 'pending',
        documents: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    data[merchantId].documents[documentType] = {
      path: filePath,
      status: results.verified ? 'approved' : 'pending',
      verificationNotes: results.notes,
      extractedData: results.extractedData,
      riskScore: results.riskScore,
      confidenceScore: results.confidenceScore,
      uploadedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    };
    
    // Add specialized fields for selfie
    if (documentType === 'selfie') {
      data[merchantId].documents[documentType].liveness = results.liveness;
      data[merchantId].documents[documentType].qualityScore = results.qualityScore;
      data[merchantId].documents[documentType].fraudProbability = results.fraudProbability;
      data[merchantId].documents[documentType].faceAttributes = results.faceAttributes;
      data[merchantId].documents[documentType].imageQuality = results.imageQuality;
      data[merchantId].documents[documentType].safetyChecks = results.safetyChecks;
    }
    
    // Perform cross-document validation if we have multiple documents
    if (Object.keys(data[merchantId].documents).length > 1) {
      const validationResults = validateAcrossDocuments(data[merchantId].documents);
      data[merchantId].crossValidation = validationResults;
    }
    
    // Perform comprehensive risk assessment
    const riskAssessment = assessMerchantRisk(data[merchantId]);
    data[merchantId].riskAssessment = riskAssessment;
    
    // Update merchant status based on risk assessment
    if (riskAssessment.decision === 'auto_approve') {
      data[merchantId].status = 'approved';
      data[merchantId].autoApproved = true;
    } else if (riskAssessment.decision === 'reject') {
      data[merchantId].status = 'rejected';
      data[merchantId].rejectionReasons = riskAssessment.reasons;
    } else {
      data[merchantId].status = 'pending';
    }
    
    data[merchantId].updatedAt = new Date().toISOString();
    writeData(data);
    
    res.json({ 
      success: true, 
      verified: results.verified,
      notes: results.notes,
      extractedData: results.extractedData,
      riskScore: results.riskScore,
      confidenceScore: results.confidenceScore,
      riskAssessment: riskAssessment
    });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to process document', 
      message: error.message,
      stack: error.stack
    });
  }
});

// Get all merchants
app.get('/api/merchants', (req, res) => {
  try {
    const data = readData();
    const merchants = Object.entries(data).map(([id, merchant]) => {
      // Use risk assessment if available, otherwise calculate risk score
      const riskScore = merchant.riskAssessment ? 
        merchant.riskAssessment.overallRiskScore : 
        calculateOverallRiskScore(merchant.documents);
      
      return {
        merchantId: id,
        status: merchant.status,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
        riskScore,
        riskLevel: riskScore < 0.3 ? 'low' : riskScore < 0.7 ? 'medium' : 'high'
      };
    });
    
    res.json(merchants);
  } catch (err) {
    console.error('Error fetching merchants:', err);
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

// Update document status
app.post('/api/merchant/:merchantId/document/:documentType/status', (req, res) => {
  try {
    const { merchantId, documentType } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const data = readData();
    
    if (!data[merchantId]) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    if (!data[merchantId].documents || !data[merchantId].documents[documentType]) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Update document status
    data[merchantId].documents[documentType].status = status;
    data[merchantId].documents[documentType].verificationNotes = notes || 'Updated by admin';
    data[merchantId].documents[documentType].verifiedAt = new Date().toISOString();
    data[merchantId].updatedAt = new Date().toISOString();
    
    // Calculate new risk score after admin review
    if (status === 'approved') {
      data[merchantId].documents[documentType].riskScore = 0.1; // Very low risk for admin-approved docs
    } else if (status === 'rejected') {
      data[merchantId].documents[documentType].riskScore = 0.9; // High risk for rejected docs
    }
    
    // Re-perform risk assessment after document update
    const riskAssessment = assessMerchantRisk(data[merchantId]);
    data[merchantId].riskAssessment = riskAssessment;
    
    // Update merchant status based on risk assessment
    if (riskAssessment.decision === 'auto_approve') {
      data[merchantId].status = 'approved';
    } else if (riskAssessment.decision === 'reject') {
      data[merchantId].status = 'rejected';
      data[merchantId].rejectionReasons = riskAssessment.reasons;
    }
    
    writeData(data);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating document status:', err);
    res.status(500).json({ error: 'Failed to update document status' });
  }
});

// Update merchant status
app.post('/api/merchant/:merchantId/status', (req, res) => {
  try {
    const { merchantId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const data = readData();
    
    if (!data[merchantId]) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    // Update merchant status
    data[merchantId].status = status;
    data[merchantId].updatedAt = new Date().toISOString();
    
    // If manually approved by admin, set flag
    if (status === 'approved') {
      data[merchantId].manuallyApproved = true;
    }
    
    writeData(data);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating merchant status:', err);
    res.status(500).json({ error: 'Failed to update merchant status' });
  }
});

// Serve document files
app.get('/api/document', (req, res) => {
  try {
    // Get the file path from the query parameter
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const bucketFile = bucket.file(filePath);
    
    bucketFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    }).then(signedUrls => {
      res.redirect(signedUrls[0]);
    }).catch(err => {
      console.error('Error getting signed URL:', err);
      res.status(500).json({ error: 'Failed to get document URL' });
    });
  } catch (err) {
    console.error('Error serving document:', err);
    res.status(500).json({ error: 'Failed to serve document' });
  }
});

// Enhanced document analysis
async function analyzeDocument(bucketName, filePath, documentType) {
  const gcsUri = `gs://${bucketName}/${filePath}`;
  
  // Get text from document
  const [textResult] = await visionClient.textDetection(gcsUri);
  const fullText = textResult.fullTextAnnotation?.text || '';
  
  // Default response
  const result = {
    verified: false,
    notes: 'Document requires manual verification.',
    extractedData: { fullText },
    riskScore: 0.5,
    confidenceScore: 0
  };
  
  // Document-specific verification logic with enhanced extraction
  if (documentType === 'pan') {
    // Verify PAN Card (format: ABCDE1234F)
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
    const panMatches = fullText.match(panRegex);
    
    if (panMatches && panMatches.length > 0) {
      result.verified = true;
      result.notes = 'PAN number detected and verified.';
      result.extractedData.panNumber = panMatches[0];
      result.confidenceScore = 0.85;
      
      // Try to extract name (common format on PAN cards)
      const nameRegex = /Name\s*[:\s]\s*([A-Z\s]+)/i;
      const nameMatch = fullText.match(nameRegex);
      if (nameMatch && nameMatch[1]) {
        result.extractedData.name = nameMatch[1].trim();
      }
      
      // Try to extract date of birth
      const dobRegex = /Date\s*of\s*Birth\s*[:\s]\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i;
      const dobMatch = fullText.match(dobRegex);
      if (dobMatch && dobMatch[1]) {
        result.extractedData.dateOfBirth = dobMatch[1];
      }
      
      // Try to extract father's name
      const fatherRegex = /Father'?s?\s*Name\s*[:\s]\s*([A-Z\s]+)/i;
      const fatherMatch = fullText.match(fatherRegex);
      if (fatherMatch && fatherMatch[1]) {
        result.extractedData.fatherName = fatherMatch[1].trim();
      }
      
      // Validate PAN number format and calculate risk
      if (/[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(result.extractedData.panNumber)) {
        result.riskScore = 0.2; // Low risk if format is valid
      } else {
        result.riskScore = 0.8; // High risk if format seems modified
        result.verified = false;
        result.notes = 'PAN number format appears invalid. Manual verification required.';
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
      result.confidenceScore = 0.85;
      
      // Try to extract business name
      const businessRegex = /Legal\s*Name\s*of\s*Business\s*[:\s]\s*([^\n]+)/i;
      const businessMatch = fullText.match(businessRegex);
      if (businessMatch && businessMatch[1]) {
        result.extractedData.businessName = businessMatch[1].trim();
      }
      
      // Try to extract business address
      const addressRegex = /Principal\s*Place\s*of\s*Business\s*[:\s]\s*([^\n]+)/i;
      const addressMatch = fullText.match(addressRegex);
      if (addressMatch && addressMatch[1]) {
        result.extractedData.businessAddress = addressMatch[1].trim();
      }
      
      // Validate GST format and calculate risk
      if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[Z]{1}[0-9A-Z]{1}$/.test(result.extractedData.gstNumber)) {
        result.riskScore = 0.3; // Low-medium risk
      } else {
        result.riskScore = 0.7; // High risk
        result.verified = false;
        result.notes = 'GST number format appears invalid. Manual verification required.';
      }
    }
  }
  else if (documentType === 'bank') {
    // Look for account number patterns
    const accountRegex = /[Aa]ccount\s*[Nn]o[.:]?\s*([0-9\s]{8,20})/;
    const accountMatch = fullText.match(accountRegex);
    
    // Look for IFSC code
    const ifscRegex = /IFSC\s*[:]?\s*([A-Z]{4}[0]\d{6})/;
    const ifscMatch = fullText.match(ifscRegex);
    
    // Look for account holder name
    const holderRegex = /[Aa]ccount\s*[Hh]older\s*[Nn]ame\s*[:\s]\s*([^\n]+)/;
    const holderMatch = fullText.match(holderRegex);
    
    // Look for bank name
    const bankNameRegex = /[Bb]ank\s*[Nn]ame\s*[:\s]\s*([^\n]+)/;
    const bankNameMatch = fullText.match(bankNameRegex);
    
    if (accountMatch || ifscMatch) {
      result.verified = true;
      result.notes = 'Bank details detected.';
      result.confidenceScore = 0.75;
      
      if (accountMatch && accountMatch[1]) {
        result.extractedData.accountNumber = accountMatch[1].replace(/\s/g, '');
      }
      
      if (ifscMatch && ifscMatch[1]) {
        result.extractedData.ifscCode = ifscMatch[1];
      }
      
      if (holderMatch && holderMatch[1]) {
        result.extractedData.accountHolderName = holderMatch[1].trim();
      }
      
      if (bankNameMatch && bankNameMatch[1]) {
        result.extractedData.bankName = bankNameMatch[1].trim();
      }
      
      // Calculate risk based on available information
      let detailsCount = 0;
      if (result.extractedData.accountNumber) detailsCount++;
      if (result.extractedData.ifscCode) detailsCount++;
      if (result.extractedData.accountHolderName) detailsCount++;
      if (result.extractedData.bankName) detailsCount++;
      
      // Risk is lower when more details are available
      result.riskScore = 1 - (detailsCount / 4) * 0.7;
    }
  }
  else if (documentType === 'selfie') {
    // Detect faces in selfie
    const [faceResult] = await visionClient.faceDetection(gcsUri);
    const faces = faceResult.faceAnnotations || [];
    
    if (faces.length === 1) {
      result.verified = true;
      result.notes = 'Face detected successfully.';
      
      // Extract face detection confidence
      result.extractedData.faceConfidence = faces[0].detectionConfidence;
      result.confidenceScore = faces[0].detectionConfidence;
      
      // Check if eyes are open, smiling, etc.
      result.extractedData.rightEyeOpen = faces[0].rightEyeOpen;
      result.extractedData.leftEyeOpen = faces[0].leftEyeOpen;
      result.extractedData.joyLikelihood = faces[0].joyLikelihood;
      result.extractedData.sorrowLikelihood = faces[0].sorrowLikelihood;
      result.extractedData.angerLikelihood = faces[0].angerLikelihood;
      result.extractedData.headwearLikelihood = faces[0].headwearLikelihood;
      
      // Calculate a risk score based on face detection confidence and quality
      const eyesOpen = faces[0].rightEyeOpen > 0.7 && faces[0].leftEyeOpen > 0.7;
      const goodQuality = faces[0].detectionConfidence > 0.8;
      const noHeadwear = faces[0].headwearLikelihood < 2; // VERY_UNLIKELY or UNLIKELY
      
      if (eyesOpen && goodQuality && noHeadwear) {
        result.riskScore = 0.1; // Very low risk
      } else if (goodQuality && (eyesOpen || noHeadwear)) {
        result.riskScore = 0.3; // Low risk
      } else {
        result.riskScore = 0.6; // Medium risk
      }
    } else if (faces.length > 1) {
      result.verified = false;
      result.notes = 'Multiple faces detected in selfie.';
      result.riskScore = 0.9; // High risk
    } else {
      result.verified = false;
      result.notes = 'No face detected in selfie.';
      result.riskScore = 0.95; // Very high risk
    }
  }
  
  return result;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Endpoints available:`);
  console.log(`- GET /api/test - Test server connection`);
  console.log(`- GET /api/merchant/new - Generate new merchant ID`);
  console.log(`- POST /api/merchant/:merchantId/profile - Create merchant profile`);
  console.log(`- GET /api/signed-url-zip - Generate signed URL for ZIP upload`);
  console.log(`- POST /api/process-zip - Process uploaded ZIP file`);
});