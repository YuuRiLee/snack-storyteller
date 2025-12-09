import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateWriterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: '이름은 2자 이상이어야 합니다' })
  @MaxLength(50, { message: '이름은 50자 이하여야 합니다' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: '설명은 10자 이상이어야 합니다' })
  @MaxLength(500, { message: '설명은 500자 이하여야 합니다' })
  description: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: '시스템 프롬프트는 100자 이상이어야 합니다' })
  @MaxLength(2000, { message: '시스템 프롬프트는 2000자 이하여야 합니다' })
  systemPrompt: string;

  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 장르를 선택해야 합니다' })
  @ArrayMaxSize(5, { message: '장르는 최대 5개까지 선택할 수 있습니다' })
  @IsString({ each: true })
  genre: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
