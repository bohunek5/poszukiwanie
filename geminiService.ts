
import { GoogleGenAI } from "@google/genai";
import { Lead, SearchFilters } from "../types";

const tryExtractJson = (text: string) => {
  try {
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    
    if (startIdx === -1 || endIdx === -1) {
      console.error("Model nie zwrócił JSON. Treść:", text);
      throw new Error("Model nie zwrócił poprawnej struktury danych. Spróbuj powtórzyć zapytanie.");
    }
    
    const cleanJson = text.substring(startIdx, endIdx + 1);
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Błąd parsowania JSON:", text);
    throw new Error("Błąd przetwarzania listy firm. Zmniejsz limit lub spróbuj ponownie.");
  }
};

/**
 * Utility function to handle retries for API calls
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 2000; // Start with 2 seconds
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = 
        error.message?.includes('429') || 
        error.status === 429 || 
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('exhausted');

      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`Limit API przekroczony. Ponawiam próbę ${i + 1}/${maxRetries} za ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential increase
        continue;
      }
      throw error;
    }
  }
  throw new Error("Przekroczono liczbę prób połączenia z API.");
}

export const findLeads = async (filters: SearchFilters): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `Jesteś robotem generującym dane B2B dla firmy Prescot LED. 
TWOIM JEDYNYM ZADANIEM JEST WYGENEROWANIE DOKŁADNIE ${filters.limit} REKORDÓW W FORMACIE JSON.
NIGDY NIE PRZEPRASZAJ. NIGDY NIE TŁUMACZ SIĘ Z OGRANICZEŃ.
NIE PISZ ŻADNEGO TEKSTU POZA CZYSTYM KODEM JSON.

Kontekst biznesowy: 
Prescot LED to dostawca profesjonalnych komponentów: profile do LED, zasilacze LED, sterowniki oraz taśmy.
TWOIM CELEM JEST IDENTYFIKACJA REALNYCH FIRM I ICH NUMERÓW NIP.

Instrukcje dla danych:
- Pole 'nip' MUSI zawierać poprawny polski numer NIP firmy.
- Dla branży "Hurtownie i Sklepy Elektryczne" skup się na profilach, zasilaczach i sterownikach.
- 'salesTip' musi być konkretny: na co się powołać w rozmowie.`;

  const prompt = `WYGENERUJ TABLICĘ JSON ZAWIERAJĄCĄ DOKŁADNIE ${filters.limit} REALNYCH FIRM (LEADÓW) Z POLSKI.
Region: ${filters.region}
Branże: ${filters.industryTypes.join(", ")}

Format każdego obiektu:
{
  "id": "string",
  "name": "nazwa firmy",
  "nip": "10-cyfrowy NIP firmy",
  "industry": "branża",
  "location": "miasto, woj.",
  "justification": "dlaczego potrzebują asortymentu Prescot LED",
  "salesTip": "KONKRET: o co zapytać na początku rozmowy?",
  "recommendedProducts": ["Produkt 1", "Produkt 2", "Produkt 3"],
  "phone": "string",
  "email": "string",
  "website": "url",
  "description": "krótki opis firmy"
}

Zwróć TYLKO czysty JSON.`;

  const callApi = async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const leads = tryExtractJson(text) as Lead[];
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && leads.length > 0) {
      const sources = groundingChunks
        .filter(chunk => chunk.web && chunk.web.uri)
        .map(chunk => ({ uri: chunk.web!.uri, title: chunk.web!.title }));
      
      leads.forEach((lead, index) => {
        const leadSources = sources.slice(index * 2, (index * 2) + 2);
        if (leadSources.length > 0) lead.sources = leadSources;
      });
    }

    return leads.slice(0, filters.limit);
  };

  try {
    return await retryWithBackoff(callApi);
  } catch (error: any) {
    console.error("Gemini API Error after retries:", error);
    throw error;
  }
};
