const express = require('express');
const multer = require('multer');
const aws = require('aws-sdk');
const auth = require('../middleware/auth');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure AWS SDK
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'private',
    };

    const result = await s3.upload(params).promise();

    res.json({ url: result.Location, key: result.Key });
  } catch (error) {
    console.error('S3 upload error', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

module.exports = router;
