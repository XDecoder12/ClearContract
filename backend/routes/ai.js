import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import authenticateToken from '../middleware/auth.js';
import { contractAnalysisPrompt } from '../config/prompts.js';
import ScanResult from '../models/ScanResult.js';

const router = express.Router();

router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { contractText, sourceUrl } = req.body;

    if (typeof contractText !== 'string') {
      return res.status(400).json({
        error: 'Contract text must be a string.'
      });
    }

    if (contractText.trim().length === 0) {
      return res.status(400).json({
        error: 'Contract text cannot be empty.'
      });
    }

    if (contractText.length > 50000) {
      return res.status(413).json({
        error: 'Contract text exceeds the 50,000 character limit.'
      });
    }

    if (sourceUrl !== undefined && typeof sourceUrl !== 'string') {
      return res.status(400).json({
        error: 'Source URL must be a string.'
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            darkPatternsFound: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string"
                  },
                  explanation: {
                    type: "string"
                  }
                },
                required: ["category", "explanation"]
              }
            },
            aiSummary: {
              type: "string"
            }
          },
          required: ["darkPatternsFound", "aiSummary"]
        }
      }
    });

    const prompt = `${contractAnalysisPrompt}

    ${contractText}`;

    const result = await model.generateContent(prompt);

    const analysis = JSON.parse(result.response.text());

    if (
      !analysis ||
      !Array.isArray(analysis.darkPatternsFound) ||
      typeof analysis.aiSummary !== 'string'
    ) {
      return res.status(502).json({
        error: 'AI returned an invalid analysis format.'
      });
    }

    const invalidPattern = analysis.darkPatternsFound.some(
      (pattern) =>
        !pattern ||
        typeof pattern.category !== 'string' ||
        typeof pattern.explanation !== 'string'
    );

    if (invalidPattern) {
      return res.status(502).json({
        error: 'AI returned an invalid dark pattern format.'
      });
    }

    const scanResult = new ScanResult({
      userId: req.user.userId,
      sourceUrl,
      originalText: contractText,
      darkPatternsFound: analysis.darkPatternsFound,
      aiSummary: analysis.aiSummary
    });

    await scanResult.save();

    res.status(200).json({
      success: true,
      analysis,
      scanId: scanResult._id
    });

  } catch (error) {
    console.error("AI Analysis Error:", error);

    res.status(500).json({
      error: 'Failed to analyze the contract.'
    });
  }
});

export default router;