import { Injectable } from '@nestjs/common';
import {
  Command,
  Ctx,
  Message,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { ChatService } from '../chat/chat.service';
import { ChatMemoryService } from '../chat/chat-memory/chat-memory.service';
import { ImageService } from '../image/image.service';

function getDisplayName(ctx: Context): string {
  const user = ctx.from;

  if (!user) {
    return 'there';
  }

  return user.first_name || user.username || 'there';
}

@Update()
@Injectable()
export class TelegramUpdate {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMemory: ChatMemoryService,
    private readonly imageService: ImageService,
  ) { }

  // /start
  @Start()
  async start(@Ctx() ctx: Context) {
    const name = getDisplayName(ctx);

    await ctx.reply(
      `Hello ${name}!\n\nSend me a message to start chatting.`,
    );
  }

  // /reset
  @Command('reset')
  async reset(@Ctx() ctx: Context) {
    const chatId = ctx.chat?.id;

    if (!chatId) {
      return;
    }

    this.chatMemory.clear(chatId);

    await ctx.reply('Chat history cleared.');
  }

  // /image
  @Command('image')
  async image(
    @Ctx() ctx: Context,
  ) {
    const message = ctx.message;

    if (!message || !('text' in message)) {
      await ctx.reply(
        'Usage: /image <prompt>',
      );
      return;
    }

    const text = message.text;
    const prompt = text.replace(/^\/image\s*/i, '').trim();

    if (!prompt) {
      await ctx.reply(
        'Usage: /image <prompt>\n\nExample:\n/image a futuristic city at night',
      );
      return;
    }

    try {
      await ctx.sendChatAction('upload_photo');

      const image = await this.imageService.generate(prompt);

      await ctx.replyWithPhoto({
        source: image,
      });
    } catch (error) {
      console.error('[image] failed:', error);

      await ctx.reply(
        'Image generation failed. Please try again later.',
      );
    }
  }
  // Normal text messages
  @On('text')
  async handleText(
    @Ctx() ctx: Context,
    @Message('text') text: string,
  ) {
    // Ignore commands such as /start and /reset.
    if (text.startsWith('/')) {
      return;
    }

    const chatId = ctx.chat?.id;

    if (!chatId) {
      return;
    }

    try {
      // Show "typing..." in Telegram.
      await ctx.sendChatAction('typing');

      // Get Telegram user information.
      const user = ctx.from;

      const userContext = `
Telegram user information:
- Telegram ID: ${user?.id ?? 'unknown'}
- First name: ${user?.first_name ?? 'unknown'}
- Last name: ${user?.last_name ?? 'unknown'}
- Username: ${user?.username ?? 'unknown'}
      `.trim();

      // Save user's message to conversation memory.
      this.chatMemory.add(chatId, {
        role: 'user',
        parts: [{ text }],
      });

      // Get conversation history.
      const turns = this.chatMemory.get(chatId);

      // Send conversation + Telegram user information to Gemini.
      const reply = await this.chatService.chat(
        turns,
        userContext,
      );

      // Save Gemini's response to conversation memory.
      this.chatMemory.add(chatId, {
        role: 'model',
        parts: [{ text: reply }],
      });

      // Send Gemini's response back to Telegram.
      await ctx.reply(reply);
    } catch (error) {
      console.error('[chat] failed:', error);

      await ctx.reply(
        'Something went wrong — check server logs.',
      );
    }
  }
}