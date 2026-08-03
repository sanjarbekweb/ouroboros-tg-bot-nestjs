import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from './telegram/telegram.module';
import { ChatModule } from './chat/chat.module';
import { ImageModule } from './image/image.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ChatModule,
    TelegramModule,
    ImageModule,
  ],
})
export class AppModule {}