
export interface EvidenceSpan {
  text: string;
  reason: string;
}

export interface AnalysisResult {
  distress_level: 'none' | 'low' | 'medium' | 'high';
  score: number;
  explanation_high_level: string;
  evidence_spans: EvidenceSpan[];
  recommendations: string[];
  safety_flag: boolean;
  qc_notes: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  isAnalysis?: boolean; // To distinguish the analysis block
  analysisResult?: AnalysisResult; // To hold the analysis data
}
