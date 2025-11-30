import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Sort field options for story list
 */
export enum SortField {
  CREATED_AT = 'createdAt',
  WORD_COUNT = 'wordCount',
  READ_TIME = 'readTime',
}

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Story Filters DTO
 *
 * Query parameters for story list pagination, filtering, and sorting.
 *
 * Defaults:
 * - page: 1
 * - limit: 20 (max 50)
 * - sort: createdAt
 * - order: desc
 *
 * Features:
 * - Pagination (page, limit)
 * - Search (title + content, case-insensitive)
 * - Tag filter (single tag)
 * - Writer filter (by writerId)
 * - Bookmark filter (only bookmarked stories)
 * - Sorting (createdAt, wordCount, readTime)
 */
export class StoryFiltersDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  // Search (title + content)
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  // Tag filter
  @IsOptional()
  @IsString()
  tag?: string;

  // Writer filter
  @IsOptional()
  @IsString()
  writerId?: string;

  // Bookmark filter
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  bookmarked?: boolean;

  // Sort field
  @IsOptional()
  @IsEnum(SortField)
  sort?: SortField = SortField.CREATED_AT;

  // Sort order
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
