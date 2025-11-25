import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AIModule } from './ai/ai.module';
import { StoryModule } from './story/story.module';
import { WriterModule } from './writer/writer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    AIModule,
    StoryModule,
    WriterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
