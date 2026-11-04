import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { PostCommentStatus } from '../../database/entities/post-comment.entity';

export class UpdateCommentStatusDto {
  @ApiProperty({
    description: 'Target moderation status',
    enum: ['approved', 'pending', 'rejected', 'spam'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['approved', 'pending', 'rejected', 'spam'])
  status!: PostCommentStatus;
}
