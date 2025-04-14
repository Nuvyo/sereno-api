export class FindPsychologistDTO {
  id: string;
  name: string;
  psychologistDetail: FindPsychologistDetailDTO;
}

export class FindPsychologistDetailDTO {
  likes: number;
  sessionsConducted: number;
  inPerson: boolean;
  online: boolean;
  inPersonPrice: number;
  onlinePrice: number;
  bio: string;
  hasValidRegister: boolean;
}
