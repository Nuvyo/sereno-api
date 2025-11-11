import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { IsValidPrice } from '../../core/decorators/is-valid-price.decorator';
import 'reflect-metadata';
import { Specialization } from '../../core/entities/user.entity';

export class AddressDTO {

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsNumber()
  number: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @IsOptional()
  @IsString()
  complement: string;

}

export class UpdateMeDTO {
  
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  photo: string;

  @IsOptional()
  @IsBoolean()
  public: boolean;

  @IsOptional()
  @IsString()
  crp: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Specialization, { each: true })
  specializations: Specialization[];

  @IsOptional()
  @IsString()
  whatsapp: string;

  @IsOptional()
  @IsValidPrice({ message: 'sessionCost must be a valid price' })
  @IsNumber()
  @Min(0.00)
  @Max(99999.99)
  sessionCost: number;

  @IsOptional()
  @IsString()
  bio: string;

}

export class SignupDTO extends UpdateMeDTO {

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsOptional()
  @IsBoolean()
  psychologist: boolean;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  passwordConfirmation: string;

}

export class SigninDTO {
  
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

}

export class RefreshTokenDTO {

  @IsNotEmpty()
  @IsUUID('4')
  refreshToken: string;

}

export class SigninResponseDTO {

  accessToken: string;
  refreshToken: string;
  userId: string;

}

export class RefreshTokensResponseDTO {

  accessToken: string;
  refreshToken: string;

}

export class MeResponseDTO {

  id: string;
  name: string;
  email: string;
  photo?: string;
  crp?: string;
  sessionCost?: number;
  bio?: string;
  public?: boolean;
  specializations?: Specialization[];
  whatsapp?: string;

}

