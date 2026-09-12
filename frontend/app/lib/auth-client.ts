import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, buyer, seller, admin } from "@/lib/permissions";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5000",
  plugins: [
    adminClient({
      ac,
      roles: {
        buyer,
        seller,
        admin,
      },
    }),
  ],
});
