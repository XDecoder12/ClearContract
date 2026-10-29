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
  category: String,
  explanation: String,
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH']
  },
  evidence: String
}],
overallRiskLevel: {
  type: String,
  enum: ['LOW', 'MEDIUM', 'HIGH']
},
aiSummary: {
  type: String
},
  scannedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('ScanResult', scanResultSchema);