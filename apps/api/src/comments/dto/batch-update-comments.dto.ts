import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import type { PostCommentStatus } from '../../database/entities/post-comment.entity';

export class BatchUpdateCommentsDto {
  @ApiProperty({ description: 'List of comment UUIDs to update', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];

  @ApiProperty({
    description: 'Target moderation status for the batch',
    enum: ['approved', 'pending', 'rejected', 'spam'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['approved', 'pending', 'rejected', 'spam'])
  status!: PostCommentStatus;
}
