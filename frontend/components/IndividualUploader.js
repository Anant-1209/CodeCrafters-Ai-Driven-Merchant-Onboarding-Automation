import React, { useState } from 'react';
import axios from 'axios';

function IndividualUploader({ merchantId, onUploadSuccess, uploadedDocs = {} }) {
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Document types that can be uploaded
  const documentTypes = [
    { value: 'selfie', label: 'Selfie Photo' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'gst', label: 'GST Certificate' },
    { value: 'bank', label: 'Bank Statement' },
    { value: 'address', label: 'Address Proof' }
  ];

  // Filter out already uploaded document types
  const availableDocTypes = documentTypes.filter(
    docType => !uploadedDocs[docType.value]
  );

  const handleDocTypeChange = (event) => {
    setDocumentType(event.target.value);
    setSelectedFile(null);
    setError(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!merchantId) {
      setError('Merchant ID is required');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      console.log(`Uploading ${documentType} for merchant ${merchantId}`);
      
      // For demo/development only - bypass the actual API call
      // This simulates a successful upload
      setTimeout(() => {
        setProgress(100);
        
        // Mock response data
        const mockData = {
          documentType,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
          verificationNotes: 'Document is pending verification',
          extractedData: {
            documentType
          }
        };
        
        console.log("Mock upload successful:", mockData);
        
        if (onUploadSuccess) {
          onUploadSuccess({
            ...mockData,
            documentType
          });
        }
        
        // Reset form for next upload
        setDocumentType('');
        setSelectedFile(null);
        setUploading(false);
      }, 1500);
      
  
      
      // Get a signed URL for the upload
      const signedUrlResponse = await axios.get(
        '/api/signed-url', {
          params: {
            filename: selectedFile.name,
            contentType: selectedFile.type,
            merchantId: merchantId
          }
        }
      );
      
      const { url: signedUrl, objectName } = signedUrlResponse.data;

      // Upload the file to storage
      await axios.put(signedUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      // Process the document on the backend
      const processResponse = await axios.post(
        '/api/process-document', {
          merchantId,
          documentType,
          filePath: objectName,
          bucketName: process.env.REACT_APP_BUCKET_NAME || 'merchant-documents'
        }
      );
      
      // Call the success callback
      if (onUploadSuccess) {
        onUploadSuccess({
          ...processResponse.data,
          documentType
        });
      }
      
      // Reset form for next upload
      setDocumentType('');
      setSelectedFile(null);
      
      
      
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error details:', err.response?.data || 'No error details available');
      setError('Failed to upload document. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="individual-uploader">
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <div className="uploader-form">
        <div className="form-group">
          <label htmlFor="document-type">Document Type</label>
          <select
            id="document-type"
            value={documentType}
            onChange={handleDocTypeChange}
            disabled={uploading || availableDocTypes.length === 0}
          >
            <option value="">Select document type</option>
            {availableDocTypes.map((doc) => (
              <option key={doc.value} value={doc.value}>
                {doc.label}
              </option>
            ))}
          </select>
        </div>
        
        {documentType && (
          <>
            <div className="form-group">
              <label htmlFor={`upload-file-${documentType}`}>Select File</label>
              <input
                type="file"
                id={`upload-file-${documentType}`}
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>
            
            {selectedFile && (
              <div className="selected-file">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </div>
            )}
            
            <button
              type="button"
              className="upload-button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? `Uploading ${progress}%` : 'Upload Document'}
            </button>
            
            {uploading && progress > 0 && (
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            )}
          </>
        )}
        
        {availableDocTypes.length === 0 && (
          <div className="info-message">
            All document types have been uploaded.
          </div>
        )}
      </div>
    </div>
  );
}

export default IndividualUploader;