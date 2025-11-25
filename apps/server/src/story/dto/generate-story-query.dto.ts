import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Generate Story Query DTO
 *
 * Validation for SSE streaming endpoint query parameters.
 * Uses Transform decorator to parse comma-separated tags string into array.
 *
 * Endpoint: GET /stories/generate/stream?writerId=xxx&tags=tag1,tag2,tag3
 *
 * Constraints (from spec.md):
 * - writerId: Required, must exist in database
 * - tags: 1-3 tags required, comma-separated in query string
 */
export class GenerateStoryQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'writerId는 필수입니다.' })
  writerId: string;

  @Transform(({ value }: { value: unknown }): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean) as string[];
    if (typeof value !== 'string') return [];
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  })
  @IsArray({ message: 'tags는 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개의 태그를 선택해야 합니다.' })
  @ArrayMaxSize(3, { message: '최대 3개까지 태그를 선택할 수 있습니다.' })
  @IsString({ each: true })
  tags: string[];
}
