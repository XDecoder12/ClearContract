import mongoose from 'mongoose';

const scanResultSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  sourceUrl: { 
    type: String 
  },
  originalText: { 
    type: String, 
    required: true 
  },
  darkPatternsFound: [{
    category: String, // e.g., "Hidden Fee", "Forced Continuity"
    explanation: String
  }],
  aiSummary: { 
    type: String 
  },
  scannedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('ScanResult', scanResultSchema);