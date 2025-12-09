import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import 'reflect-metadata';

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

}

export class SignupDTO extends UpdateMeDTO {

  @IsNotEmpty({ message: 'auth.validator.email_not_empty' })
  @IsString({ message: 'auth.validator.email_must_be_string' })
  email: string;

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

}
