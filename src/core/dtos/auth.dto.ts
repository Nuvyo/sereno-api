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
  password_confirmation: string;

  @IsOptional()
  @IsBoolean()
  is_psychologist: boolean;

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

  access_token: string;
  refresh_token: string;
  user_id: string;

}

export class SessionTokensDTO {

  access_token: string;
  refresh_token: string;

}

export class MeDTO {

  id: string;
  name: string;
  email: string;
  psychologist_detail?: PsychologistDetail;

}

export class RefreshTokenDTO {

  @IsNotEmpty()
  @IsUUID('4')
  refresh_token: string;

}

export class PsychologistDetailDTO {

  @IsOptional()
  @IsString()
  register_number: string;

  @IsOptional()
  @IsBoolean()
  online: boolean;

  @IsOptional()
  @IsBoolean()
  in_person: boolean;

  @IsOptional()
  @IsValidPrice({ message: 'online_price must be a valid price' })
  @IsNumber()
  @Min(0.00)
  @Max(99999.99)
  online_price: number;

  @IsOptional()
  @IsValidPrice({ message: 'in_person_price must be a valid price' })
  @IsNumber()
  @Min(0.00)
  @Max(99999.99)
  in_person_price: number;

  @IsOptional()
  @IsString()
  bio: string;

}
