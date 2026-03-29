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
import { FinanceEntryTypeEnum } from '@daylist/common/enums';
import type { IFinanceEntry } from '@daylist/common/types/entities';
import { Category } from './category.entity';
import { User } from './user.entity';

@Entity('finance_entries')
export class FinanceEntry extends BaseEntity implements IFinanceEntry {
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

  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number): number => Math.round(value * 100),
      from: (value: string): number => Number(value) / 100,
    },
  })
  amount!: number;

  @Column({ type: 'enum', enum: FinanceEntryTypeEnum })
  type!: FinanceEntryTypeEnum;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  date!: Date;

  @Column({ length: 3, default: 'RUB' })
  currency!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
