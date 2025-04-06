import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, RelationId } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { Address } from '@core/entities/address.entity';
import { ColumnNumericTransformer } from '@core/entities/utils/transformers';

@Entity({ name: 'psychologist_details' })
export class PsychologistDetail extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  register_number: string;

  @Column({ type: 'boolean', nullable: true })
  has_valid_register: boolean;

  @Column({ type: 'integer', default: 0, nullable: true })
  likes: number;

  @Column({ type: 'boolean', nullable: true })
  online: boolean;

  @Column({ type: 'boolean', nullable: true })
  in_person: boolean;

  @Column({ type: 'decimal', precision: 7, scale: 2, default: 0, nullable: true, transformer: new ColumnNumericTransformer() })
  online_price: number;

  @Column({ type: 'decimal', precision: 7, scale: 2, default: 0, nullable: true, transformer: new ColumnNumericTransformer() })
  in_person_price: number;

  @Column({ type: 'text', nullable: true })
  bio: string;
  
  @RelationId((psychologistConfig: PsychologistDetail) => psychologistConfig.user)
  user_id: string;
  
  @OneToOne(() => User, (user) => user.psychologist_detail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
  
  @OneToMany(() => Address, (address) => address.psychologist_detail)
  in_person_addresses: Address[];

}