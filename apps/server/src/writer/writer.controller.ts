import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WriterService } from './writer.service';
import { CreateWriterDto, UpdateWriterDto, SearchWriterDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/user.type';

@Controller('writers')
export class WriterController {
  constructor(private readonly writerService: WriterService) {}

  // Create a new writer (requires authentication)
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateWriterDto, @CurrentUser() user: AuthUser) {
    return this.writerService.create(dto, user.id);
  }

  // Get all writers (public + user's private)
  @Get()
  async findAll(
    @Query() query: SearchWriterDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.writerService.findAll(user?.id ?? null, query);
  }

  // Get available genres
  @Get('genres')
  async getGenres() {
    return this.writerService.getAvailableGenres();
  }

  // Get current user's writers
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyWriters(
    @Query() query: SearchWriterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.writerService.findMyWriters(user.id, query);
  }

  // Get a single writer by ID
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.writerService.findOne(id, user?.id);
  }

  // Update a writer (requires authentication and ownership)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWriterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.writerService.update(id, dto, user.id);
  }

  // Delete a writer (requires authentication and ownership)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.writerService.remove(id, user.id);
  }

  // Upload writer image
  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  async uploadImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.writerService.updateImage(id, imageUrl, user.id);
  }
}
