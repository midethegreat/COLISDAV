import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  matricNumber: string;

  @Column()
  pin: string;

  @Column({ nullable: true })
  idCardImage: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column()
  department: string;

  @Column()
  level: string;

  @Column()
  phoneNumber: string;

  @Column({ type: "float", default: 0 })
  walletBalance: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: "datetime", nullable: true })
  otpExpires: Date;

  @Column({ default: 0 })
  rideCount: number;

  @Column({ default: "Bronze" })
  rewardTier: string;
}
