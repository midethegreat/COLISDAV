export interface User {
  matricNumber: string;
  fullName: string;
  department: string;
  level: string;
  phoneNumber: string;
  bloodGroup: string;
  bio: string;
  profileImage: string | null;
  idCardImage: string | null;
  pin: string;
  walletBalance: number;
}

export interface Driver {
  id: string;
  name: string;
  plateNumber: string;
  rating: number;
  totalSeats: number;
  occupiedSeats: number;
  distance: number;
  fare: number;
  status: "available" | "busy";
  image: string;
  verified: boolean;
  tricycleType: "yellow" | "green";
  online: boolean;
  verificationCode: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Ride {
  id: string;
  date: string;
  pickupLocation: string;
  destination: string;
  fare: number;
  status: "completed" | "cancelled" | "ongoing";
  driverName: string;
  txId: string;
}

export interface Transaction {
  id: string;
  type: "ride" | "topup" | "withdrawal" | "crypto";
  title: string;
  amount: number;
  isCredit: boolean;
  date: string;
  status: "completed" | "void" | "pending";
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "driver" | "ai" | "agent";
  timestamp: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount: number;
  description: string;
  expiresAt: string;
}

export interface StudentRecord {
  fullName: string;
  department: string;
  level: string;
  phoneNumber: string;
}
