import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum EmailVerificationPurpose {
  REGISTRATION = 'REGISTRATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export enum VerificationRole {
  MPR = 'MPR',
  VOLUNTEER = 'VOLUNTEER',
}

@Entity('email_verifications')
@Index(['email', 'purpose'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'enum', enum: VerificationRole, nullable: true })
  role: VerificationRole | null;

  @Column({ type: 'jsonb', nullable: true })
  verificationData: Record<string, string> | null;

  @Column({ type: 'varchar', length: 255 })
  otpHash: string;

  @Column({ type: 'enum', enum: EmailVerificationPurpose })
  purpose: EmailVerificationPurpose;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
