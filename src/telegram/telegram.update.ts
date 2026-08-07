import { Injectable } from '@nestjs/common';
import { Command, Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { FileService } from '../file/file.service';
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
    private readonly fileService: FileService,
  ) {}

  // /start
  @Start()
  async start(@Ctx() ctx: Context) {
    const name = getDisplayName(ctx);

    await ctx.reply(`Hello ${name}!\n\nSend me a message to start chatting.`);
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
  async image(@Ctx() ctx: Context) {
    const message = ctx.message;

    if (!message || !('text' in message)) {
      await ctx.reply('Usage: /image <prompt>');
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

      await ctx.reply('Image generation failed. Please try again later.');
    }
  }
  // Normal text messages
  @On('text')
  async handleText(@Ctx() ctx: Context, @Message('text') text: string) {
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
      const reply = await this.chatService.chat(turns, userContext);

      // Save Gemini's response to conversation memory.
      this.chatMemory.add(chatId, {
        role: 'model',
        parts: [{ text: reply }],
      });

      // Send Gemini's response back to Telegram.
      await ctx.reply(reply);
    } catch (error) {
      console.error('[chat] failed:', error);

      await ctx.reply('Something went wrong — check server logs.');
    }
  }
  @On('document')
  async handleDocument(@Ctx() ctx: Context) {
    const document = ctx.message;

    if (!document || !('document' in document)) {
      return;
    }

    try {
      await ctx.sendChatAction('typing');

      const fileId = document.document.file_id;
      const fileName = document.document.file_name ?? 'file';
      const mimeType =
        document.document.mime_type ?? 'application/octet-stream';

      // Get Telegram's file information.
      const file = await ctx.telegram.getFile(fileId);

      if (!file.file_path) {
        throw new Error('Telegram did not return a file path');
      }

      // Download the file from Telegram.
      const response = await fetch(
        `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const prompt = `
Analyze this file.

File name: ${fileName}
MIME type: ${mimeType}

Provide a useful, structured analysis of the file.
    `.trim();

      const result = await this.fileService.analyze(buffer, mimeType, prompt);

      await ctx.reply(result);
    } catch (error) {
      console.error('[file] failed:', error);

      await ctx.reply('I could not analyze this file. Please try again.');
    }
  }
}
