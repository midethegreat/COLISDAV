import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  FAILED = "failed",
}

@Entity()
export class BankAccount {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column()
  accountNumber!: string;

  @Column()
  bankCode!: string;

  @Column()
  accountName!: string;

  @Column({
    type: "simple-enum",
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status!: VerificationStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
