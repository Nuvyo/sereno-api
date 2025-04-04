import { IsBoolean, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';

export class SignupDTO {

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(8)
  password_confirmation: string;

  @IsOptional()
  @IsBoolean()
  is_psychologist: boolean;

}

export class SigninDTO {
  
  @IsString()
  email: string;

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
  access_token: string;

}

export class RefreshTokenDTO {

  @IsUUID('4')
  refresh_token: string;

}

export class PsychologistConfigDTO {

  @IsOptional()
  @IsString()
  register_number: string;

}

export class UpdateProfileDTO {

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  is_psychologist: boolean;

  @IsOptional()
  @ValidateNested()
  psycologist_config: PsychologistConfigDTO;

}
