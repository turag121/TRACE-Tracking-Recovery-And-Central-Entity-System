import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum VolunteerAssignmentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  LEFT = 'LEFT',
  REJECTED = 'REJECTED',
}

@Entity('volunteer_assignments')
@Index(['reportId', 'volunteerId'])
export class VolunteerAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reportId: string;

  @Column({ type: 'uuid' })
  volunteerId: string;

  @Column({ type: 'enum', enum: VolunteerAssignmentStatus, default: VolunteerAssignmentStatus.PENDING })
  status: VolunteerAssignmentStatus;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
