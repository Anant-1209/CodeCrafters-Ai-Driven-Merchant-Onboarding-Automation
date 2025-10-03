// import React, { useState, useEffect } from 'react';
// import './AdminDashboard.css'; // We'll create this later

// function AdminDashboard() {
//   const [merchants, setMerchants] = useState([]);
//   const [selectedMerchant, setSelectedMerchant] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   // Fetch all merchants
//   useEffect(() => {
//     async function fetchMerchants() {
//       try {
//         setLoading(true);
//         const response = await fetch('http://localhost:8080/api/merchants');
        
//         if (!response.ok) {
//           throw new Error('Failed to fetch merchants');
//         }
        
//         const data = await response.json();
//         setMerchants(data);
//       } catch (err) {
//         console.error('Error fetching merchants:', err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
    
//     fetchMerchants();
//   }, []);
  
//   async function fetchMerchantDetails(merchantId) {
//     try {
//       const response = await fetch(`http://localhost:8080/api/merchant/${merchantId}/status`);
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch merchant details');
//       }
      
//       const data = await response.json();
//       setSelectedMerchant(data);
//     } catch (err) {
//       console.error('Error fetching merchant details:', err);
//       setError(`Error loading merchant details: ${err.message}`);
//     }
//   }
  
//   async function updateDocumentStatus(merchantId, documentType, status, notes) {
//     try {
//       const response = await fetch(`http://localhost:8080/api/merchant/${merchantId}/document/${documentType}/status`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ status, notes })
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to update document status');
//       }
      
//       // Refresh merchant details
//       await fetchMerchantDetails(merchantId);
//     } catch (err) {
//       console.error('Error updating document status:', err);
//       setError(`Error updating document: ${err.message}`);
//     }
//   }
  
//   async function updateMerchantStatus(merchantId, status) {
//     try {
//       const response = await fetch(`http://localhost:8080/api/merchant/${merchantId}/status`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ status })
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to update merchant status');
//       }
      
//       // Refresh merchant details
//       await fetchMerchantDetails(merchantId);
      
//       // Update merchants list
//       setMerchants(merchants.map(m => 
//         m.merchantId === merchantId ? { ...m, status } : m
//       ));
//     } catch (err) {
//       console.error('Error updating merchant status:', err);
//       setError(`Error updating merchant: ${err.message}`);
//     }
//   }
  
//   if (loading && !selectedMerchant) {
//     return <div className="loading">Loading merchants...</div>;
//   }
  
//   return (
//     <div className="admin-dashboard">
//       <h1>Admin Dashboard</h1>
      
//       {error && <div className="error-message">{error}</div>}
      
//       <div className="dashboard-container">
//         <div className="merchants-list">
//           <h2>Merchants</h2>
//           <div className="status-filters">
//             <button className="status-filter active">All</button>
//             <button className="status-filter">Pending</button>
//             <button className="status-filter">Approved</button>
//             <button className="status-filter">Rejected</button>
//           </div>
          
//           {merchants.length === 0 ? (
//             <div className="no-merchants">No merchants found</div>
//           ) : (
//             <ul className="merchants">
//               {merchants.map(merchant => (
//                 <li 
//                   key={merchant.merchantId} 
//                   className={`merchant-item ${merchant.status} ${selectedMerchant?.merchantId === merchant.merchantId ? 'selected' : ''}`}
//                   onClick={() => fetchMerchantDetails(merchant.merchantId)}
//                 >
//                   <div className="merchant-item-id">{merchant.merchantId}</div>
//                   <div className="merchant-item-status">{merchant.status}</div>
//                   <div className="merchant-item-date">
//                     {new Date(merchant.updatedAt).toLocaleDateString()}
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
        
//         <div className="merchant-details">
//           {selectedMerchant ? (
//             <>
//               <h2>Merchant: {selectedMerchant.merchantId}</h2>
//               <div className={`merchant-status ${selectedMerchant.status}`}>
//                 Status: {selectedMerchant.status.toUpperCase()}
//               </div>
              
//               <div className="merchant-actions">
//                 <button 
//                   className="approve-button"
//                   onClick={() => updateMerchantStatus(selectedMerchant.merchantId, 'approved')}
//                   disabled={selectedMerchant.status === 'approved'}
//                 >
//                   Approve Merchant
//                 </button>
//                 <button 
//                   className="reject-button"
//                   onClick={() => updateMerchantStatus(selectedMerchant.merchantId, 'rejected')}
//                   disabled={selectedMerchant.status === 'rejected'}
//                 >
//                   Reject Merchant
//                 </button>
//                 <button 
//                   className="reset-button"
//                   onClick={() => updateMerchantStatus(selectedMerchant.merchantId, 'pending')}
//                   disabled={selectedMerchant.status === 'pending'}
//                 >
//                   Reset to Pending
//                 </button>
//               </div>
              
//               <h3>Documents</h3>
//               <div className="documents-list">
//                 {selectedMerchant.documents && Object.entries(selectedMerchant.documents).map(([docType, doc]) => (
//                   <div key={docType} className={`document-review ${doc.status}`}>
//                     <h4>{formatDocType(docType)}</h4>
//                     <div className="document-review-status">
//                       Status: {doc.status.toUpperCase()}
//                     </div>
//                     <div className="document-review-notes">
//                       {doc.verificationNotes}
//                     </div>
                    
//                     <div className="document-preview">
//                       <a href={`http://localhost:8080/api/document/${doc.path}`} target="_blank" rel="noopener noreferrer">
//                         View Document
//                       </a>
//                     </div>
                    
//                     {doc.extractedData && (
//                       <div className="extracted-data">
//                         <h5>Extracted Data</h5>
//                         <pre>{JSON.stringify(doc.extractedData, null, 2)}</pre>
//                       </div>
//                     )}
                    
//                     <div className="document-actions">
//                       <button 
//                         className="approve-button"
//                         onClick={() => updateDocumentStatus(
//                           selectedMerchant.merchantId, 
//                           docType, 
//                           'approved', 
//                           'Verified by admin'
//                         )}
//                         disabled={doc.status === 'approved'}
//                       >
//                         Approve Document
//                       </button>
//                       <button 
//                         className="reject-button"
//                         onClick={() => updateDocumentStatus(
//                           selectedMerchant.merchantId, 
//                           docType, 
//                           'rejected', 
//                           'Rejected by admin - Please resubmit'
//                         )}
//                         disabled={doc.status === 'rejected'}
//                       >
//                         Reject Document
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </>
//           ) : (
//             <div className="no-merchant-selected">
//               Select a merchant from the list to view details
//             </div>
//           )}
//         </div>
//       </div>
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

// export default AdminDashboard;




import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [hideRejected, setHideRejected] = useState(false);
  const [deletedMerchantIds, setDeletedMerchantIds] = useState([]);
  const navigate = useNavigate();
  
  // Load deleted merchant IDs from localStorage on component mount
  useEffect(() => {
    const storedDeletedIds = localStorage.getItem('deletedMerchantIds');
    if (storedDeletedIds) {
      setDeletedMerchantIds(JSON.parse(storedDeletedIds));
    }
  }, []);
  
  // Fetch all merchants
  useEffect(() => {
    fetchMerchants();
  }, [deletedMerchantIds]);
  
  async function fetchMerchants() {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/merchants');
      
      if (!response.ok) {
        throw new Error('Failed to fetch merchants');
      }
      
      let data = await response.json();
      
      // Filter out merchants that were previously deleted
      if (deletedMerchantIds.length > 0) {
        data = data.filter(merchant => !deletedMerchantIds.includes(merchant.merchantId));
      }
      
      setMerchants(data);
    } catch (err) {
      console.error('Error fetching merchants:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchMerchantDetails(merchantId) {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/merchant/${merchantId}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch merchant details');
      }
      
      const data = await response.json();
      setSelectedMerchant(data);
    } catch (err) {
      console.error('Error fetching merchant details:', err);
      setError(`Error loading merchant details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function updateDocumentStatus(merchantId, documentType, status, notes) {
    try {
      const response = await fetch(`http://localhost:3000/api/merchant/${merchantId}/document/${documentType}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document status');
      }
      
      // Refresh merchant details
      await fetchMerchantDetails(merchantId);
    } catch (err) {
      console.error('Error updating document status:', err);
      setError(`Error updating document: ${err.message}`);
    }
  }
  
  async function updateMerchantStatus(merchantId, status) {
    try {
      const response = await fetch(`http://localhost:3000/api/merchant/${merchantId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update merchant status');
      }
      
      // Refresh merchant details
      await fetchMerchantDetails(merchantId);
      
      // Update merchants list
      setMerchants(merchants.map(m => 
        m.merchantId === merchantId ? { ...m, status } : m
      ));
    } catch (err) {
      console.error('Error updating merchant status:', err);
      setError(`Error updating merchant: ${err.message}`);
    }
  }
  
  // Delete a merchant and persist the deletion in localStorage
  async function deleteMerchant(merchantId, event) {
    // Stop event propagation to prevent selecting the merchant
    if (event) {
      event.stopPropagation();
    }
    
    if (!window.confirm("Are you sure you want to delete this merchant?")) {
      return;
    }
    
    try {
      // Try to delete on backend
      try {
        const response = await fetch(`http://localhost:3000/api/merchant/${merchantId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.warn('Backend delete failed, using local storage for persistence');
        }
      } catch (apiErr) {
        console.warn('API error during delete, using local storage for persistence:', apiErr);
      }
      
      // Store the deleted merchant ID in local storage
      const updatedDeletedIds = [...deletedMerchantIds, merchantId];
      setDeletedMerchantIds(updatedDeletedIds);
      localStorage.setItem('deletedMerchantIds', JSON.stringify(updatedDeletedIds));
      
      // Update UI by removing the merchant
      setMerchants(merchants.filter(m => m.merchantId !== merchantId));
      
      // If the deleted merchant was selected, clear selection
      if (selectedMerchant && selectedMerchant.merchantId === merchantId) {
        setSelectedMerchant(null);
      }
    } catch (err) {
      console.error('Error deleting merchant:', err);
      setError(`Error deleting merchant: ${err.message}`);
    }
  }
  
  // Delete all rejected merchants and persist in localStorage
  async function deleteAllRejected() {
    if (!window.confirm("Are you sure you want to delete ALL rejected merchants?")) {
      return;
    }
    
    try {
      // Get all rejected merchant IDs
      const rejectedIds = merchants
        .filter(m => m.status === 'rejected')
        .map(m => m.merchantId);
      
      if (rejectedIds.length === 0) {
        alert("No rejected merchants to delete");
        return;
      }
      
      // Try API calls for each delete
      for (const id of rejectedIds) {
        try {
          await fetch(`http://localhost:3000/api/merchant/${id}`, {
            method: 'DELETE'
          });
        } catch (apiErr) {
          console.warn(`API error during delete of merchant ${id}:`, apiErr);
        }
      }
      
      // Store all deleted IDs in localStorage
      const updatedDeletedIds = [...deletedMerchantIds, ...rejectedIds];
      setDeletedMerchantIds(updatedDeletedIds);
      localStorage.setItem('deletedMerchantIds', JSON.stringify(updatedDeletedIds));
      
      // Update UI by removing rejected merchants
      setMerchants(merchants.filter(m => m.status !== 'rejected'));
      
      // If a rejected merchant was selected, clear selection
      if (selectedMerchant && selectedMerchant.status === 'rejected') {
        setSelectedMerchant(null);
      }
    } catch (err) {
      console.error('Error deleting rejected merchants:', err);
      setError(`Error deleting rejected merchants: ${err.message}`);
    }
  }
  
  // Clear all deleted merchants history
  function clearDeletedMerchants() {
    if (window.confirm("This will restore all previously deleted merchants. Continue?")) {
      localStorage.removeItem('deletedMerchantIds');
      setDeletedMerchantIds([]);
      fetchMerchants(); // Refresh the list
    }
  }
  
  // Handle document view
  const handleViewDocument = (docPath) => {
    if (!docPath) {
      console.error("Document path is missing");
      return;
    }
    
    // Normalize the document path to work with the backend
    let documentUrl;
    
    // Check if the path is already a full URL
    if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
      documentUrl = docPath;
    } 
    // Check if it's a relative path with /api/
    else if (docPath.startsWith('/api/')) {
      documentUrl = `http://localhost:3000${docPath}`;
    }
    // Check if it's a path with /uploads/
    else if (docPath.includes('/uploads/')) {
      documentUrl = `http://localhost:3000${docPath}`;
    }
    // Check if it's just a filename
    else if (docPath.includes('.')) {
      documentUrl = `http://localhost:3000/uploads/${docPath}`;
    }
    // Otherwise, assume it's a document ID or path without a leading slash
    else {
      documentUrl = `http://localhost:3000/api/document/${docPath}`;
    }
    
    // Open document in new tab
    window.open(documentUrl, '_blank');
  };
  
  // Filter merchants based on status and hideRejected setting
  const getFilteredMerchants = () => {
    let filtered = [...merchants];
    
    // Apply status filter if not "All"
    if (activeFilter !== 'All') {
      filtered = filtered.filter(merchant => 
        merchant.status.toLowerCase() === activeFilter.toLowerCase()
      );
    }
    
    // Hide rejected merchants if toggle is on
    if (hideRejected) {
      filtered = filtered.filter(merchant => merchant.status !== 'rejected');
    }
    
    return filtered;
  };
  
  // Handle filter button click
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };
  
  if (loading && !selectedMerchant && merchants.length === 0) {
    return (
      <>
        <NavigationHeader />
        <div className="loading">Loading merchants...</div>
      </>
    );
  }
  
  return (
    <>
      <NavigationHeader />
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        
        {error && <div className="error-message">{error}</div>}
        {deletedMerchantIds.length > 0 && (
          <div className="info-message">
            {deletedMerchantIds.length} merchant(s) hidden due to previous deletion. 
            <button onClick={clearDeletedMerchants} className="text-button">
              Restore All
            </button>
          </div>
        )}
        
        <div className="dashboard-container">
          <div className="merchants-list">
            <div className="merchants-header">
              <h2>Merchants</h2>
              <button 
                className="delete-all-rejected-button"
                onClick={deleteAllRejected}
              >
                Delete All Rejected
              </button>
            </div>
            
            <div className="status-filters">
              <button 
                className={`status-filter ${activeFilter === 'All' ? 'active' : ''}`}
                onClick={() => handleFilterClick('All')}
              >
                All
              </button>
              <button 
                className={`status-filter ${activeFilter === 'pending' ? 'active' : ''}`}
                onClick={() => handleFilterClick('pending')}
              >
                Pending
              </button>
              <button 
                className={`status-filter ${activeFilter === 'approved' ? 'active' : ''}`}
                onClick={() => handleFilterClick('approved')}
              >
                Approved
              </button>
              <button 
                className={`status-filter ${activeFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => handleFilterClick('rejected')}
              >
                Rejected
              </button>
              
              <div className="hide-rejected-toggle">
                <label>
                  <input 
                    type="checkbox" 
                    checked={hideRejected}
                    onChange={() => setHideRejected(!hideRejected)}
                  />
                  Hide Rejected
                </label>
              </div>
            </div>
            
            {getFilteredMerchants().length === 0 ? (
              <div className="no-merchants">No merchants found</div>
            ) : (
              <ul className="merchants">
                {getFilteredMerchants().map(merchant => (
                  <li 
                    key={merchant.merchantId} 
                    className={`merchant-item ${merchant.status} ${selectedMerchant?.merchantId === merchant.merchantId ? 'selected' : ''}`}
                    onClick={() => fetchMerchantDetails(merchant.merchantId)}
                  >
                    <div className="merchant-item-id">{merchant.merchantId}</div>
                    <div className="merchant-item-status">{merchant.status}</div>
                    <div className="merchant-item-date">
                      {new Date(merchant.updatedAt).toLocaleDateString()}
                    </div>
                    
                    {merchant.status === 'rejected' && (
                      <button 
                        className="delete-merchant-button"
                        onClick={(e) => deleteMerchant(merchant.merchantId, e)}
                        title="Delete this merchant"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="merchant-details">
            {selectedMerchant ? (
              <>
                <h2>Merchant: {selectedMerchant.merchantId}</h2>
                <div className={`merchant-status ${selectedMerchant.status}`}>
                  Status: {selectedMerchant.status.toUpperCase()}
                </div>
                
                <div className="merchant-actions">
                  <button 
                    className="approve-button"
                    onClick={() => updateMerchantStatus(selectedMerchant.merchantId, 'approved')}
                    disabled={selectedMerchant.status === 'approved'}
                  >
                    Approve Merchant
                  </button>
                  <button 
                    className="reject-button"
                    onClick={() => updateMerchantStatus(selectedMerchant.merchantId, 'rejected')}
                    disabled={selectedMerchant.status === 'rejected'}
                  >
                    Reject Merchant
                  </button>
                  <button 
                    className="reset-button"
                    onClick={() => updateMerchantStatus(selectedMerchant.merchantId, 'pending')}
                    disabled={selectedMerchant.status === 'pending'}
                  >
                    Reset to Pending
                  </button>
                  
                  {selectedMerchant.status === 'rejected' && (
                    <button 
                      className="delete-button"
                      onClick={() => deleteMerchant(selectedMerchant.merchantId)}
                    >
                      Delete Merchant
                    </button>
                  )}
                </div>
                
                <h3>Documents</h3>
                <div className="documents-list">
                  {selectedMerchant.documents && Object.entries(selectedMerchant.documents).map(([docType, doc]) => (
                    <div key={docType} className={`document-review ${doc.status}`}>
                      <h4>{formatDocType(docType)}</h4>
                      <div className="document-review-status">
                        Status: {doc.status.toUpperCase()}
                      </div>
                      <div className="document-review-notes">
                        {doc.verificationNotes}
                      </div>
                      
                      <div className="document-preview">
                        <button 
                          className="view-document-button"
                          onClick={() => handleViewDocument(doc.path)}
                        >
                          View Document
                        </button>
                      </div>
                      
                      {doc.extractedData && (
                        <div className="extracted-data">
                          <h5>Extracted Data</h5>
                          <pre>{JSON.stringify(doc.extractedData, null, 2)}</pre>
                        </div>
                      )}
                      
                      <div className="document-actions">
                        <button 
                          className="approve-button"
                          onClick={() => updateDocumentStatus(
                            selectedMerchant.merchantId, 
                            docType, 
                            'approved', 
                            'Verified by admin'
                          )}
                          disabled={doc.status === 'approved'}
                        >
                          Approve Document
                        </button>
                        <button 
                          className="reject-button"
                          onClick={() => updateDocumentStatus(
                            selectedMerchant.merchantId, 
                            docType, 
                            'rejected', 
                            'Rejected by admin - Please resubmit'
                          )}
                          disabled={doc.status === 'rejected'}
                        >
                          Reject Document
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-merchant-selected">
                Select a merchant from the list to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Navigation Header Component
function NavigationHeader() {
  return (
    <div className="app-header">
      <div className="header-logo">AI-Driven Merchant Onboarding</div>
      <nav className="header-nav">
        <Link to="/" className="nav-item">Home</Link>
        <Link to="/upload" className="nav-item">Upload Documents</Link>
        <Link to="/admin" className="nav-item active">Admin Dashboard</Link>
        <Link to="/merchant" className="nav-item">Merchant Dashboard</Link>
      </nav>
    </div>
  );
}

function formatDocType(type) {
  const names = {
    'selfie': 'Selfie Photo',
    'pan': 'PAN Card',
    'gst': 'GST Certificate',
    'bank': 'Bank Document'
  };
  
  return names[type] || type;
}

export default AdminDashboard;