import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  roleKey!: string;

  @IsOptional()
  @IsString()
  scopeType?: string;

  @IsOptional()
  @IsUUID('4')
  siteId?: string;
}
