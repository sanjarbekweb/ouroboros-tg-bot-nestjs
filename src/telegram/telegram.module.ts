import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { FileModule } from 'src/file/file.module';

import { ChatModule } from '../chat/chat.module';
import { ImageModule } from '../image/image.module';
import { TelegramUpdate } from './telegram.update';

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

    ImageModule,
    ChatModule,
    FileModule,
  ],

  providers: [TelegramUpdate],
})
export class TelegramModule {}
