import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CategoryType, ICategory } from '@daylist/common';
import { User } from './user.entity';

@Entity('categories')
export class Category extends BaseEntity implements ICategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: ['task', 'note', 'finance'] })
  type!: CategoryType;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
