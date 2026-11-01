import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  hostname!: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;
}
