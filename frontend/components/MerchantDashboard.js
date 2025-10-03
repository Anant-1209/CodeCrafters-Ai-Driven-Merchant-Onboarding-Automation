// Enhance MerchantDashboard.js with risk visualization
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import './MerchantDashboard.css';

// function MerchantDashboard() {
//   const [merchantData, setMerchantData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { merchantId } = useParams();
//   const navigate = useNavigate();
  
//   useEffect(() => {
//     async function fetchMerchantData() {
//       if (!merchantId) return;
      
//       try {
//         setLoading(true);
//         const response = await fetch(`http://localhost:8080/api/merchant/${merchantId}/status`);
        
//         if (!response.ok) {
//           throw new Error('Failed to fetch merchant data');
//         }
        
//         const data = await response.json();
//         setMerchantData(data);
//       } catch (err) {
//         console.error('Error fetching merchant data:', err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
    
//     fetchMerchantData();
//   }, [merchantId]);
  
//   if (!merchantId) {
//     return <MerchantLookup />;
//   }
  
//   if (loading) {
//     return <div className="loading">Loading merchant data...</div>;
//   }
  
//   if (error) {
//     return <div className="error">Error: {error}</div>;
//   }
  
//   if (!merchantData) {
//     return <div className="not-found">Merchant not found</div>;
//   }
  
//   const riskAssessment = merchantData.riskAssessment || {
//     overallRiskScore: 0.5,
//     riskLevel: 'moderate',
//     reasons: ['Risk assessment not available']
//   };
  
//   return (
//     <div className="merchant-dashboard">
//       <h1>Merchant Verification Status</h1>
      
//       <div className="merchant-info">
//         <div className="merchant-id">ID: {merchantId}</div>
//         <div className={`merchant-status ${merchantData.status}`}>
//           Status: {merchantData.status.toUpperCase()}
//         </div>
//       </div>
      
//       <div className="risk-assessment">
//         <h2>Risk Assessment</h2>
//         <div className={`risk-level ${riskAssessment.riskLevel}`}>
//           Risk Level: {riskAssessment.riskLevel.toUpperCase()}
//         </div>
//         <div className="risk-score-container">
//           <div className="risk-score-label">Risk Score:</div>
//           <div className="risk-score-bar">
//             <div 
//               className="risk-score-fill" 
//               style={{width: `${riskAssessment.overallRiskScore * 100}%`}}
//             ></div>
//           </div>
//           <div className="risk-score-value">{Math.round(riskAssessment.overallRiskScore * 100)}%</div>
//         </div>
        
//         {riskAssessment.reasons && riskAssessment.reasons.length > 0 && (
//           <div className="risk-reasons">
//             <h3>Risk Factors:</h3>
//             <ul>
//               {riskAssessment.reasons.map((reason, index) => (
//                 <li key={index}>{reason}</li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
      
//       <h2>Document Status</h2>
//       <div className="documents-grid">
//         {merchantData.documents && Object.entries(merchantData.documents).map(([docType, doc]) => (
//           <div key={docType} className={`document-card ${doc.status}`}>
//             <h3 className="document-type">{formatDocType(docType)}</h3>
//             <div className="document-status">Status: {doc.status.toUpperCase()}</div>
//             <div className="document-notes">{doc.verificationNotes}</div>
            
//             {docType === 'selfie' && doc.liveness !== undefined && (
//               <div className={`liveness-indicator ${doc.liveness ? 'passed' : 'failed'}`}>
//                 Liveness Check: {doc.liveness ? 'PASSED' : 'FAILED'}
//               </div>
//             )}
            
//             {doc.riskScore !== undefined && (
//               <div className="document-risk">
//                 <div className="risk-label">Document Risk:</div>
//                 <div className="risk-bar">
//                   <div 
//                     className="risk-fill" 
//                     style={{width: `${doc.riskScore * 100}%`}}
//                   ></div>
//                 </div>
//                 <div className="risk-value">{Math.round(doc.riskScore * 100)}%</div>
//               </div>
//             )}
            
//             {doc.extractedData && (
//               <div className="extracted-data">
//                 <h4>Extracted Data</h4>
//                 <ul>
//                   {Object.entries(doc.extractedData).map(([key, value]) => {
//                     // Skip showing full text
//                     if (key === 'fullText') return null;
                    
//                     return (
//                       <li key={key}>
//                         <strong>{formatKey(key)}:</strong> {formatValue(value)}
//                       </li>
//                     );
//                   })}
//                 </ul>
//               </div>
//             )}
            
//             <div className="upload-time">
//               Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
//             </div>
//           </div>
//         ))}
//       </div>
      
//       {merchantData.crossValidation && (
//         <div className="cross-validation">
//           <h2>Cross-Document Validation</h2>
//           <div className={`validation-status ${merchantData.crossValidation.validated ? 'passed' : 'failed'}`}>
//             Status: {merchantData.crossValidation.validated ? 'PASSED' : 'FAILED'}
//           </div>
//           <div className="consistency-score">
//             Consistency Score: {Math.round(merchantData.crossValidation.consistencyScore * 100)}%
//           </div>
          
//           {merchantData.crossValidation.issues && merchantData.crossValidation.issues.length > 0 && (
//             <div className="validation-issues">
//               <h3>Issues:</h3>
//               <ul>
//                 {merchantData.crossValidation.issues.map((issue, index) => (
//                   <li key={index}>{issue}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </div>
//       )}
      
//       {merchantData.status === 'approved' ? (
//         <div className="approval-message">
//           <h2>Congratulations!</h2>
//           <p>Your merchant account has been approved. You can now proceed with your business operations.</p>
//           {merchantData.autoApproved && (
//             <div className="auto-approved-badge">AUTO-APPROVED</div>
//           )}
//         </div>
//       ) : merchantData.status === 'rejected' ? (
//         <div className="rejection-message">
//           <h2>Verification Failed</h2>
//           <p>Unfortunately, your verification did not pass. Please review the issues above and resubmit your documents.</p>
          
//           {merchantData.rejectionReasons && merchantData.rejectionReasons.length > 0 && (
//             <div className="rejection-reasons">
//               <h3>Reasons for Rejection:</h3>
//               <ul>
//                 {merchantData.rejectionReasons.map((reason, index) => (
//                   <li key={index}>{reason}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
          
//           <button className="reapply-button" onClick={() => navigate('/')}>
//             Reapply with New Documents
//           </button>
//         </div>
//       ) : (
//         <div className="pending-message">
//           <h2>Verification in Progress</h2>
//           <p>Your documents are being reviewed. This process typically takes 1-2 business days.</p>
          
//           {riskAssessment.decision === 'manual_review' && (
//             <div className="manual-review-notice">
//               <p>Your application requires manual review by our team due to risk factors.</p>
//             </div>
//           )}
          
//           <button className="check-status-button" onClick={() => window.location.reload()}>
//             Refresh Status
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// function MerchantLookup() {
//   const [merchantId, setMerchantId] = useState('');
//   const navigate = useNavigate();
  
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (merchantId.trim()) {
//       navigate(`/merchant/${merchantId}`);
//     }
//   };
  
//   return (
//     <div className="merchant-lookup">
//       <h1>Check Verification Status</h1>
//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label htmlFor="merchantId">Enter your Merchant ID:</label>
//           <input
//             type="text"
//             id="merchantId"
//             value={merchantId}
//             onChange={(e) => setMerchantId(e.target.value)}
//             required
//           />
//         </div>
//         <button type="submit" className="primary-button">Check Status</button>
//       </form>
//     </div>
//   );
// }

// function formatDocType(type) {
//   const names = {
//     'selfie': 'Selfie Photo',
//     'pan': 'PAN Card',
//     'gst': 'GST Certificate',
//     'bank': 'Bank Document'
//   };
  
//   return names[type] || type;
// }

// function formatKey(key) {
//   const labels = {
//     'panNumber': 'PAN Number',
//     'name': 'Name',
//     'gstNumber': 'GST Number',
//     'accountNumber': 'Account Number',
//     'ifscCode': 'IFSC Code',
//     'faceConfidence': 'Face Confidence',
//     'rightEyeOpen': 'Right Eye Open',
//     'leftEyeOpen': 'Left Eye Open',
//     'businessName': 'Business Name',
//     'businessAddress': 'Business Address',
//     'dateOfBirth': 'Date of Birth',
//     'fatherName': 'Father\'s Name',
//     'accountHolderName': 'Account Holder',
//     'bankName': 'Bank Name'
//   };
  
//   return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
// }

// function formatValue(value) {
//   if (typeof value === 'boolean') {
//     return value ? 'Yes' : 'No';
//   }
//   if (typeof value === 'number') {
//     if (value >= 0 && value <= 1) {
//       return `${Math.round(value * 100)}%`;
//     }
//     return value.toString();
//   }
//   return value.toString();
// }

// export default MerchantDashboard;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MerchantDashboard.css';

function MerchantDashboard({ merchantId }) {
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMerchantData() {
      if (!merchantId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/merchant/${merchantId}/status`);
        setMerchantData(response.data);
      } catch (err) {
        console.error('Error fetching merchant data:', err);
        setError('Failed to load merchant data');
        
        // Demo data
        setMerchantData({
          merchantId,
          status: 'pending',
          profile: {
            businessName: 'Demo Business',
            merchantName: 'John Doe',
            email: 'john@example.com'
          },
          documents: {
            selfie: {
              status: 'pending',
              uploadedAt: new Date().toISOString(),
              verificationNotes: 'Document requires manual verification.'
            },
            pan: {
              status: 'approved',
              uploadedAt: new Date().toISOString(),
              verificationNotes: 'Document has been verified.'
            },
            gst: {
              status: 'pending',
              uploadedAt: new Date().toISOString(),
              verificationNotes: 'Document requires manual verification.'
            }
          }
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchMerchantData();
  }, [merchantId]);

  // Header component
  const Header = () => (
    <div className="header">
      <div className="header-title">AI-Driven Merchant Onboarding</div>
      <div className="header-nav">
        <Link to="/upload" className="nav-link">Upload</Link>
        <Link to="/admin" className="nav-link">Admin</Link>
        <Link to="/merchant" className="nav-link active">Merchant</Link>
      </div>
    </div>
  );

  if (!merchantId) {
    return (
      <>
        <Header />
        <div className="merchant-container">
          <div className="merchant-content">
            <div className="merchant-card">
              <h2>No Merchant ID Found</h2>
              <p>Please upload documents first to view your merchant dashboard.</p>
              <Link to="/upload" className="action-button">
                Go to Upload Page
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="merchant-container">
          <div className="loading-indicator">Loading merchant data...</div>
        </div>
      </>
    );
  }

  if (error && !merchantData) {
    return (
      <>
        <Header />
        <div className="merchant-container">
          <div className="error-message">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="merchant-container">
        <div className="merchant-content">
          <div className="merchant-card">
            <h2>Merchant Dashboard</h2>
            
            <div className="merchant-header">
              <div className="merchant-info">
                <div className="merchant-id">
                  <strong>Merchant ID:</strong> {merchantId}
                </div>
                {merchantData.profile && (
                  <>
                    <div className="merchant-name">
                      <strong>Name:</strong> {merchantData.profile.merchantName}
                    </div>
                    <div className="business-name">
                      <strong>Business:</strong> {merchantData.profile.businessName}
                    </div>
                  </>
                )}
              </div>
              
              <div className={`status-badge ${merchantData.status}`}>
                {merchantData.status.toUpperCase()}
              </div>
            </div>
            
            <div className={`status-message ${merchantData.status}`}>
              {merchantData.status === 'approved' ? (
                'Congratulations! Your merchant account has been approved.'
              ) : merchantData.status === 'rejected' ? (
                'Your account verification was not successful. Please review the document issues below.'
              ) : (
                'Your account is being verified. This process typically takes 1-2 business days.'
              )}
            </div>
            
            <h3>Document Status</h3>
            
            {!merchantData.documents || Object.keys(merchantData.documents).length === 0 ? (
              <div className="no-documents">
                No documents have been uploaded yet. Please upload your documents.
              </div>
            ) : (
              <div className="documents-grid">
                {Object.entries(merchantData.documents).map(([docType, doc]) => (
                  <div key={docType} className={`document-item ${doc.status}`}>
                    <div className="document-header">
                      <h4>{formatDocType(docType)}</h4>
                      <div className="document-status">{doc.status.toUpperCase()}</div>
                    </div>
                    <div className="document-notes">
                      {doc.verificationNotes || 'Awaiting verification'}
                    </div>
                    <div className="document-date">
                      Uploaded: {formatDate(doc.uploadedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="merchant-actions">
              <Link to="/upload" className="action-button primary">
                Upload More Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
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

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()}`;
}

export default MerchantDashboard;