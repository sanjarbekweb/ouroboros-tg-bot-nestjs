import { Injectable } from '@nestjs/common';
import { Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ChatService } from '../chat/chat.service';

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
  private readonly history = new Map<number, any[]>();

  constructor(private readonly chatService: ChatService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    const name = getDisplayName(ctx);

    await ctx.reply(`Hello ${name}!\n\nSend me a message to start chatting.`);
  }

  @On('text')
  async handleText(@Ctx() ctx: Context, @Message('text') text: string) {
    if (text.startsWith('/')) {
      return;
    }

    const chatId = ctx.chat?.id;

    if (!chatId) {
      return;
    }

    try {
      await ctx.sendChatAction('typing');

      const turns = this.history.get(chatId) ?? [];

      turns.push({
        role: 'user',
        parts: [{ text }],
      });

      const reply = await this.chatService.chat(turns);

      turns.push({
        role: 'model',
        parts: [{ text: reply }],
      });

      this.history.set(chatId, turns.slice(-20));

      await ctx.reply(reply);
    } catch (error) {
      console.error('[chat] failed:', error);

      await ctx.reply('Something went wrong — check server logs.');
    }
  }
}
