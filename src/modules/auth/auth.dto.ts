import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsEmail,
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

  @IsOptional()
  @IsString({ message: 'auth.validator.currentPassword_must_be_string' })
  currentPassword: string;

  @IsOptional()
  @IsString({ message: 'auth.validator.password_must_be_string' })
  @MinLength(8, { message: 'auth.validator.password_min_length' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'auth.validator.password_doesnt_meet_requirements',
  })
  newPassword: string;

  @IsOptional()
  @IsString({ message: 'auth.validator.passwordConfirmation_must_be_string' })
  @MinLength(8, { message: 'auth.validator.passwordConfirmation_min_length' })
  newPasswordConfirmation: string;

}

export class SignupDTO {

  @IsOptional()
  @IsString({ message: 'auth.validator.name_must_be_string' })
  name: string;

  @IsNotEmpty({ message: 'auth.validator.email_not_empty' })
  @IsEmail({}, { message: 'auth.validator.invalid_email' })
  email: string;

  @IsNotEmpty({ message: 'auth.validator.password_not_empty' })
  @IsString({ message: 'auth.validator.password_must_be_string' })
  @MinLength(8, { message: 'auth.validator.password_min_length' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'auth.validator.password_doesnt_meet_requirements',
  })
  password: string;

  @IsNotEmpty({ message: 'auth.validator.passwordConfirmation_not_empty' })
  @IsString({ message: 'auth.validator.passwordConfirmation_must_be_string' })
  @MinLength(8, { message: 'auth.validator.passwordConfirmation_min_length' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'auth.validator.password_doesnt_meet_requirements',
  })
  passwordConfirmation: string;

}

export class SigninDTO {

  @IsNotEmpty({ message: 'auth.validator.email_not_empty' })
  @IsEmail({}, { message: 'auth.validator.invalid_email' })
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

export class VerifyEmailDTO {

  @IsNotEmpty({ message: 'auth.validator.token_not_empty' })
  @IsString({ message: 'auth.validator.token_must_be_string' })
  token: string;

}

export class ResendVerificationEmailDTO {

  @IsNotEmpty({ message: 'auth.validator.email_not_empty' })
  @IsEmail({}, { message: 'auth.validator.invalid_email' })
  email: string;

}

export class ConfirmCancelAccountDTO {

  @IsNotEmpty({ message: 'auth.validator.token_not_empty' })
  @IsString({ message: 'auth.validator.token_must_be_string' })
  token: string;

}
