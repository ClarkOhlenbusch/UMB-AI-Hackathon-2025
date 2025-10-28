
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT, RESPONSE_SCHEMA } from '../constants';
import { AnalysisResult } from '../types';

let ai: GoogleGenAI;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.error("API_KEY environment variable not set.");
}

export async function analyzeTranscript(transcript: string): Promise<AnalysisResult> {
    if (!ai) {
        throw new Error("Gemini AI client is not initialized. Check API_KEY.");
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: transcript,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            }
        });

        const jsonText = response.text.trim();
        const analysis = JSON.parse(jsonText) as AnalysisResult;
        return analysis;
    } catch (error) {
        console.error("Error analyzing transcript:", error);
        throw new Error("Failed to get analysis from AI. Please check the console for details.");
    }
}


export function createChat(firstTranscript: string, firstAnalysis: AnalysisResult): Chat {
     if (!ai) {
        throw new Error("Gemini AI client is not initialized. Check API_KEY.");
    }
    const history = [
        {
            role: "user",
            parts: [{ text: firstTranscript }]
        },
        {
            role: "model",
            parts: [{ text: `Here is my analysis of the transcript you provided:\n${JSON.stringify(firstAnalysis, null, 2)}` }]
        }
    ];

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: "You are a helpful assistant. The user has provided a transcript and you have provided an analysis. Now, answer their follow-up questions about the analysis clearly and concisely.",
        }
    });

    return chat;
}

export async function sendChatMessage(chat: Chat, message: string): Promise<string> {
    try {
        const result: GenerateContentResponse = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Error sending chat message:", error);
        throw new Error("Failed to get chat response from AI.");
    }
}
