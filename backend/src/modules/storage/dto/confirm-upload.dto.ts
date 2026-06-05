import { IsString, IsNumber, IsOptional, IsUUID, MaxLength, Min } from 'class-validator';

export class ConfirmUploadDto {
  @IsString()
  storageKey: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsNumber()
  @Min(1)
  size: number;

  @IsString()
  @MaxLength(127)
  mimeType: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;
}
