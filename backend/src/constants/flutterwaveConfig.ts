import dotenv from "dotenv";

dotenv.config();

console.log("Attempting to load Flutterwave keys...");
console.log(
  "Public Key Loaded:",
  process.env.FLUTTERWAVE_PUBLIC_KEY ? "Found" : "Not Found",
);
console.log(
  "Secret Key Loaded:",
  process.env.FLUTTERWAVE_SECRET_KEY ? "Found" : "Not Found",
);

export const flutterwaveConfig = {
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
};
