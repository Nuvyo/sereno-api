import { CreateDateColumn, PrimaryGeneratedColumn, BaseEntity as TypeormEntity, UpdateDateColumn } from 'typeorm';

export class CustomBaseEntity extends TypeormEntity {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;

}