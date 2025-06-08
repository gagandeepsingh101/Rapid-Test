const prisma = require('../utils/prisma');
const { uploadImage } = require('../service/cloudinary');
const { spawn } = require('child_process');
const path = require('path');
const { Writable } = require('stream');

const createTestResult = async (req, res) => {
  try {
    const { date, userId } = req.body;
    const file = req.file;

    // Validate input
    if (!file || !date) {
      return res.status(400).json({ error: 'Date and image are required' });
    }

    const validMimetypes = ['image/jpeg', 'image/png'];
    if (!validMimetypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid image format. Only JPEG and PNG are supported.' });
    }

    // Function to spawn Python and pipe image buffer
    const runPythonScript = () => new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../scripts/image_analysis.py');
      const python = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000 // 10-second timeout
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', data => {
        output += data.toString();
      });

      python.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      python.on('close', code => {
        if (code !== 0) {
          return reject({
            error: 'Python script failed',
            stderr: errorOutput,
            stdout: output,
            code
          });
        }
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (err) {
          reject({
            error: 'Invalid JSON from Python script',
            details: err.message,
            rawOutput: output
          });
        }
      });

      python.on('error', err => {
        reject({
          error: 'Failed to start Python script',
          details: err.message
        });
      });

      // Create a Writable stream to pipe image buffer in chunks
      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          try {
            if (python.stdin.writable) {
              python.stdin.write(chunk, callback);
            } else {
              callback(new Error('Python stdin is not writable'));
            }
          } catch (err) {
            callback(err);
          }
        }
      });

      // Pipe image buffer to Python stdin
      const bufferStream = require('stream').Readable.from(file.buffer);
      bufferStream.pipe(writableStream);

      // Handle stream errors
      writableStream.on('error', err => {
        console.error('Writable stream error:', err);
        reject({
          error: 'Failed to write to Python stdin',
          details: err.message
        });
      });

      // Ensure stdin is closed properly
      bufferStream.on('end', () => {
        if (python.stdin.writable) {
          python.stdin.end();
        }
      });
    });

    // Execute Python analysis
    const analysisResult = await runPythonScript();
    if (analysisResult.error) {
      return res.status(500).json({ error: analysisResult.error, details: analysisResult.stderr || analysisResult.details });
    }

    // Map results to display-friendly values
    const resultMap = {
      Invalid: {
        result: 'Invalid',
        message: 'Invalid Test - Strip faulty',
        color: 'gray'
      },
      Positive: {
        result: 'Positive',
        message: 'Positive - Pregnancy detected',
        color: 'green'
      },
      Negative: {
        result: 'Negative',
        message: 'Negative - No pregnancy',
        color: 'red'
      },
      Unclear: {
        result: 'Unclear',
        message: 'Unclear - Retake test',
        color: 'yellow'
      }
    };

    const mapped = resultMap[analysisResult.status] || {
      result: 'Error',
      message: analysisResult.message || 'Analysis failed',
      color: 'gray'
    };

    // Upload original image to Cloudinary
    console.log(file);
    const imageUrl = await uploadImage(file);
    console.log('Image uploaded to Cloudinary:', imageUrl);

    // Save in DB
    const testResult = await prisma.testResult.create({
      data: {
        userId: req.user?.id || userId,
        date: new Date(date),
        result: mapped.result,
        imageUrl,
        result: analysisResult.status,
        confidence: analysisResult.confidence || null,
        controlIntensity: analysisResult.controlIntensity || 0,
        testIntensity: analysisResult.testIntensity || 0,
      }
    });

    // Respond to frontend
    return res.status(201).json({
      id: testResult.id,
      date: testResult.date,
      result: mapped.result,
      message: mapped.message,
      color: mapped.color,
      confidence: analysisResult.confidence || null,
      controlIntensity: analysisResult.controlIntensity || 0,
      testIntensity: analysisResult.testIntensity || 0,
      imageUrl
    });

  } catch (err) {
    console.error('Error in createTestResult:', err);
    return res.status(500).json({
      error: JSON.parse(err.stdout)?.error ||'Failed to process test result',
      details: err.message || err
    });
  }
};

const getTestHistory = async (req, res) => {
  try {
    const tests = await prisma.testResult.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });
    res.json(tests);
  } catch (error) {
    console.error('Error in getTestHistory:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTestResult = async (req, res) => {
  const { id } = req.params;

  try {
    const test = await prisma.testResult.findUnique({
      where: { id, userId: req.user.id }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    res.json(test);
  } catch (error) {
    console.error('Error in getTestResult:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createTestResult, getTestHistory, getTestResult };