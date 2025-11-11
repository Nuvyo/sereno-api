import { Specialization } from '../../core/entities/user.entity';


export class FindPsychologistDTO {

  id: string;
  name: string;
  sessionCost: number;
  bio: string;
  specializations?: Specialization[];
  whatsapp?: string;

}
