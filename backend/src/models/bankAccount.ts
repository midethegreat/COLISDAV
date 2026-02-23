import mongoose, { Document, Schema } from 'mongoose';

export interface IBankAccount extends Document {
  user: mongoose.Schema.Types.ObjectId;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const BankAccountSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName: { type: String, required: true },
});

export default mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);
