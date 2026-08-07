import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class FileService {
  private readonly ai: GoogleGenAI;

  private readonly model = 'gemini-3.5-flash';

  constructor(private readonly config: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.getOrThrow<string>('GEMINI_API_KEY'),
    });
  }

  async analyze(
    fileBuffer: Buffer,
    mimeType: string,
    prompt: string,
  ): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.model,

      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: fileBuffer.toString('base64'),
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    return response.text ?? 'Analysis failed.';
  }
}
