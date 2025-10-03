import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VerificationStatus.css';

function VerificationStatus({ merchantId }) {
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMerchantData() {
      if (!merchantId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/merchant/${merchantId}/status`);
        setMerchantData(response.data);
      } catch (err) {
        console.error('Error fetching verification status:', err);
        setError('Failed to load verification status. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMerchantData();
    
    // Poll for updates every 10 seconds
    const intervalId = setInterval(fetchMerchantData, 10000);
    
    return () => clearInterval(intervalId);
  }, [merchantId]);

  const handleUploadMore = () => {
    navigate('/upload');
  };

  if (loading) {
    return <div className="loading">Loading verification status...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!merchantData) {
    return <div className="no-data">No verification data found for this merchant ID.</div>;
  }

  return (
    <div className="verification-status-container">
      <div className="verification-status-card">
        <h2>Verification Status</h2>
        
        <div className={`status-badge ${merchantData.status}`}>
          {merchantData.status.toUpperCase()}
        </div>
        
        <div className="merchant-info">
          <div>
            <strong>Merchant ID:</strong> {merchantId}
          </div>
          {merchantData.profile && (
            <>
              <div>
                <strong>Name:</strong> {merchantData.profile.businessName}
              </div>
              <div>
                <strong>Email:</strong> {merchantData.profile.email}
              </div>
            </>
          )}
        </div>
        
        <div className="status-message">
          {merchantData.status === 'approved' ? (
            <div className="approved-message">
              Congratulations! Your merchant account has been verified and approved.
            </div>
          ) : merchantData.status === 'rejected' ? (
            <div className="rejected-message">
              Your verification was not successful. Please review the document statuses below and resubmit.
            </div>
          ) : (
            <div className="pending-message">
              Your documents are being processed. This typically takes 1-2 business days.
            </div>
          )}
        </div>
        
        <h3>Document Status</h3>
        
        {!merchantData.documents || Object.keys(merchantData.documents).length === 0 ? (
          <div className="no-documents">No documents uploaded yet.</div>
        ) : (
          <div className="documents-grid">
            {Object.entries(merchantData.documents).map(([docType, doc]) => (
              <div key={docType} className={`document-card ${doc.status}`}>
                <div className="document-type">{formatDocType(docType)}</div>
                <div className="document-status">{doc.status.toUpperCase()}</div>
                <div className="document-notes">{doc.verificationNotes || 'No notes available'}</div>
                <div className="document-date">
                  Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="actions">
          <button 
            className="primary-button" 
            onClick={handleUploadMore}
          >
            Upload More Documents
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDocType(type) {
  const names = {
    'selfie': 'Selfie Photo',
    'pan': 'PAN Card',
    'gst': 'GST Certificate',
    'bank': 'Bank Statement',
    'address': 'Address Proof'
  };
  
  return names[type] || type;
}

export default VerificationStatus;