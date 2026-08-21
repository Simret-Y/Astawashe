import { GoogleGenAI } from '@google/genai';

export interface ChatMessage {
  role: 'user' | 'bot' | 'assistant' | 'model';
  text: string;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const BASE_SYSTEM_INSTRUCTION = `You are the official AstaWashe AI Assistant, embedded inside the AstaWashe medication reminder and healthcare management platform.

AstaWashe is a healthcare platform designed to increase medication adherence using smart reminders (Voice Calls, SMS, USSD), caregiver tracking, and doctor-patient monitoring.

RESPONSE STYLE AND FORMATTING (CRITICAL):
- Keep all answers SHORT, CONCISE, DIRECT, AND TO THE POINT.
- DO NOT use markdown bold asterisks (such as **word** or **text**). Never use ** anywhere in your response.
- DO NOT use hashtag headings (such as ### Heading or ## Heading).
- Write in clean, plain text. Use simple line breaks and plain bullet points (like • or -) if listing items.

YOUR SCOPE AND RESPONSIBILITIES:
You are STRICTLY an AstaWashe system assistant. You are ONLY allowed to help users with:
1. AstaWashe features, capabilities, and system navigation (setting up reminders, viewing schedules, dashboard navigation for patients/doctors/hospitals).
2. Medication reminders, schedules, adherence, missed doses, taken doses, and reminder modes (Voice call, SMS, USSD).
3. Patient, doctor, hospital, and guardian/caregiver workflows in AstaWashe.
4. General educational information about medications and health support related to medication management.
5. Answering questions using the authenticated user's real context supplied to you (e.g. today's medication schedule, adherence rate, assigned doctor).

DOMAIN REDIRECTION (MANDATORY):
If the user asks about ANYTHING outside of AstaWashe, medication management, healthcare support, or using the system (such as politics, general programming, sports, entertainment, general trivia, unrelated personal advice, unrelated products/businesses, recipes, etc.), YOU MUST POLITELY REDIRECT THEM.
Redirection message:
"I’m the AstaWashe Assistant. I can help with your medication reminders, schedules, adherence, and AstaWashe care features."

MEDICAL SAFETY RULES (MANDATORY):
- Never pretend to be a doctor or medical professional.
- Never invent or fabricate medical diagnoses.
- Never invent or recommend specific medication dosages.
- Never tell a patient to change, skip, double, or stop their prescribed medication.
- If asked "Should I double my dose?" or similar, instruct the user never to double a dose and to contact their doctor or pharmacist immediately.
- If emergency symptoms are described, instruct the user to seek immediate urgent medical care or emergency services.
- Never reveal private information belonging to another user.

LANGUAGE SUPPORT:
You can communicate naturally in English, Amharic (አማርኛ), or Afaan Oromo depending on the user's prompt language. Keep responses short, clean, polite, and readable.`;

export async function askGeminiAssistant(
  history: ChatMessage[],
  newMessage: string,
  userContextText?: string
): Promise<string> {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.error('VITE_GEMINI_API_KEY is not configured.');
    throw new Error('Sorry, AstaWashe AI is temporarily unavailable. Please check configuration.');
  }

  try {
    let fullSystemInstruction = BASE_SYSTEM_INSTRUCTION;

    if (userContextText) {
      fullSystemInstruction += `\n\nCURRENT AUTHENTICATED USER DATA CONTEXT:\n${userContextText}\n\nUse this context to accurately answer questions about their medication schedule, adherence, reminder mode, or care team when asked. Never invent data if context is provided.`;
    }

    const formattedContents = history
      .filter((msg) => msg.text && msg.text.trim().length > 0)
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedContents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.4,
      },
    });

    if (response && response.text) {
      let cleaned = response.text.trim();
      cleaned = cleaned
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^#+\s*/gm, '');
      return cleaned;
    }

    throw new Error('Empty response from Gemini');
  } catch (error) {
    console.error('AstaWashe AI Assistant Error:', error instanceof Error ? error.message : error);
    throw new Error('Sorry, AstaWashe AI is temporarily unavailable. Please try again.');
  }
}
