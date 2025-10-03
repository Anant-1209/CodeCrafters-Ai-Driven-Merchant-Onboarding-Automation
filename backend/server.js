const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();
const port = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS
app.use(cors());

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = 'gcf-v2-uploads-644168759457.us-central1.cloudfunctions.appspot.com';
const bucket = storage.bucket(bucketName);

// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const merchantId = req.body.merchantId || 'unknown';
  const filePrefix = req.body.filePrefix || '';
  const timestamp = Date.now();
  const fileName = `uploads/${merchantId}_${timestamp}_${filePrefix}`;
  
  const blob = bucket.file(fileName);
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: req.file.mimetype
  });

  blobStream.on('error', (err) => {
    console.error(err);
    res.status(500).send('Upload failed');
  });

  blobStream.on('finish', () => {
    res.status(200).send({
      message: 'Upload complete',
      fileName: fileName
    });
  });

  blobStream.end(req.file.buffer);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});