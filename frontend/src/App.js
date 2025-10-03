// // // App.js with added registration flow
// // import React, { useState } from 'react';
// // import { Container, Box, Stepper, Step, StepLabel, Paper, Typography } from '@mui/material';
// // import MerchantRegistration from './MerchantRegistration';
// // import DocumentUpload from './DocumentUpload';
// // import ZipUploader from './ZipUploader';
// // import MerchantDashboard from './MerchantDashboard';

// // function App() {
// //   const [activeStep, setActiveStep] = useState(0);
// //   const [merchantId, setMerchantId] = useState(null);
  
// //   const steps = ['Register Merchant', 'Upload Documents', 'View Status'];
  
// //   // Handle merchant creation
// //   const handleMerchantCreated = (newMerchantId) => {
// //     setMerchantId(newMerchantId);
// //     setActiveStep(1); // Move to document upload step
// //   };
  
// //   // Handle document upload completion
// //   const handleDocumentsUploaded = () => {
// //     setActiveStep(2); // Move to status view step
// //   };
  
// //   return (
// //     <Container maxWidth="md">
// //       <Box sx={{ my: 4 }}>
// //         <Typography variant="h4" component="h1" gutterBottom align="center">
// //           Merchant Onboarding System
// //         </Typography>
        
// //         <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
// //           {steps.map((label) => (
// //             <Step key={label}>
// //               <StepLabel>{label}</StepLabel>
// //             </Step>
// //           ))}
// //         </Stepper>
        
// //         {activeStep === 0 && (
// //           <MerchantRegistration onMerchantCreated={handleMerchantCreated} />
// //         )}
        
// //         {activeStep === 1 && merchantId && (
// //           <Box>
// //             <ZipUploader 
// //               merchantId={merchantId} 
// //               onSuccess={handleDocumentsUploaded}
// //             />
// //             <Typography sx={{ mt: 2, mb: 1 }}>
// //               Or upload documents individually:
// //             </Typography>
// //             <DocumentUpload 
// //               merchantId={merchantId} 
// //               onSuccess={handleDocumentsUploaded}
// //             />
// //           </Box>
// //         )}
        
// //         {activeStep === 2 && merchantId && (
// //           <MerchantDashboard merchantId={merchantId} />
// //         )}
// //       </Box>
// //     </Container>
// //   );
// // }

// // export default App;

// // App.js with complete routing for existing components
// import React, { useState, useEffect } from 'react';
// import { Container, Box, Stepper, Step, StepLabel, Paper, Typography, Button, CircularProgress } from '@mui/material';
// import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { auth } from './firebase';
// import axios from 'axios';

// // Import your existing components
// import MerchantRegistration from './components/MerchantRegistration';
// import DocumentUpload from './components/DocumentUpload';
// import ZipUploader from './components/ZipUploader';
// import MerchantDashboard from './components/MerchantDashboard';
// import AdminDashboard from './components/AdminDashboard';
// import SignupPage from './components/SignupPage';
// import LoginPage from './components/LoginPage';
// import LogoutButton from './components/LogoutButton';
// import OnboardingPage from './components/OnboardingPage';
// import VerificationStatus from './components/VerificationStatus';
// import UploadForm from './components/UploadForm';

// // Main App component with complete routing
// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Public routes */}
//         <Route path="/signup" element={<SignupPage />} />
//         <Route path="/login" element={<LoginPage />} />
        
//         {/* Protected routes */}
//         <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />
//         <Route path="/dashboard" element={<ProtectedRoute><MerchantDashboard /></ProtectedRoute>} />
//         <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
//         <Route path="/merchant/:id" element={<ProtectedRoute><MerchantDetails /></ProtectedRoute>} />
//         <Route path="/merchant/:id/documents" element={<ProtectedRoute><MerchantDocuments /></ProtectedRoute>} />
//         <Route path="/verification/:merchantId" element={<ProtectedRoute><VerificationStatus /></ProtectedRoute>} />
//         <Route path="/upload" element={<ProtectedRoute><UploadForm /></ProtectedRoute>} />
        
//         {/* Home route */}
//         <Route path="/" element={<Home />} />
        
//         {/* 404 route */}
//         <Route path="*" element={<NotFound />} />
//       </Routes>
//     </Router>
//   );
// }

// // Home page that redirects based on authentication status
// function Home() {
//   // Your existing Home component code
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState(null);
  
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//       setLoading(false);
//     });
    
//     return () => unsubscribe();
//   }, []);
  
//   if (loading) {
//     return (
//       <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress />
//       </Container>
//     );
//   }
  
//   return <Navigate to={user ? "/onboarding" : "/login"} />;
// }

// // Protected route component - keep as is
// function ProtectedRoute({ children }) {
//   // Your existing ProtectedRoute component code
//   const [loading, setLoading] = useState(true);
//   const [authenticated, setAuthenticated] = useState(false);
  
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setAuthenticated(!!user);
//       setLoading(false);
//     });
    
//     return () => unsubscribe();
//   }, []);
  
//   if (loading) {
//     return (
//       <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress />
//       </Container>
//     );
//   }
  
//   return authenticated ? children : <Navigate to="/login" />;
// }

// // OnboardingFlow component - keep as is
// function OnboardingFlow() {
//   // Your existing OnboardingFlow component code
//   const [activeStep, setActiveStep] = useState(0);
//   const [merchantId, setMerchantId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
  
//   const steps = ['Register Merchant', 'Upload Documents', 'View Status'];
  
//   // Same useEffect code as before...
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         try {
//           const idToken = await user.getIdToken();
          
//           // Try to get merchant ID, or use mock data for demo
//           try {
//             const response = await axios.get('/api/auth/profile', {
//               headers: {
//                 Authorization: `Bearer ${idToken}`
//               }
//             });
            
//             if (response.data.merchantId) {
//               setMerchantId(response.data.merchantId);
//               setActiveStep(1);
//             }
//           } catch (error) {
//             console.error('Error fetching profile:', error);
//             // For development: Mock merchant ID
//             // Remove this in production
//             setMerchantId('demo-merchant-123');
//           }
//         } catch (error) {
//           console.error('Error getting ID token:', error);
//         }
//       } else {
//         navigate('/login');
//       }
//       setLoading(false);
//     });
    
//     return () => unsubscribe();
//   }, [navigate]);
  
//   // Same handlers as before...
//   const handleMerchantCreated = (newMerchantId) => {
//     setMerchantId(newMerchantId);
//     setActiveStep(1);
//   };
  
//   const handleDocumentsUploaded = () => {
//     setActiveStep(2);
//   };
  
//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       navigate('/login');
//     } catch (error) {
//       console.error('Error signing out:', error);
//     }
//   };
  
//   if (loading) {
//     return (
//       <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress />
//       </Container>
//     );
//   }
  
//   return (
//     <Container maxWidth="md">
//       <Box sx={{ my: 4 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//           <Typography variant="h4" component="h1" gutterBottom>
//             Merchant Onboarding System
//           </Typography>
//           <Button variant="outlined" color="secondary" onClick={handleLogout}>
//             Logout
//           </Button>
//         </Box>
        
//         <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
//           {steps.map((label) => (
//             <Step key={label}>
//               <StepLabel>{label}</StepLabel>
//             </Step>
//           ))}
//         </Stepper>
        
//         {activeStep === 0 && (
//           <MerchantRegistration onMerchantCreated={handleMerchantCreated} />
//         )}
        
//         {activeStep === 1 && merchantId && (
//           <Box>
//             <ZipUploader 
//               merchantId={merchantId} 
//               onSuccess={handleDocumentsUploaded}
//             />
//             <Typography sx={{ mt: 2, mb: 1 }}>
//               Or upload documents individually:
//             </Typography>
//             <DocumentUpload 
//               merchantId={merchantId} 
//               onSuccess={handleDocumentsUploaded}
//             />
//           </Box>
//         )}
        
//         {activeStep === 2 && merchantId && (
//           <Box>
//             <MerchantDashboard merchantId={merchantId} />
//             <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
//               <Button 
//                 variant="contained" 
//                 color="primary"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Go to Full Dashboard
//               </Button>
//             </Box>
//           </Box>
//         )}
//       </Box>
//     </Container>
//   );
// }

// // New component to handle merchant details route
// function MerchantDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
  
//   return (
//     <Container maxWidth="md" sx={{ py: 4 }}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//         <Typography variant="h4">Merchant #{id} Details</Typography>
//         <LogoutButton />
//       </Box>
      
//       <Paper sx={{ p: 3 }}>
//         {/* We can reuse MerchantDashboard with an id param */}
//         <MerchantDashboard merchantId={id} />
        
//         <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
//           <Button variant="outlined" onClick={() => navigate('/dashboard')}>
//             Back to Dashboard
//           </Button>
//           <Button 
//             variant="contained" 
//             color="primary"
//             onClick={() => navigate(`/merchant/${id}/documents`)}
//           >
//             View Documents
//           </Button>
//         </Box>
//       </Paper>
//     </Container>
//   );
// }

// // New component to handle merchant documents route
// function MerchantDocuments() {
//   const { id } = useParams();
//   const navigate = useNavigate();
  
//   return (
//     <Container maxWidth="md" sx={{ py: 4 }}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//         <Typography variant="h4">Documents for Merchant #{id}</Typography>
//         <LogoutButton />
//       </Box>
      
//       <Paper sx={{ p: 3 }}>
//         <DocumentUpload merchantId={id} />
        
//         <Box sx={{ mt: 4 }}>
//           <Button 
//             variant="outlined" 
//             onClick={() => navigate(`/merchant/${id}`)}
//           >
//             Back to Merchant Details
//           </Button>
//         </Box>
//       </Paper>
//     </Container>
//   );
// }

// // Simple 404 page
// function NotFound() {
//   return (
//     <Container sx={{ textAlign: 'center', py: 8 }}>
//       <Typography variant="h2" gutterBottom>404</Typography>
//       <Typography variant="h5" gutterBottom>Page Not Found</Typography>
//       <Typography paragraph>
//         The page you are looking for doesn't exist or has been moved.
//       </Typography>
//       <Button variant="contained" color="primary" href="/">
//         Go to Home
//       </Button>
//     </Container>
//   );
// }

// export default App;

// // // App.js with complete routing for existing components - Authentication removed
// // import React, { useState } from 'react';
// // import { Container, Box, Stepper, Step, StepLabel, Paper, Typography, Button, CircularProgress } from '@mui/material';
// // import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
// // import axios from 'axios';

// // // Import your existing components
// // import MerchantRegistration from './components/MerchantRegistration';
// // import DocumentUpload from './components/DocumentUpload';
// // import ZipUploader from './components/ZipUploader';
// // import MerchantDashboard from './components/MerchantDashboard';
// // import AdminDashboard from './components/AdminDashboard';
// // import OnboardingPage from './components/OnboardingPage';
// // import VerificationStatus from './components/VerificationStatus';
// // import UploadForm from './components/UploadForm';

// // // Main App component with complete routing
// // function App() {
// //   return (
// //     <Router>
// //       <Routes>
// //         {/* Onboarding and dashboard routes - no longer protected */}
// //         <Route path="/onboarding" element={<OnboardingFlow />} />
// //         <Route path="/dashboard" element={<MerchantDashboard />} />
// //         <Route path="/admin" element={<AdminDashboard />} />
// //         <Route path="/merchant/:id" element={<MerchantDetails />} />
// //         <Route path="/merchant/:id/documents" element={<MerchantDocuments />} />
// //         <Route path="/verification/:merchantId" element={<VerificationStatus />} />
// //         <Route path="/upload" element={<UploadForm />} />
        
// //         {/* Home route */}
// //         <Route path="/" element={<Navigate to="/onboarding" />} />
        
// //         {/* 404 route */}
// //         <Route path="*" element={<NotFound />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // // OnboardingFlow component - modified to remove authentication
// // function OnboardingFlow() {
// //   const [activeStep, setActiveStep] = useState(0);
// //   const [merchantId, setMerchantId] = useState(null);
// //   const [loading, setLoading] = useState(false);
// //   const navigate = useNavigate();
  
// //   const steps = ['Register Merchant', 'Upload Documents', 'View Status'];
  
// //   const handleMerchantCreated = (newMerchantId) => {
// //     setMerchantId(newMerchantId);
// //     setActiveStep(1);
// //   };
  
// //   const handleDocumentsUploaded = () => {
// //     setActiveStep(2);
// //   };
  
// //   if (loading) {
// //     return (
// //       <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
// //         <CircularProgress />
// //       </Container>
// //     );
// //   }
  
// //   return (
// //     <Container maxWidth="md">
// //       <Box sx={{ my: 4 }}>
// //         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
// //           <Typography variant="h4" component="h1" gutterBottom>
// //             Merchant Onboarding System
// //           </Typography>
// //         </Box>
        
// //         <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
// //           {steps.map((label) => (
// //             <Step key={label}>
// //               <StepLabel>{label}</StepLabel>
// //             </Step>
// //           ))}
// //         </Stepper>
        
// //         {activeStep === 0 && (
// //           <MerchantRegistration onMerchantCreated={handleMerchantCreated} />
// //         )}
        
// //         {activeStep === 1 && merchantId && (
// //           <Box>
// //             <ZipUploader 
// //               merchantId={merchantId} 
// //               onSuccess={handleDocumentsUploaded}
// //             />
// //             <Typography sx={{ mt: 2, mb: 1 }}>
// //               Or upload documents individually:
// //             </Typography>
// //             <DocumentUpload 
// //               merchantId={merchantId} 
// //               onSuccess={handleDocumentsUploaded}
// //             />
// //           </Box>
// //         )}
        
// //         {activeStep === 2 && merchantId && (
// //           <Box>
// //             <MerchantDashboard merchantId={merchantId} />
// //             <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
// //               <Button 
// //                 variant="contained" 
// //                 color="primary"
// //                 onClick={() => navigate('/dashboard')}
// //               >
// //                 Go to Full Dashboard
// //               </Button>
// //             </Box>
// //           </Box>
// //         )}
// //       </Box>
// //     </Container>
// //   );
// // }

// // // New component to handle merchant details route - LogoutButton removed
// // function MerchantDetails() {
// //   const { id } = useParams();
// //   const navigate = useNavigate();
  
// //   return (
// //     <Container maxWidth="md" sx={{ py: 4 }}>
// //       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
// //         <Typography variant="h4">Merchant #{id} Details</Typography>
// //       </Box>
      
// //       <Paper sx={{ p: 3 }}>
// //         {/* We can reuse MerchantDashboard with an id param */}
// //         <MerchantDashboard merchantId={id} />
        
// //         <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
// //           <Button variant="outlined" onClick={() => navigate('/dashboard')}>
// //             Back to Dashboard
// //           </Button>
// //           <Button 
// //             variant="contained" 
// //             color="primary"
// //             onClick={() => navigate(`/merchant/${id}/documents`)}
// //           >
// //             View Documents
// //           </Button>
// //         </Box>
// //       </Paper>
// //     </Container>
// //   );
// // }

// // // New component to handle merchant documents route - LogoutButton removed
// // function MerchantDocuments() {
// //   const { id } = useParams();
// //   const navigate = useNavigate();
  
// //   return (
// //     <Container maxWidth="md" sx={{ py: 4 }}>
// //       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
// //         <Typography variant="h4">Documents for Merchant #{id}</Typography>
// //       </Box>
      
// //       <Paper sx={{ p: 3 }}>
// //         <DocumentUpload merchantId={id} />
        
// //         <Box sx={{ mt: 4 }}>
// //           <Button 
// //             variant="outlined" 
// //             onClick={() => navigate(`/merchant/${id}`)}
// //           >
// //             Back to Merchant Details
// //           </Button>
// //         </Box>
// //       </Paper>
// //     </Container>
// //   );
// // }

// // // Simple 404 page
// // function NotFound() {
// //   return (
// //     <Container sx={{ textAlign: 'center', py: 8 }}>
// //       <Typography variant="h2" gutterBottom>404</Typography>
// //       <Typography variant="h5" gutterBottom>Page Not Found</Typography>
// //       <Typography paragraph>
// //         The page you are looking for doesn't exist or has been moved.
// //       </Typography>
// //       <Button variant="contained" color="primary" href="/">
// //         Go to Home
// //       </Button>
// //     </Container>
// //   );
// // }

// // export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import DocumentUpload from './components/DocumentUpload';
import MerchantDashboard from './components/MerchantDashboard';
import AdminDashboard from './components/AdminDashboard';
import VerificationStatus from './components/VerificationStatus';
import MerchantRegistration from './components/MerchantRegistration';
import OnboardingPage from './components/OnboardingPage';

function App() {
  // Use merchant ID from localStorage if available
  const merchantId = localStorage.getItem('merchantId') || 'default-merchant-123';
  
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Main document upload route */}
          <Route path="/upload" element={<DocumentUpload />} />
          
          {/* Merchant Dashboard */}
          <Route path="/merchant" element={<MerchantDashboard merchantId={merchantId} />} />
          
          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Verification Status (not in primary flow but kept for reference) */}
          <Route path="/verification" element={<VerificationStatus merchantId={merchantId} />} />
          
          {/* Registration if needed */}
          <Route path="/register" element={<MerchantRegistration onMerchantCreated={(id) => {
            localStorage.setItem('merchantId', id);
            return <Navigate to="/upload" />;
          }} />} />
          
          {/* Onboarding flow if needed */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          
          {/* Home route redirects to upload */}
          <Route path="/" element={<Navigate to="/upload" />} />
          
          {/* 404 route */}
          <Route path="*" element={<div className="not-found-page">Page not found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;