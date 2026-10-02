import { IsNotEmpty, IsString } from 'class-validator';

export class SuscripcionPushDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}