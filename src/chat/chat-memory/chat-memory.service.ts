import { Injectable } from '@nestjs/common';

export interface ChatTurn {
  role: 'user' | 'model';
  parts: {
    text: string;
  }[];
}

@Injectable()
export class ChatMemoryService {
  private readonly history = new Map<number, ChatTurn[]>();

  get(chatId: number): ChatTurn[] {
    return this.history.get(chatId) ?? [];
  }

  add(chatId: number, turn: ChatTurn): void {
    const turns = this.get(chatId);

    turns.push(turn);

    this.history.set(chatId, turns.slice(-20));
  }

  clear(chatId: number): void {
    this.history.delete(chatId);
  }
  
}
