import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, RelationId } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { Address } from '@core/entities/address.entity';
import { ColumnDecimalTransformer } from '@core/entities/utils/transformers';
import { Session } from '@core/entities/session.entity';
import { Like } from '@core/entities/like.entity';

@Entity({ name: 'psychologist_details' })
export class PsychologistDetail extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: true })
  registerNumber: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  hasValidRegister: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  online: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  inPerson: boolean;

  @Column({ type: 'decimal', precision: 7, scale: 2, default: null, nullable: true, transformer: new ColumnDecimalTransformer() })
  onlinePrice: number;

  @Column({ type: 'decimal', precision: 7, scale: 2, default: null, nullable: true, transformer: new ColumnDecimalTransformer() })
  inPersonPrice: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @RelationId((psychologistConfig: PsychologistDetail) => psychologistConfig.user)
  userId: string;

  @OneToOne(() => User, (user) => user.psychologistDetail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Like, (detail) => detail.psychologistDetail)
  likes: Like[];

  @OneToMany(() => Address, (address) => address.psychologistDetail)
  inPersonAddresses: Address[];

  @OneToMany(() => Session, (session) => session.psychologistDetail)
  sessionsConducted: Session[];

}