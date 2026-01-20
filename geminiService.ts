
import { GoogleGenAI, Type } from "@google/genai";
import { Account, Heir } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getEstateInsights = async (accounts: Account[], heirs: Heir[]) => {
  const accountSummary = accounts.map(a => `${a.name} (${a.category}): $${a.balance}`).join(', ');
  const heirSummary = heirs.map(h => `${h.name} (${h.relationship}): ${h.allocation}%`).join(', ');

  const prompt = `
    You are an expert Estate Planning Assistant. 
    Here is a summary of the user's current portfolio and heir designations:
    Accounts: ${accountSummary}
    Heirs: ${heirSummary}

    Analyze this estate plan for:
    1. Liquidity risk (is there enough cash for immediate needs like funeral/taxes?).
    2. Beneficiary alignment (do the totals match 100%?).
    3. Suggested documents missing (e.g., if real estate exists, suggest a deed transfer plan).
    4. Tax implications (briefly mentioned).

    Provide the response in clear, professional bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm unable to generate insights at this time. Please check your plan manually.";
  }
};

export const chatWithAssistant = async (message: string, context: { accounts: Account[], heirs: Heir[] }) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are a compassionate and knowledgeable Legacy Assistant for an estate management app. Help users understand estate planning, wealth transfer, and how to use the app. Keep it professional yet empathetic.',
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
