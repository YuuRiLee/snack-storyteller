import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Generate Story DTO
 *
 * Request validation for story generation endpoint.
 *
 * Constraints (from spec.md):
 * - writerId: Must exist in database
 * - tags: 1-3 tags required for style specification
 */
export class GenerateStoryDto {
  @IsString()
  @IsNotEmpty({ message: 'writerId는 필수입니다.' })
  writerId: string;

  @IsArray({ message: 'tags는 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개의 태그를 선택해야 합니다.' })
  @ArrayMaxSize(3, { message: '최대 3개까지 태그를 선택할 수 있습니다.' })
  @IsString({ each: true })
  tags: string[];
}
