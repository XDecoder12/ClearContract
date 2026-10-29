import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

import authenticateToken from '../middleware/auth.js';
import {
  contractAnalysisPrompt,
  contractSynthesisPrompt
} from '../config/prompts.js';
import ScanResult from '../models/ScanResult.js';

const router = express.Router();

const MAX_CONTRACT_CHARS = 200000;
const CHUNK_SIZE = 12000;
const CHUNK_OVERLAP = 500;

const analysisResponseSchema = {
  type: 'object',
  properties: {
    overallRiskLevel: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH']
    },
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
          },
          severity: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH']
          },
          evidence: {
            type: 'string'
          }
        },
        required: [
          'category',
          'explanation',
          'severity',
          'evidence'
        ]
      }
    },
    aiSummary: {
      type: 'string'
    }
  },
  required: [
    'overallRiskLevel',
    'darkPatternsFound',
    'aiSummary'
  ]
};

const splitContractIntoChunks = (text) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Prefer breaking at a newline so clauses are less likely
    // to be cut in half.
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

    start = Math.max(
      end - CHUNK_OVERLAP,
      start + 1
    );
  }

  return chunks;
};

const normalizeContractText = (text) => {
  return text
    .replace(/\0/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();
};

const validateAndNormalizeSourceUrl = (sourceUrl) => {
  if (sourceUrl === undefined) {
    return undefined;
  }

  const trimmedUrl = sourceUrl.trim();

  if (trimmedUrl === '') {
    return '';
  }

  try {
    const parsedUrl = new URL(trimmedUrl);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Unsupported URL protocol.');
    }

    return parsedUrl.toString();
  } catch {
    throw new Error('Invalid source URL.');
  }
};

const createAnalysisModel = () => {
  const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

  return genAI.getGenerativeModel({
    model: 'gemini-3.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: analysisResponseSchema
    }
  });
};

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableGeminiError = (error) => {
  const status = error?.status;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
};

const generateContentWithRetry = async (model, prompt) => {
  const maxAttempts = 3;
  const delays = [1000, 2500];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      if (
        !isRetryableGeminiError(error) ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      await sleep(delays[attempt - 1]);
    }
  }

  throw new Error('AI request failed after all retry attempts.');
};


const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

const validateAnalysisResult = (analysis) => {
  if (
    !analysis ||
    typeof analysis !== 'object' ||
    !Array.isArray(analysis.darkPatternsFound) ||
    typeof analysis.aiSummary !== 'string'
  ) {
    return false;
  }

  // Allow legacy responses used by existing tests and scans.
  if (
    analysis.overallRiskLevel !== undefined &&
    !RISK_LEVELS.includes(analysis.overallRiskLevel)
  ) {
    return false;
  }

  return analysis.darkPatternsFound.every((pattern) => {
    if (
      !pattern ||
      typeof pattern.category !== 'string' ||
      typeof pattern.explanation !== 'string'
    ) {
      return false;
    }

    if (
      pattern.severity !== undefined &&
      !RISK_LEVELS.includes(pattern.severity)
    ) {
      return false;
    }

    if (
      pattern.evidence !== undefined &&
      typeof pattern.evidence !== 'string'
    ) {
      return false;
    }

    return true;
  });
};



const normalizeEvidenceWhitespace = (value) => {
  return value
    .replace(/\s+/g, ' ')
    .trim();
};

const validateEvidenceAgainstText = (analysis, text) => {
  const normalizedText = normalizeEvidenceWhitespace(text);

  return analysis.darkPatternsFound.every((pattern) => {
    // Existing legacy responses may not contain evidence.
    if (pattern.evidence === undefined) {
      return true;
    }

    if (
      typeof pattern.evidence !== 'string' ||
      pattern.evidence.trim().length === 0
    ) {
      return false;
    }

    const normalizedEvidence =
      normalizeEvidenceWhitespace(pattern.evidence);

    return normalizedText.includes(normalizedEvidence);
  });
};



const analyzeContractChunk = async (
  model,
  chunk,
  chunkIndex,
  totalChunks
) => {
  const prompt = `${contractAnalysisPrompt}

This is section ${chunkIndex + 1} of ${totalChunks} of the contract.

Analyze only the text provided in this section.

Do not assume facts from other sections that are not included here.

${chunk}`;

  const result = await generateContentWithRetry(
    model,
    prompt
  );

  const analysis = JSON.parse(
    result.response.text()
  );

  if (!validateAnalysisResult(analysis)) {
    throw new Error(
      'AI returned an invalid analysis format.'
    );
  }
  if (!validateEvidenceAgainstText(analysis, chunk)) {
  throw new Error(
    'AI returned evidence not found in the contract section.'
  );
}
  return analysis;
};

const synthesizeChunkAnalyses = async (
  model,
  chunkAnalyses
) => {
  const analysisNotes = chunkAnalyses
    .map(
      (analysis, index) => `
    Analysis ${index + 1}:

    ${JSON.stringify(analysis)}
    `
    )
    .join('\n');

  const prompt = `${contractSynthesisPrompt}

${analysisNotes}`;

  const result = await generateContentWithRetry(
    model,
    prompt
  );

  const synthesis = JSON.parse(
    result.response.text()
  );

  if (!validateAnalysisResult(synthesis)) {
    throw new Error(
      'AI returned an invalid synthesis format.'
    );
  }

  return synthesis;
};

router.post(
  '/analyze',
  authenticateToken,
  async (req, res) => {
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

      const normalizedContractText =
        normalizeContractText(contractText);

      if (normalizedContractText.length === 0) {
        return res.status(400).json({
          error: 'Contract text cannot be empty.'
        });
      }

      if (
        normalizedContractText.length >
        MAX_CONTRACT_CHARS
      ) {
        return res.status(413).json({
          error:
            `Contract text exceeds the ` +
            `${MAX_CONTRACT_CHARS.toLocaleString('en-US')} ` +
            `character limit.`
        });
      }

      if (
        sourceUrl !== undefined &&
        typeof sourceUrl !== 'string'
      ) {
        return res.status(400).json({
          error: 'Source URL must be a string.'
        });
      }

      let normalizedSourceUrl;

      try {
        normalizedSourceUrl =
          validateAndNormalizeSourceUrl(sourceUrl);
      } catch (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      const contractChunks = splitContractIntoChunks(
        normalizedContractText
      );

      const model = createAnalysisModel();

      const chunkAnalyses = [];

      for (
        let i = 0;
        i < contractChunks.length;
        i += 1
      ) {
        const chunkAnalysis =
          await analyzeContractChunk(
            model,
            contractChunks[i],
            i,
            contractChunks.length
          );

        chunkAnalyses.push(chunkAnalysis);
      }

      const synthesis =
        await synthesizeChunkAnalyses(
          model,
          chunkAnalyses
        );

      if (
  !validateEvidenceAgainstText(
    synthesis,
    normalizedContractText
  )
) {
  throw new Error(
    'AI returned evidence not found in the contract.'
  );
}

    const darkPatternsFound = synthesis.darkPatternsFound;
    const aiSummary = synthesis.aiSummary;
    const overallRiskLevel = synthesis.overallRiskLevel;

      const scanResult = new ScanResult({
        userId: req.user.userId,
        sourceUrl: normalizedSourceUrl,
        originalText: normalizedContractText,
        darkPatternsFound,
        overallRiskLevel,
        aiSummary
      });

      await scanResult.save();

      res.status(200).json({
        success: true,
        analysis: {
          darkPatternsFound,
          aiSummary,
          ...(overallRiskLevel !== undefined
            ? { overallRiskLevel }
            : {})
        },
        scanId: scanResult._id
      });
    } catch (error) {
      console.error(
        'AI Analysis Error:',
        error
      );

      res.status(500).json({
        error: 'Failed to analyze the contract.'
      });
    }
  }
);

export default router;