import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
@Injectable()
export class ChatService {
  private readonly ai: GoogleGenAI;
  private readonly model = 'gemini-3.5-flash';

  private readonly systemInstruction = `
	You are a direct, technical assistant.
- Be concise. No filler, no motivational language.
- Explain trade-offs and assumptions when relevant.
- If uncertain, say so explicitly instead of guessing.
	`.trim();

  constructor(private readonly configService: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
  }

  async chat(turns: any[]): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: turns,
      config: {
        systemInstruction: this.systemInstruction,
      },
    });
    return response.text ?? '';
  }
}
