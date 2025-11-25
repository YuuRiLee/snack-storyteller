import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';

/**
 * Story Module
 *
 * Provides story generation and management features.
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - AIModule: Story generation (AIService)
 *
 * Exports:
 * - StoryService: For use in other modules if needed
 */
@Module({
  imports: [PrismaModule, AIModule],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
