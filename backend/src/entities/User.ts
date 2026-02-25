import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export enum RewardTier {
  BRONZE = "Bronze",
  SILVER = "Silver",
  GOLD = "Gold",
  PLATINUM = "Platinum",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  matricNumber!: string;

  @Column()
  pin!: string;

  @Column({ nullable: true })
  idCardImage!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  fullName!: string;

  @Column()
  department!: string;

  @Column()
  level!: string;

  @Column()
  phoneNumber!: string;

  @Column({ type: "float", default: 0 })
  walletBalance!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: "varchar", nullable: true })
  otp!: string | null;

  @Column({ type: "datetime", nullable: true })
  otpExpires!: Date | null;

  @Column({ default: 0 })
  rideCount!: number;

  @Column({
    type: "simple-enum",
    enum: RewardTier,
    default: RewardTier.BRONZE,
  })
  rewardTier!: RewardTier;
}
