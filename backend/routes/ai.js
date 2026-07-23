import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { contractText } = req.body;

    if (!contractText) {
      return res.status(400).json({ error: 'Contract text is required.' });
    }

    // 1. Initialize inside the route (after dotenv has loaded!)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 2. Use a modern, actively supported model 
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    
    // Craft the prompt for the AI
    const prompt = `
      You are an expert legal assistant. Analyze the following contract or terms of service for any "dark patterns", hidden fees, or unfair clauses. 
      Provide a brief, easy-to-understand summary of the biggest risks.
      
      Contract Text:
      "${contractText}"
    `;

    // Generate the content
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    // Send the AI's analysis back to the client
    res.status(200).json({ success: true, analysis });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: 'Failed to analyze the contract.' });
  }
});

export default router;