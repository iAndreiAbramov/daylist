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
import type { INote } from '@daylist/common';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity('notes')
export class Note extends BaseEntity implements INote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  content!: string;

  @Column({ type: 'varchar', nullable: true })
  taskId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  financeEntryId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
