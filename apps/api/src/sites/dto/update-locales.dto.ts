import { IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateLocalesDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$/, {
    message: 'defaultLocale must be a valid BCP 47 locale tag',
  })
  defaultLocale!: string;

  @IsArray()
  @IsString({ each: true })
  supportedLocales!: string[];

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$/, {
    message: 'fallbackLocale must be a valid BCP 47 locale tag',
  })
  fallbackLocale?: string;
}
