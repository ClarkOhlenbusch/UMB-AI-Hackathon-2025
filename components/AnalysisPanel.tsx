import React from 'react';
import { AnalysisResult, EvidenceSpan } from '../types';
import { WarningIcon, BotIcon } from './Icons';
import { PDFExportButton } from '../PDFExport';

interface AnalysisPanelProps {
  analysisResult: AnalysisResult | null;
}

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const scoreColor = score > 0.75 ? 'stroke-red-500' : score > 0.4 ? 'stroke-yellow-500' : 'stroke-green-500';

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={`${scoreColor} transition-all duration-1000 ease-in-out`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-gray-700 dark:text-gray-200">{Math.round(score * 100)}</span>
    </div>
  );
};

const DistressLevelBadge: React.FC<{ level: AnalysisResult['distress_level'] }> = ({ level }) => {
    const levelStyles = {
        none: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        low: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`px-3 py-1 text-sm font-medium uppercase rounded-full ${levelStyles[level]}`}>
            {level}
        </span>
    );
};

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysisResult }) => {
  
  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-lg dark:bg-gray-800 shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Analysis Results</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Submit a transcript to see the AI analysis here.</p>
        <div className="mt-8">
            <BotIcon className="w-24 h-24 text-gray-300 dark:text-gray-600"/>
        </div>
      </div>
    );
  }

  const { distress_level, score, explanation_high_level, evidence_spans, recommendations, safety_flag, qc_notes } = analysisResult;

  return (
    <div className="p-6 bg-white rounded-lg dark:bg-gray-800 shadow-lg h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Distress Analysis</h2>
        <PDFExportButton analysisResult={analysisResult} fileName="distress-analysis-report.pdf" />
      </div>
      
      {safety_flag && (
        <div className="flex items-center p-4 mb-4 text-red-800 bg-red-100 border-l-4 border-red-500 rounded-md dark:bg-red-900 dark:text-red-200">
          <WarningIcon className="w-6 h-6 mr-3"/>
          <div>
            <p className="font-bold">Safety Flag Raised</p>
            <p className="text-sm">Crisis or self-harm risk cues detected. Please follow appropriate safety protocols.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-6 p-4 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <ScoreRing score={score} />
        <div className="flex-1 text-center md:text-left">
            <div className='flex items-center gap-4 justify-center md:justify-start'>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Distress Level</h3>
                <DistressLevelBadge level={distress_level} />
            </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300 italic">"{explanation_high_level}"</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Evidence from Transcript</h3>
        <div className="space-y-3">
          {evidence_spans.map((span: EvidenceSpan, index: number) => (
            <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-400 rounded-md">
              <p className="font-semibold text-blue-800 dark:text-blue-200">"{span.text}"</p>
              <p className="text-sm text-blue-600 dark:text-blue-300 capitalize">- {span.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Supportive Recommendations</h3>
        <ul className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-300">
          {recommendations.map((rec: string, index: number) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>

      {qc_notes && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Quality Notes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{qc_notes}</p>
        </div>
      )}
    </div>
  );
};
