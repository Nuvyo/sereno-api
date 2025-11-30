import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { IsValidPrice } from '../../core/decorators/is-valid-price.decorator';
import 'reflect-metadata';
import { Specialization } from '../../core/entities/user.entity';

export class AddressDTO {

  @IsNotEmpty({ message: 'auth.validator.street_not_empty' })
  @IsString({ message: 'auth.validator.street_must_be_string' })
  street: string;

  @IsNotEmpty({ message: 'auth.validator.number_not_empty' })
  @IsNumber({}, { message: 'auth.validator.number_must_be_number' })
  number: string;

  @IsNotEmpty({ message: 'auth.validator.city_not_empty' })
  @IsString({ message: 'auth.validator.city_must_be_string' })
  city: string;

  @IsNotEmpty({ message: 'auth.validator.state_not_empty' })
  @IsString({ message: 'auth.validator.state_must_be_string' })
  state: string;

  @IsNotEmpty({ message: 'auth.validator.countryCode_not_empty' })
  @IsString({ message: 'auth.validator.countryCode_must_be_string' })
  countryCode: string;

  @IsNotEmpty({ message: 'auth.validator.postalCode_not_empty' })
  @IsString({ message: 'auth.validator.postalCode_must_be_string' })
  postalCode: string;

  @IsOptional()
  @IsString({ message: 'auth.validator.complement_must_be_string' })
  complement: string;

}

export class UpdateMeDTO {

  @IsOptional()
  @IsString({ message: 'auth.validator.name_must_be_string' })
  name: string;

  @IsOptional()
  @IsString({ message: 'auth.validator.photo_must_be_string' })
  photo: string;

  @IsOptional()
  @IsBoolean({ message: 'auth.validator.public_must_be_boolean' })
  public: boolean;

  @IsOptional()
  @IsString({ message: 'auth.validator.crp_must_be_string' })
  crp: string;

  @IsOptional()
  @IsArray({ message: 'auth.validator.specializations_must_be_array' })
  @IsEnum(Specialization, { each: true, message: 'auth.validator.specializations_value_invalid' })
  specializations: Specialization[];

  @IsOptional()
  @IsString({ message: 'auth.validator.whatsapp_must_be_string' })
  whatsapp: string;

  @IsOptional()
  @IsValidPrice({ message: 'auth.validator.sessionCost_must_be_valid_price' })
  @IsNumber( {}, { message: 'auth.validator.sessionCost_must_be_number' })
  @Min(0.0, { message: 'auth.validator.sessionCost_min_value' })
  @Max(99999.99, { message: 'auth.validator.sessionCost_max_value' })
  sessionCost: number;

  @IsOptional()
  @IsString({ message: 'auth.validator.bio_must_be_string' })
  bio: string;

}

export class SignupDTO extends UpdateMeDTO {

  @IsNotEmpty({ message: 'auth.validator.email_not_empty' })
  @IsString({ message: 'auth.validator.email_must_be_string' })
  email: string;

  @IsOptional()
  @IsBoolean({ message: 'auth.validator.psychologist_must_be_boolean' })
  psychologist: boolean;

  @IsNotEmpty({ message: 'auth.validator.password_not_empty' })
  @IsString({ message: 'auth.validator.password_must_be_string' })
  @MinLength(8, { message: 'auth.validator.password_min_length' })
  password: string;

  @IsNotEmpty({ message: 'auth.validator.passwordConfirmation_not_empty' })
  @IsString({ message: 'auth.validator.passwordConfirmation_must_be_string' })
  @MinLength(8, { message: 'auth.validator.passwordConfirmation_min_length' })
  passwordConfirmation: string;

}

export class SigninDTO {

  @IsNotEmpty({ message: 'auth.validator.email_not_empty' })
  @IsString({ message: 'auth.validator.email_must_be_string' })
  email: string;

  @IsNotEmpty({ message: 'auth.validator.password_not_empty' })
  @IsString({ message: 'auth.validator.password_must_be_string' })
  password: string;

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
