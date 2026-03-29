import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import type { INote } from '@daylist/common/types/entities';
import { Category } from './category.entity';
import { User } from './user.entity';

@Entity('notes')
export class Note extends BaseEntity implements INote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column({ type: 'uuid' })
  categoryId!: string;
  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: Relation<Category>;

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  content!: string;

  @Column({ type: 'uuid', nullable: true })
  taskId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  financeEntryId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
