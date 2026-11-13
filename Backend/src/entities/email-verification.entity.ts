import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EmailVerificationPurpose {
  REGISTRATION = 'REGISTRATION',
  // EMAIL_CHANGE = 'EMAIL_CHANGE',
  // PASSWORD_RESET = 'PASSWORD_RESET',
}

@Entity('email_verifications')
@Index(['userId', 'purpose'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  otpHash: string;

  @Column({ type: 'enum', enum: EmailVerificationPurpose })
  purpose: EmailVerificationPurpose;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
