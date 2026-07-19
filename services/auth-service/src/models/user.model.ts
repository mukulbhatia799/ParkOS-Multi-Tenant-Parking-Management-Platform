import { Schema, model, Document, Types } from "mongoose";
import { Role } from "@parking/shared";

export interface UserDocument extends Document {
  clientId: Types.ObjectId | null;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  assignedLotIds: Types.ObjectId[];
  status: "invited" | "active" | "disabled";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    role: { type: String, enum: Object.values(Role), required: true },
    assignedLotIds: [{ type: Schema.Types.ObjectId }],
    status: { type: String, enum: ["invited", "active", "disabled"], default: "active" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ clientId: 1, role: 1 });

export const UserModel = model<UserDocument>("User", userSchema);
