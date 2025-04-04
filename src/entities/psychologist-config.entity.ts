import { CustomBaseEntity } from '@entities/base.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, RelationId } from 'typeorm';
import { User } from '@entities/user.entity';
import { Address } from '@entities/address.entity';

@Entity({ name: 'psychologist_configs' })
export class PsychologistConfig extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  register_number: string;

  @Column({ type: 'boolean', nullable: true })
  has_valid_register: boolean;

  @Column({ type: 'boolean', nullable: true })
  likes: boolean;

  @Column({ type: 'boolean', nullable: true })
  attends_online: boolean;

  @Column({ type: 'boolean', nullable: true })
  attends_in_person: boolean;

  @Column({ type: 'decimal', nullable: true })
  online_price: number;

  @Column({ type: 'decimal', nullable: true })
  in_person_price: number;
  
  @RelationId((psychologistConfig: PsychologistConfig) => psychologistConfig.user)
  user_id: string;
  
  @OneToOne(() => User, (user) => user.psychologist_config, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
  
  @OneToMany(() => Address, (address) => address.psychologist_config)
  in_person_addresses: Address[];

}