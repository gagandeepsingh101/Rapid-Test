const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(file) {
  try {
    // Validate environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary configuration in environment variables');
    }

    // Create a promise for the upload_stream
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'rapid_test_app',
          use_filename: true,
          unique_filename: false
        },
        (error, result) => {
          if (error) {
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          if (!result || !result.secure_url) {
            return reject(new Error('Cloudinary upload did not return a valid result'));
          }
          resolve(result.secure_url);
        }
      );

      // Pipe buffer to Cloudinary stream
      const bufferStream = require('stream').Readable.from(file.buffer);
      bufferStream.pipe(stream);

      // Handle stream errors
      bufferStream.on('error', (err) => {
        reject(new Error(`Buffer stream error: ${err.message}`));
      });
      stream.on('error', (err) => {
        reject(new Error(`Cloudinary stream error: ${err.message}`));
      });
    });

    const secureUrl = await uploadPromise;
    console.log('Image uploaded to Cloudinary:', secureUrl);
    return secureUrl;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message, error.stack);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
}

module.exports = { uploadImage };