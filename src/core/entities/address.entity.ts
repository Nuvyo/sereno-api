import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';

@Entity('addresses')
export class Address extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  street: string;

  @Column({ type: 'integer', nullable: false })
  number: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  state: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  country: string;

  @ManyToOne(() => PsychologistDetail, (psychologistConfig) => psychologistConfig.in_person_addresses, { onDelete: 'CASCADE' })
  psychologist_detail: PsychologistDetail;

}