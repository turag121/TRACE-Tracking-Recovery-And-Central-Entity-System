
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ReportStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FOUND = 'FOUND',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

@Entity('missing_person_reports')
export class MissingPersonReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  personName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({ type: 'integer', nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  gender: string | null;

  @Column({ type: 'text', nullable: true })
  physicalDescription: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  photographPath: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastSeenLocation: string | null;

  @Column({ type: 'date', nullable: true })
  lastSeenDate: string | null;

  @Column({ type: 'text', nullable: true })
  additionalInformation: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactEmail: string | null;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    nullable: false,
  })
  status: ReportStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  reporterId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'caseOfficerId' })
  caseOfficer: User | null;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  caseOfficerId: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
