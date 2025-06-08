const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function analyzeImage(buffer) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../scripts/image_analysis.py');

    // Create unique filename using timestamp and random number
    const fileName = `input_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
    const filePath = path.join(__dirname, '../uploads', fileName);

    // Ensure Uploads directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Write buffer to image file
    fs.writeFileSync(filePath, buffer);

    // Spawn Python process
    const python = spawn('python', [scriptPath, filePath]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      // Delete temp input image
      fs.unlink(filePath, (err) => {
        if (err) console.warn('Failed to delete input file:', filePath, err);
      });

      if (code !== 0) {
        console.error('Python stderr:', stderr);
        return reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(new Error(`Invalid JSON from Python: ${stdout}, Error: ${error.message}`));
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

module.exports = { analyzeImage };
