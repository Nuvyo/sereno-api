import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { User } from './user.entity';

@Entity('addresses')
export class Address extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  street: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  number: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  state: string;

  @Column({ type: 'varchar', length: 2, nullable: false })
  countryCode: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  postalCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement: string;

  @RelationId((address: Address) => address.user)
  userId: string;

  @OneToOne(() => User, (user) => user.address, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

}
