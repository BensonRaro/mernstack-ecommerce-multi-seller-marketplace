import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, buyer, seller, admin } from "@/lib/permissions";

export const authClient = createAuthClient({
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
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
