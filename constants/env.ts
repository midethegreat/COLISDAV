import dotenv from "dotenv";

dotenv.config();

export const monnifyConfig = {
  apiKey: process.env.MONNIFY_API_KEY || "MK_TEST_8RKZ67VKDA",
  secretKey: process.env.MONNIFY_SECRET_KEY || "AANZP456UMQ9RDN7PX3YSQE2ZVVDM54Q",
  contractCode: process.env.MONNIFY_CONTRACT_CODE || "4803410347",
  baseUrl: "https://sandbox.monnify.com",
};