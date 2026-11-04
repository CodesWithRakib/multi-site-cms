import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePublicCommentDto {
  @ApiProperty({ description: 'Display name of the commenter', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  authorName!: string;

  @ApiProperty({ description: 'Email address of the commenter' })
  @IsEmail()
  @MaxLength(255)
  authorEmail!: string;

  @ApiProperty({ description: 'Comment text content', minLength: 3, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Optional 1-5 star rating for the article',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number | null;

  @ApiPropertyOptional({ description: 'Optional parent comment ID for threaded replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Spam honeypot trap field (must be left empty)' })
  @IsOptional()
  @IsString()
  website_url?: string;
}
