import { Module } from '@nestjs/common';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Bookmark Module
 *
 * Provides bookmark management features.
 *
 * Features:
 * - Create/delete bookmarks (idempotent)
 * - Toggle bookmark status
 * - List bookmarked stories
 * - Check bookmark status
 *
 * Dependencies:
 * - PrismaModule: Database access
 *
 * Exports:
 * - BookmarkService: For use in other modules
 */
@Module({
  imports: [PrismaModule],
  controllers: [BookmarkController],
  providers: [BookmarkService],
  exports: [BookmarkService],
})
export class BookmarkModule {}
