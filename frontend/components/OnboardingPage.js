// import React, { useState, useEffect } from 'react';
// import { Container, Typography, Box, Paper, Stepper, Step, StepLabel, Button } from '@mui/material';
// import DocumentUploader from '../components/DocumentUploader';
// import ZipUploader from '../components/ZipUploader'; // Import the new component
// import VerificationStatus from '../components/VerificationStatus';
// import { useParams } from 'react-router-dom';

// const OnboardingPage = () => {
//   const { merchantId } = useParams();
//   const [activeStep, setActiveStep] = useState(0);
//   const [merchant, setMerchant] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [uploadMethod, setUploadMethod] = useState(null); // 'individual' or 'zip'
  
//   // Define steps
//   const steps = ['Select Upload Method', 'Upload Documents', 'Verification Status'];
  
//   useEffect(() => {
//     // Fetch merchant data if available
//     if (merchantId) {
//       fetchMerchantStatus();
//     } else {
//       setLoading(false);
//     }
//   }, [merchantId]);
  
//   const fetchMerchantStatus = async () => {
//     try {
//       const response = await fetch(`/api/merchant/${merchantId}/status`);
//       if (response.ok) {
//         const data = await response.json();
//         setMerchant(data);
//       }
//     } catch (err) {
//       setError('Failed to load merchant data');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const handleNext = () => {
//     setActiveStep((prevStep) => prevStep + 1);
//   };
  
//   const handleBack = () => {
//     setActiveStep((prevStep) => prevStep - 1);
//   };
  
//   const handleSelectUploadMethod = (method) => {
//     setUploadMethod(method);
//     handleNext();
//   };
  
//   const handleZipUploadSuccess = () => {
//     // Refresh merchant data and move to the next step
//     fetchMerchantStatus();
//     handleNext();
//   };
  
//   // Render different content based on current step
//   const getStepContent = (step) => {
//     switch (step) {
//       case 0:
//         return (
//           <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
//             <Button 
//               variant="contained" 
//               color="primary" 
//               size="large"
//               onClick={() => handleSelectUploadMethod('individual')}
//               sx={{ py: 3, px: 4 }}
//             >
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="h6">Individual Uploads</Typography>
//                 <Typography variant="body2">Upload documents one by one with step-by-step guidance</Typography>
//               </Box>
//             </Button>
            
//             <Button 
//               variant="contained" 
//               color="secondary" 
//               size="large"
//               onClick={() => handleSelectUploadMethod('zip')}
//               sx={{ py: 3, px: 4 }}
//             >
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="h6">Bulk ZIP Upload</Typography>
//                 <Typography variant="body2">Upload all documents at once in a ZIP file</Typography>
//               </Box>
//             </Button>
//           </Box>
//         );
//       case 1:
//         return uploadMethod === 'zip' ? (
//           <ZipUploader merchantId={merchantId} onSuccess={handleZipUploadSuccess} />
//         ) : (
//           <DocumentUploader merchantId={merchantId} onComplete={handleNext} />
//         );
//       case 2:
//         return <VerificationStatus merchantId={merchantId} />;
//       default:
//         return 'Unknown step';
//     }
//   };
  
//   return (
//     <Container maxWidth="lg">
//       <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
//         <Typography variant="h4" align="center" gutterBottom>
//           Merchant Onboarding
//         </Typography>
        
//         <Typography variant="subtitle1" align="center" gutterBottom color="text.secondary">
//           Merchant ID: {merchantId}
//         </Typography>
        
//         <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
//           {steps.map((label) => (
//             <Step key={label}>
//               <StepLabel>{label}</StepLabel>
//             </Step>
//           ))}
//         </Stepper>
        
//         {getStepContent(activeStep)}
        
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
//           <Button
//             variant="outlined"
//             disabled={activeStep === 0}
//             onClick={handleBack}
//           >
//             Back
//           </Button>
          
//           {uploadMethod !== 'zip' && activeStep < steps.length - 1 && activeStep !== 0 && (
//             <Button variant="contained" onClick={handleNext}>
//               Next
//             </Button>
//           )}
//         </Box>
//       </Paper>
//     </Container>
//   );
// };

// export default OnboardingPage;

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Container, Button } from '@mui/material';
import DocumentUpload from './DocumentUpload';

function OnboardingPage() {
  const { merchantId } = useParams();
  const [localMerchantId, setLocalMerchantId] = useState(merchantId || '');
  const navigate = useNavigate();
  
  const handleMerchantIdChange = (event) => {
    setLocalMerchantId(event.target.value);
  };
  
  const handleSuccess = () => {
    // Navigate to merchant dashboard on success
    navigate(`/merchant/${localMerchantId}`);
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Merchant Onboarding
        </Typography>
        
        <Box sx={{ width: '100%' }}>
          {/* Merchant ID input */}
          {!merchantId && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Merchant ID (required)
              </Typography>
              <input 
                type="text" 
                value={localMerchantId} 
                onChange={handleMerchantIdChange}
                placeholder="Enter merchant ID"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  fontSize: '16px', 
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </Box>
          )}
          
          {/* Document upload section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Your Documents
            </Typography>
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Please upload all required documents for verification. You'll need to provide:
            </Typography>
            
            <ul>
              <li>Selfie photo (required)</li>
              <li>PAN Card (required)</li>
              <li>GST certificate (if applicable)</li>
              <li>Bank account proof (recommended)</li>
            </ul>
            
            {localMerchantId ? (
              <DocumentUpload 
                initialMerchantId={localMerchantId} 
                onSuccess={handleSuccess}
              />
            ) : (
              <Typography variant="body2" color="error">
                Please enter a Merchant ID first
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleGoToAdmin}
            >
              View Admin Dashboard
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default OnboardingPage;