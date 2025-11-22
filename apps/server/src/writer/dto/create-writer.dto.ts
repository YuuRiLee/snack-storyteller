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
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must be at most 50 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'SystemPrompt must be at least 100 characters' })
  @MaxLength(2000, { message: 'SystemPrompt must be at most 2000 characters' })
  systemPrompt: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 genre is required' })
  @ArrayMaxSize(5, { message: 'At most 5 genres allowed' })
  @IsString({ each: true })
  genre: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
