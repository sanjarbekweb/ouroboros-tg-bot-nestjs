import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMemoryService } from './chat-memory/chat-memory.service';

@Module({
  providers: [
    ChatService,
    ChatMemoryService,
  ],
  exports: [
    ChatService,
    ChatMemoryService,
  ],
})
export class ChatModule { }