import { CreateDateColumn, PrimaryGeneratedColumn, BaseEntity as TypeormEntity, UpdateDateColumn } from 'typeorm';

export class CustomBaseEntity extends TypeormEntity {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updatedAt: Date;

}
