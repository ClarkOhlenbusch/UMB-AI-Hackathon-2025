import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { BotIcon, SendIcon, UserIcon, PaperclipIcon } from './Icons';

// Declare mammoth for TypeScript since it's loaded from a script tag
declare global {
    interface Window {
        mammoth: any;
    }
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSubmit: (message: string) => void;
  isLoading: boolean;
  hasAnalysis: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSubmit, isLoading, hasAnalysis }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        alert('Please upload a valid .docx file.');
        if (e.target) e.target.value = ''; // Reset file input
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        setInput(prev => prev ? `${prev}\n\n${result.value}` : result.value); // Append or set text
    } catch (error) {
        console.error('Error processing .docx file:', error);
        alert('There was an error reading the .docx file.');
    } finally {
        if (e.target) e.target.value = ''; // Reset file input
    }
  };


  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><BotIcon className="w-5 h-5 text-gray-500" /></div>}
              <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
              {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gray-500" /></div>}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><BotIcon className="w-5 h-5 text-gray-500" /></div>
              <div className="max-w-md p-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={hasAnalysis ? "Ask a follow-up question..." : "Paste transcript or upload a .docx file..."}
            className="w-full p-3 pl-12 pr-12 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
            rows={3}
            disabled={isLoading}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            aria-hidden="true"
          />
           <button
            type="button"
            onClick={handleFileSelect}
            disabled={isLoading}
            className="absolute bottom-3 left-3 p-2 text-gray-500 rounded-full disabled:text-gray-400 disabled:cursor-not-allowed hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Attach transcript file"
          >
            <PaperclipIcon className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute bottom-3 right-3 p-2 text-white bg-blue-500 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};