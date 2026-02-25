import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

export enum RideStatus {
  BOOKED = "booked",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity()
export class Ride {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.id)
  user!: User;

  @Column()
  origin!: string;

  @Column()
  destination!: string;

  @Column("float")
  fare!: number;

  @Column({
    type: "simple-enum",
    enum: RideStatus,
    default: RideStatus.BOOKED,
  })
  status!: RideStatus;

  @Column({ length: 4, nullable: true })
  verificationCode!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "int", nullable: true })
  rating!: number;

  @Column({ type: "float", nullable: true })
  tip!: number;
}
