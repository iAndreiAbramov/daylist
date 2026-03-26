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
import type { FinanceEntryType, IFinanceEntry } from '@daylist/common';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity('finance_entries')
export class FinanceEntry extends BaseEntity implements IFinanceEntry {
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

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type!: FinanceEntryType;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ length: 3, default: 'RUB' })
  currency!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
