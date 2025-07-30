import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { MeetingSummary } from '../types';

// The API key check is moved to the UI to provide a better user experience.
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const transcriptionModel = 'gemini-2.5-flash';
const summarizationModel = 'gemini-2.5-flash';

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A very brief and concise summary of the meeting, no more than 3-4 sentences."
        },
        keyDecisions: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: "A key decision extracted from the summary. Each decision should be a clear, single statement."
            },
            description: "List of key decisions derived *only* from the meeting summary.",
        },
        actionItems: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    task: {
                        type: Type.STRING,
                        description: "The specific action or task that needs to be completed."
                    },
                    owner: {
                        type: Type.STRING,
                        description: "The name of the person or team responsible for the task. Default to 'Unassigned' if not mentioned."
                    },
                    deadline: {
                        type: Type.STRING,
                        description: "The deadline for the task. Default to 'Not specified' if not mentioned."
                    }
                },
                required: ["task", "owner", "deadline"],
            },
            description: "List of action items extracted from the full transcript."
        },
    },
    required: ["summary", "keyDecisions", "actionItems"],
};


/**
 * Converts a base64 audio string to a GenerativePart for the Gemini API.
 */
const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};

/**
 * Transcribes the given audio using the Gemini API.
 */
export async function transcribeAudio(audioBase64: string, audioMimeType: string): Promise<string> {
    if (!ai) {
        throw new Error("Gemini AI not initialized. Please check your API_KEY.");
    }
    try {
        const audioPart = fileToGenerativePart(audioBase64, audioMimeType);
        const prompt = "Transcribe the following audio recording of a meeting.";
        const result: GenerateContentResponse = await ai.models.generateContent({
            model: transcriptionModel,
            contents: { parts: [audioPart, {text: prompt}] },
        });

        return result.text;
    } catch (error) {
        console.error("Error during transcription:", error);
        throw new Error("Failed to transcribe audio. Please check the console for details.");
    }
}

/**
 * Summarizes the transcript into key decisions and action items using the Gemini API, streaming the results.
 * @param transcript The meeting transcript.
 * @param onStream A callback function that receives chunks of the summary as they are generated.
 * @returns A promise that resolves with the full, final summary JSON string.
 */
export async function summarizeTranscriptStream(
    transcript: string,
    onStream: (chunk: string) => void
): Promise<string> {
    if (!ai) {
        throw new Error("Gemini AI not initialized. Please check your API_KEY.");
    }
    const prompt = `Analyze the following meeting transcript and produce a structured JSON output.

Follow these steps:
1.  First, write a very short and concise summary of the meeting (no more than 3-4 sentences).
2.  Next, based *only* on the summary you just wrote, extract the key decisions.
3.  Finally, review the full transcript to identify any specific action items.

Transcript:
---
${transcript}
---
`;

    try {
        const stream = await ai.models.generateContentStream({
            model: summarizationModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: summarySchema,
            }
        });

        let accumulatedText = "";
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                accumulatedText += chunkText;
                onStream(chunkText);
            }
        }
        return accumulatedText;

    } catch (error) {
        console.error("Error during summarization stream:", error);
        throw new Error("Failed to summarize transcript. Please check the console for details.");
    }
}