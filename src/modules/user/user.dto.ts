import { Modality } from '@core/entities/user.entity';
import { Address } from '@core/entities/address.entity';


export class FindPsychologistDTO {
  id: string;
  name: string;
  modality: Modality;
  sessionCost: number;
  bio: string;
  likes?: number;
  address?: Address;
}
