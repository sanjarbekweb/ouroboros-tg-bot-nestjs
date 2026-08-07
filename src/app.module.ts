import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from './telegram/telegram.module';
import { ChatModule } from './chat/chat.module';
import { ImageModule } from './image/image.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ChatModule,
    TelegramModule,
    ImageModule,
    FileModule,
  ],
})
export class AppModule {}
