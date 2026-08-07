import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';

@Injectable()
export class ImageService {
  private readonly client: InferenceClient;

  private readonly model = 'stabilityai/stable-diffusion-xl-base-1.0';

  constructor(private readonly config: ConfigService) {
    this.client = new InferenceClient(
      this.config.getOrThrow<string>('HF_TOKEN'),
    );
  }

  async generate(prompt: string): Promise<Buffer> {
    const image = await this.client.textToImage(
      {
        model: this.model,
        inputs: prompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
      },
      {
        outputType: 'blob',
      },
    );

    const arrayBuffer = await image.arrayBuffer();

    return Buffer.from(arrayBuffer);
  }
}
