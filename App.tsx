
import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { AnalysisResult, ChatMessage } from './types';
import { analyzeTranscript, createChat, sendChatMessage } from './services/geminiService';
import { ChatPanel } from './components/ChatPanel';
import { AnalysisPanel } from './components/AnalysisPanel';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    // Add initial welcome message from bot
    setMessages([
        {
            sender: 'bot',
            text: "Welcome to the AI Distress Analysis Tool. Please paste a patient transcript to begin."
        }
    ]);
  }, []);

  const handleSubmit = async (inputText: string) => {
    setIsLoading(true);
    setError(null);
    const userMessage: ChatMessage = { sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (!analysisResult) {
        // First submission is for analysis
        const result = await analyzeTranscript(inputText);
        setAnalysisResult(result);
        const botMessage: ChatMessage = { 
            sender: 'bot', 
            text: "Analysis complete. You can now ask me questions about it.",
        };
        setMessages(prev => [...prev, botMessage]);
        chatRef.current = createChat(inputText, result);
      } else {
        // Subsequent submissions are for chat
        if (chatRef.current) {
          const responseText = await sendChatMessage(chatRef.current, inputText);
          const botMessage: ChatMessage = { sender: 'bot', text: responseText };
          setMessages(prev => [...prev, botMessage]);
        } else {
          throw new Error("Chat is not initialized.");
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      setMessages(prev => [...prev, { sender: 'bot', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen p-4 md:p-8 flex flex-col text-gray-900 dark:text-gray-100">
        <header className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">AI Distress Analysis Tool</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Leveraging Gemini to understand patient sentiment</p>
        </header>
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
            <div className="min-h-0">
                <ChatPanel messages={messages} onSubmit={handleSubmit} isLoading={isLoading} hasAnalysis={!!analysisResult} />
            </div>
            <div className="min-h-0">
                <AnalysisPanel analysisResult={analysisResult} />
            </div>
        </main>
        {error && (
            <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
                <p><strong>Error:</strong> {error}</p>
            </div>
        )}
    </div>
  );
}

export default App;
