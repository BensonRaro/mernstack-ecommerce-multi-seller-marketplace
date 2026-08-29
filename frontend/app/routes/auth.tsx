import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/auth";
import { authClient } from "@/lib/auth-client";

export async function clientLoader() {
  const { data: session } = await authClient.getSession();
  if (session) {
    throw redirect("/");
  }
  return null;
}

export default function AuthLayout() {
  return <Outlet />;
}
