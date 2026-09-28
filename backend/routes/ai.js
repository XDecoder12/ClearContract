import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import authenticateToken from '../middleware/auth.js';
import { contractAnalysisPrompt } from '../config/prompts.js';
import ScanResult from '../models/ScanResult.js';

const router = express.Router();

const MAX_CONTRACT_CHARS = 200000;
const CHUNK_SIZE = 12000;
const CHUNK_OVERLAP = 500;

const splitContractIntoChunks = (text) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Prefer breaking at a newline so clauses are less likely to be cut in half.
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);

      if (lastNewline > start + CHUNK_SIZE * 0.6) {
        end = lastNewline;
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
};

const analysisResponseSchema = {
  type: 'object',
  properties: {
    darkPatternsFound: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string'
          },
          explanation: {
            type: 'string'
          }
        },
        required: ['category', 'explanation']
      }
    },
    aiSummary: {
      type: 'string'
    }
  },
  required: ['darkPatternsFound', 'aiSummary']
};

const createAnalysisModel = () => {
  const model = createAnalysisModel();
};

const analyzeContractChunk = async (model, chunk, chunkIndex, totalChunks) => {
  const prompt = `${contractAnalysisPrompt}

This is section ${chunkIndex + 1} of ${totalChunks} of the contract.
Analyze only the text provided in this section.
Do not assume facts from other sections that are not included here.

${chunk}`;

  const result = await model.generateContent(prompt);

  const analysis = JSON.parse(result.response.text());

  if (
    !analysis ||
    !Array.isArray(analysis.darkPatternsFound) ||
    typeof analysis.aiSummary !== 'string'
  ) {
    throw new Error('AI returned an invalid analysis format.');
  }

  const invalidPattern = analysis.darkPatternsFound.some(
    (pattern) =>
      !pattern ||
      typeof pattern.category !== 'string' ||
      typeof pattern.explanation !== 'string'
  );

  if (invalidPattern) {
    throw new Error('AI returned an invalid dark pattern format.');
  }

  return analysis;
};

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

    if (contractText.length > MAX_CONTRACT_CHARS) {
      return res.status(413).json({
        error: `Contract text exceeds the ${MAX_CONTRACT_CHARS.toLocaleString()} character limit.`
      });
    }

    if (sourceUrl !== undefined && typeof sourceUrl !== 'string') {
      return res.status(400).json({
        error: 'Source URL must be a string.'
      });
    }

    const contractChunks = splitContractIntoChunks(contractText);

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

    const chunkAnalyses = [];

    for (let i = 0; i < contractChunks.length; i += 1) {
      const chunkAnalysis = await analyzeContractChunk(
        model,
        contractChunks[i],
        i,
        contractChunks.length
      );

      chunkAnalyses.push(chunkAnalysis);
    }

    const darkPatternsFound = chunkAnalyses.flatMap(
      (chunkAnalysis) => chunkAnalysis.darkPatternsFound
    );

    const uniquePatterns = Array.from(
      new Map(
        darkPatternsFound.map((pattern) => [
          `${pattern.category}::${pattern.explanation}`,
          pattern
        ])
      ).values()
    );

    const aiSummary = chunkAnalyses
      .map((chunkAnalysis) => chunkAnalysis.aiSummary.trim())
      .filter(Boolean)
      .join(' ');

    const scanResult = new ScanResult({
      userId: req.user.userId,
      sourceUrl,
      originalText: contractText,
      darkPatternsFound: uniquePatterns,
      aiSummary
    });

    await scanResult.save();

    res.status(200).json({
      success: true,
      analysis: {
        darkPatternsFound: uniquePatterns,
        aiSummary
      },
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