const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const { PassThrough } = require('stream');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const port = 3000;

// Set up multer for file handling
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to upload images to Cloudinary
const uploadToCloudinary = (imageBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          reject(new Error('Failed to upload image'));
        } else {
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      }
    );

    const readableStream = new PassThrough();
    readableStream.end(imageBuffer);
    readableStream.pipe(uploadStream);
  });
};

// Route to handle image uploads
app.post('/upload/:folder', upload.single('image'), async (req, res) => {
  const { folder } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const { buffer } = req.file;
    const result = await uploadToCloudinary(buffer, folder);
    res.json({ message: 'Image uploaded successfully', ...result });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
