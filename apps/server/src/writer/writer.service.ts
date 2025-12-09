import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWriterDto, UpdateWriterDto, SearchWriterDto } from './dto';

@Injectable()
export class WriterService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWriterDto, userId: string) {
    const writer = await this.prisma.writer.create({
      data: {
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        genre: dto.genre,
        imageUrl: dto.imageUrl,
        isPublic: dto.isPublic ?? true,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stories: true,
          },
        },
      },
    });

    return writer;
  }

  async findAll(userId: string | null, query: SearchWriterDto) {
    const { q, genre, page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    // Build where clause with proper Prisma type
    const where: Prisma.WriterWhereInput = {
      OR: [{ isPublic: true }, ...(userId ? [{ userId }] : [])],
    };

    // Build AND conditions
    const andConditions: Prisma.WriterWhereInput[] = [];

    // Add search filter
    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    // Add genre filter
    if (genre) {
      andConditions.push({ genre: { has: genre } });
    }

    // Apply AND conditions if any
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [writers, total] = await Promise.all([
      this.prisma.writer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              stories: true,
            },
          },
        },
      }),
      this.prisma.writer.count({ where }),
    ]);

    return {
      data: writers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyWriters(userId: string, query: SearchWriterDto) {
    const { page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    const [writers, total] = await Promise.all([
      this.prisma.writer.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              stories: true,
            },
          },
        },
      }),
      this.prisma.writer.count({ where: { userId } }),
    ]);

    return {
      data: writers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const writer = await this.prisma.writer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stories: true,
          },
        },
      },
    });

    if (!writer) {
      throw new NotFoundException(`Writer with ID ${id} not found`);
    }

    // Check visibility
    if (!writer.isPublic && writer.userId !== userId) {
      throw new ForbiddenException('You do not have access to this writer');
    }

    return writer;
  }

  async update(id: string, dto: UpdateWriterDto, userId: string) {
    const writer = await this.prisma.writer.findUnique({
      where: { id },
    });

    if (!writer) {
      throw new NotFoundException(`Writer with ID ${id} not found`);
    }

    if (writer.userId !== userId) {
      throw new ForbiddenException('You can only update your own writers');
    }

    const updatedWriter = await this.prisma.writer.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        genre: dto.genre,
        imageUrl: dto.imageUrl,
        isPublic: dto.isPublic,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stories: true,
          },
        },
      },
    });

    return updatedWriter;
  }

  async remove(id: string, userId: string) {
    const writer = await this.prisma.writer.findUnique({
      where: { id },
    });

    if (!writer) {
      throw new NotFoundException(`Writer with ID ${id} not found`);
    }

    if (writer.userId !== userId) {
      throw new ForbiddenException('You can only delete your own writers');
    }

    await this.prisma.writer.delete({
      where: { id },
    });

    return { message: '작가가 삭제되었습니다' };
  }

  async updateImage(id: string, imageUrl: string, userId: string) {
    const writer = await this.prisma.writer.findUnique({
      where: { id },
    });

    if (!writer) {
      throw new NotFoundException(`Writer with ID ${id} not found`);
    }

    if (writer.userId !== userId) {
      throw new ForbiddenException('You can only update your own writers');
    }

    const updatedWriter = await this.prisma.writer.update({
      where: { id },
      data: { imageUrl },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stories: true,
          },
        },
      },
    });

    return updatedWriter;
  }

  async getAvailableGenres() {
    // Get all unique genres from existing writers
    const writers = await this.prisma.writer.findMany({
      where: { isPublic: true },
      select: { genre: true },
    });

    const genreSet = new Set<string>();
    writers.forEach((writer) => {
      writer.genre.forEach((g) => genreSet.add(g));
    });

    return Array.from(genreSet).sort();
  }
}
