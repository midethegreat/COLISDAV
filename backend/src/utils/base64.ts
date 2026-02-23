export const base64 = {
  encode: (str: string): string => {
    return Buffer.from(str).toString("base64");
  },
  decode: (str: string): string => {
    return Buffer.from(str, "base64").toString("ascii");
  },
};
