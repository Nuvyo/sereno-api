import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from '@entities/base.entity';
import { PsychologistConfig } from '@entities/psychologist-config.entity';

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

  @ManyToOne(() => PsychologistConfig, (psychologistConfig) => psychologistConfig.in_person_addresses, { onDelete: 'CASCADE' })
  psychologist_config: PsychologistConfig;

}