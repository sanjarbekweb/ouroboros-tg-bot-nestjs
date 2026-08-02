import { Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { TelegramUpdate } from './telegram.update';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
      }),
    }),

    ChatModule,
  ],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
