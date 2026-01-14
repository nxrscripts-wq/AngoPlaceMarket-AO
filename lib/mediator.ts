import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const analyzeConversation = async (messages: Message[]): Promise<string | null> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) return null;

    if (messages.length < 2) return null;

    // Only analyze if the last message is NOT from a mediator
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.is_mediator) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const conversationHistory = messages
            .map(m => `${m.senderId === 'user' ? 'Cliente' : 'Vendedor'}: ${m.text}`)
            .join('\n');

        const prompt = `
      Você é um Mediador Inteligente do AngoPlace, um marketplace de Angola.
      Sua função é garantir que as conversas entre Vendedor e Cliente sejam profissionais e produtivas.
      
      Analise o histórico abaixo. Se houver sinais claros de:
      1. Conflito ou agressividade.
      2. Frustração extrema.
      3. Falta de resposta prolongada ou evasiva sobre um problema sério.
      4. Linguagem imprópria.

      Caso detecte um problema que exija intervenção, responda APENAS com uma mensagem curta, empática e profissional em Português de Angola para acalmar os ânimos ou sugerir uma solução mediada.
      Se a conversa estiver normal, responda exatamente com a palavra "NORMAL".

      Histórico da Conversa:
      ${conversationHistory}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        if (text === "NORMAL" || text.includes("NORMAL")) {
            return null;
        }

        return text;
    } catch (error) {
        console.error('Error analyzing conversation:', error);
        return null;
    }
};
