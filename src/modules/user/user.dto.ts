import { Modality, Specialization } from '@core/entities/user.entity';


export class FindPsychologistDTO {
  id: string;
  name: string;
  modality: Modality;
  sessionCost: number;
  bio: string;
  specializations?: Specialization[];
  whatsapp?: string;
}
