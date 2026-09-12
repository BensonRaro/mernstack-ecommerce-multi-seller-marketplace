import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { prisma } from "./prisma.js";
import { ac, buyer, seller, admin as adminRole } from "./permissions.js";

const isProduction = process.env.NODE_ENV === "production";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  baseURL: "http://localhost:5000",
  trustedOrigins: ["http://localhost:5173"],
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    admin({
      ac,
      roles: {
        buyer,
        seller,
        admin: adminRole,
      },
      defaultRole: "buyer",
    }),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      onEvent: async (event) => {
        try {
          if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = (session.metadata as Record<string, string> | null)
              ?.orderId;
            if (orderId) {
              await prisma.order.update({
                where: { id: orderId },
                data: { paymentStatus: "paid", status: "confirmed" },
              });
            } else if (session.id) {
              await prisma.order.updateMany({
                where: { stripeSessionId: session.id },
                data: { paymentStatus: "paid", status: "confirmed" },
              });
            }
          }
          if (
            event.type === "checkout.session.expired" ||
            event.type === "payment_intent.payment_failed"
          ) {
            const obj = event.data.object as {
              id: string;
              metadata?: Record<string, string> | null;
            };
            const orderId = obj.metadata?.orderId;
            if (orderId) {
              await prisma.order.update({
                where: { id: orderId },
                data: { paymentStatus: "failed" },
              });
            }
          }
        } catch (err) {
          console.error("Stripe webhook onEvent error", err);
        }
      },
    }),
  ],
});
