import { IsBoolean, IsDecimal, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';
import { IsValidPrice } from '@core/decorators/is-valid-price.decorator';
import 'reflect-metadata';

export class SignupDTO {

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  passwordConfirmation: string;

  @IsOptional()
  @IsBoolean()
  isPsychologist: boolean;

}

export class SigninDTO {
  
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

}

export class SigninResponseDTO {

  accessToken: string;
  refreshToken: string;
  userId: string;

}

export class SessionTokensDTO {

  accessToken: string;
  refreshToken: string;

}

export class MeDTO {

  id: string;
  name: string;
  email: string;
  psychologistDetail?: PsychologistDetail;

}

export class RefreshTokenDTO {

  @IsNotEmpty()
  @IsUUID('4')
  refreshToken: string;

}

export class PsychologistDetailDTO {

  @IsOptional()
  @IsString()
  registerNumber: string;

  @IsOptional()
  @IsBoolean()
  online: boolean;

  @IsOptional()
  @IsBoolean()
  inPerson: boolean;

  @IsOptional()
  @IsValidPrice({ message: 'online_price must be a valid price' })
  @IsNumber()
  @Min(0.00)
  @Max(99999.99)
  onlinePrice: number;

  @IsOptional()
  @IsValidPrice({ message: 'in_person_price must be a valid price' })
  @IsNumber()
  @Min(0.00)
  @Max(99999.99)
  inPersonPrice: number;

  @IsOptional()
  @IsString()
  bio: string;

}
