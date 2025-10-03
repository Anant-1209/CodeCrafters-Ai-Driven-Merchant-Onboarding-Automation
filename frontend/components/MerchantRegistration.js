import React, { useState, useEffect } from 'react';
import { TextField, Button, Paper, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { auth } from '../firebase';
import axios from 'axios';

// Define the API base URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function MerchantRegistration({ onMerchantCreated }) {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testConnectionStatus, setTestConnectionStatus] = useState(null);
  
  // Pre-fill with current user's info
  useEffect(() => {
    if (auth && auth.currentUser) {
      setEmail(auth.currentUser.email || '');
      setBusinessName(auth.currentUser.displayName || '');
    }
  }, []);

  // Test the backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        setTestConnectionStatus('testing');
        const response = await axios.get(`${API_BASE_URL}/api/test`);
        console.log('Backend connection successful:', response.data);
        setTestConnectionStatus('connected');
      } catch (err) {
        console.error('Backend connection test failed:', err);
        setTestConnectionStatus('failed');
      }
    };
    
    testBackendConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Requesting new merchant ID...');
      
      // Get new merchant ID
      const idResponse = await axios.get(`${API_BASE_URL}/api/merchant/new`);
      const merchantId = idResponse.data.merchantId;
      
      console.log('Received merchant ID:', merchantId);
      
      // Initialize the merchant profile
      await axios.post(`${API_BASE_URL}/api/merchant/${merchantId}/profile`, {
        businessName,
        email,
        phoneNumber,
        createdAt: new Date().toISOString(),
      });
      
      console.log('Merchant profile created successfully');
      
      if (onMerchantCreated) {
        onMerchantCreated(merchantId);
      }
    } catch (err) {
      console.error('Registration error:', err);
      let errorMessage = 'Failed to register merchant. Please try again.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        
        if (err.response.status === 404) {
          errorMessage = 'Server endpoint not found. Please check if the backend server is running.';
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        errorMessage = 'No response from server. Please check your network connection.';
      } 
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Complete Your Merchant Profile
      </Typography>
      
      {testConnectionStatus === 'failed' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to connect to the backend server. Please make sure it's running at {API_BASE_URL}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Business Name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        
        <TextField
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          fullWidth
          margin="normal"
        />
        
        <Box sx={{ mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || testConnectionStatus === 'failed'}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Registering...' : 'Register Merchant'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}

export default MerchantRegistration;