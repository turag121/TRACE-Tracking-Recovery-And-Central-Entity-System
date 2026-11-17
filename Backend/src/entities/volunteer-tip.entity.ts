import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum VolunteerTipStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('volunteer_tips')
export class VolunteerTip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  volunteerId: string;

  @Column({ type: 'uuid' })
  reportId: string;

  @Column({ type: 'uuid', nullable: true })
  assignmentId: string | null;

  @Column({ type: 'varchar', length: 255 })
  sightingLocation: string;

  @Column({ type: 'timestamp' })
  sightingDateTime: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  evidencePaths: string[] | null;

  @Column({ type: 'enum', enum: VolunteerTipStatus, default: VolunteerTipStatus.PENDING })
  verificationStatus: VolunteerTipStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
