import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { IsValidPrice } from '@core/decorators/is-valid-price.decorator';
import 'reflect-metadata';
import { ValidateNested } from 'class-validator';
import { Modality } from '@core/entities/user.entity';
import { Address } from '@core/entities/address.entity';

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

export class SignupDTO {

  @IsOptional()
  @IsString()
  photo: string;

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
  psychologist: boolean;

  @IsOptional()
  @IsBoolean()
  public: boolean;

  @IsOptional()
  @IsString()
  crp: string;

  @IsOptional()
  @IsEnum(Modality)
  modality: Modality;

  @IsOptional()
  @IsValidPrice({ message: 'sessionCost must be a valid price' })
  @IsNumber()
  @Min(0.00)
  @Max(99999.99)
  sessionCost: number;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @ValidateNested({ each: true })
  address: AddressDTO;

}

export class UpdateMeDTO {
  
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email: string;

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
  @IsEnum(Modality)
  modality: Modality;

  @IsOptional()
  @IsValidPrice({ message: 'sessionCost must be a valid price' })
  @IsNumber()
  @Min(0.00)
  @Max(99999.99)
  sessionCost: number;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @ValidateNested({ each: true })
  address: AddressDTO;

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
  modality?: Modality;
  sessionCost?: number;
  bio?: string;
  address?: Address;

}

