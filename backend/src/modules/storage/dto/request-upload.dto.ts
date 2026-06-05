import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class RequestUploadDto {
  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(127)
  mimeType: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;
}
