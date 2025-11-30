import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion, MediaType, AIAnalysis, WatchEntry } from "../types";

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY not found in environment variables.");
    throw new Error("Chave de API do Google Gemini não configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

export const getMediaDetails = async (title: string): Promise<AISuggestion> => {
  const ai = getAIClient();
  
  const prompt = `Forneça detalhes técnicos sobre o filme ou série: "${title}". 
  Se for ambíguo, escolha o mais famoso. Responda em Português.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.INTEGER },
            genre: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            directorOrCreator: { type: Type.STRING },
            summary: { type: Type.STRING, description: "Um resumo curto de 1-2 frases." },
            type: { 
              type: Type.STRING, 
              enum: [MediaType.MOVIE, MediaType.SERIES, MediaType.ANIME] 
            }
          },
          required: ["title", "year", "genre", "directorOrCreator", "summary", "type"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    return JSON.parse(text) as AISuggestion;
  } catch (error) {
    console.error("Erro ao buscar detalhes:", error);
    throw error;
  }
};

export const analyzeProfile = async (entries: WatchEntry[]): Promise<AIAnalysis> => {
  const ai = getAIClient();
  
  // Simplificando os dados para economizar tokens e focar no essencial
  const dataSummary = entries.map(e => {
    const ratingInfo = e.rating ? `Nota: ${e.rating}/5` : 'Sem nota';
    return `${e.title} (${e.type}) - ${ratingInfo}`;
  }).join("\n");
  
  const prompt = `Analise o seguinte histórico de visualização de um usuário e crie um perfil cinéfilo.
  Histórico:
  ${dataSummary}
  
  Responda em JSON estrito.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            favoriteGenre: { type: Type.STRING },
            totalHoursEstimates: { type: Type.NUMBER, description: "Estimativa aproximada total de horas assistidas baseada nos títulos" },
            personalityProfile: { type: Type.STRING, description: "Um parágrafo divertido descrevendo o gosto do usuário." },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 sugestões de filmes/séries que não estão na lista."
            }
          },
          required: ["favoriteGenre", "totalHoursEstimates", "personalityProfile", "recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("Erro na análise:", error);
    throw error;
  }
};