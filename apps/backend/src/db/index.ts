export { db } from "./connection.ts";

export type DbUser = {
  id: string;
  username: string;
  password_hash: string;
  role: string;
};
