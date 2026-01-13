import { v2 as cloudinary } from "cloudinary";
import { decrypt } from "./crypto";

export function getCloudinary(account: any) {
  cloudinary.config({
    cloud_name: account.cloudName,
    api_key: decrypt(account.apiKeyEncrypted),
    api_secret: decrypt(account.apiSecretEncrypted),
  });

  return cloudinary;
}
