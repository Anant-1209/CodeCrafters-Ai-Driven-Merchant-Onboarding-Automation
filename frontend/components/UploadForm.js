import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Alert } from '@mui/material';

function UploadForm() {
  const [merchantId, setMerchantId] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [selfie, setSelfie] = useState(null);
  const [panCard, setPanCard] = useState(null);
  const [gstCertificate, setGstCertificate] = useState(null);
  const [bankProof, setBankProof] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Upload file using signed URL from backend
  async function uploadFile(file, merchantId, prefix = '') {
    if (!file) return null;
    
    try {
      // 1. Get signed URL from backend
      const response = await fetch(
        `http://localhost:8080/api/signed-url?filename=${prefix}&contentType=${file.type}&merchantId=${merchantId}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`);
      }
      
      const { url, objectName } = await response.json();
      
      // 2. Use the signed URL to upload directly to Cloud Storage
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }
      
      console.log(`Uploaded ${prefix} successfully!`);
      return { fileName: objectName };
    } catch (error) {
      console.error(`Error uploading ${prefix}:`, error);
      throw error;
    }
  }

  // Process document after upload
  async function processDocument(merchantId, documentType, filePath) {
    try {
      const response = await fetch('http://localhost:8080/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId,
          documentType,
          filePath,
          bucketName: 'gcf-v2-uploads-644168759457.us-central1.cloudfunctions.appspot.com'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Document processing result:`, result);
      return result;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!merchantId) {
      setMessage('Please enter a unique Merchant ID');
      return;
    }
    
    if (!selfie || !panCard) {
      setMessage('Selfie and PAN Card are required');
      return;
    }
    
    setIsUploading(true);
    setMessage('Uploading files... This may take a moment.');
    
    try {
      // Upload files and process them
      const selfieResult = await uploadFile(selfie, merchantId, 'selfie');
      await processDocument(merchantId, 'selfie', selfieResult.fileName);
      
      const panResult = await uploadFile(panCard, merchantId, 'pan');
      await processDocument(merchantId, 'pan', panResult.fileName);
      
      if (gstCertificate) {
        const gstResult = await uploadFile(gstCertificate, merchantId, 'gst');
        await processDocument(merchantId, 'gst', gstResult.fileName);
      }
      
      if (bankProof) {
        const bankResult = await uploadFile(bankProof, merchantId, 'bank');
        await processDocument(merchantId, 'bank', bankResult.fileName);
      }
      
      setMessage('Upload and verification complete! Documents are being processed.');
      
      // Reset form
      setMerchantId('');
      setMerchantName('');
      setBusinessName('');
      setSelfie(null);
      setPanCard(null);
      setGstCertificate(null);
      setBankProof(null);
      
      // Clear file input elements
      document.getElementById('selfie').value = '';
      document.getElementById('panCard').value = '';
      document.getElementById('gstCertificate').value = '';
      document.getElementById('bankProof').value = '';
      
    } catch (error) {
      console.error('Upload or processing failed:', error);
      setMessage(`Upload or processing failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="upload-form">
      <h2>Merchant Onboarding</h2>
      
      {message && (
        <div className={`message ${message.includes('failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="merchantId">Merchant ID (unique)</label>
          <input
            type="text"
            id="merchantId"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            placeholder="e.g., mid12345"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="merchantName">Merchant Name</label>
          <input
            type="text"
            id="merchantName"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="Enter full name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="businessName">Business Name</label>
          <input
            type="text"
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter business name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="selfie">Selfie (Required)</label>
          <input
            type="file"
            id="selfie"
            accept="image/*"
            onChange={(e) => setSelfie(e.target.files[0])}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="panCard">PAN Card (Required)</label>
          <input
            type="file"
            id="panCard"
            accept="image/*,.pdf"
            onChange={(e) => setPanCard(e.target.files[0])}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="gstCertificate">GST Certificate</label>
          <input
            type="file"
            id="gstCertificate"
            accept="image/*,.pdf"
            onChange={(e) => setGstCertificate(e.target.files[0])}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bankProof">Bank Account Proof</label>
          <input
            type="file"
            id="bankProof"
            accept="image/*,.pdf"
            onChange={(e) => setBankProof(e.target.files[0])}
          />
        </div>
        
        {/* Choose one of these button options, not both */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Submit Documents'}
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary"
            component={Link}
            to="/onboarding"
          >
            Use Bulk ZIP Upload Instead
          </Button>
        </Box>
        
        {/* Bulk upload option information */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Want to upload all documents at once?
          </Typography>
          <Link to="/onboarding" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" color="secondary" sx={{ mt: 1 }}>
              Try Bulk ZIP Upload
            </Button>
          </Link>
        </Box>
      </form>
    </div>
  );
}

export default UploadForm;