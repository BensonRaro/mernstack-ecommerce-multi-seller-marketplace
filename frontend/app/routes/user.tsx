import { Outlet } from "react-router";
import { authClient } from "@/lib/auth-client";
import { redirect } from "react-router";

export async function clientLoader() {
  const { data: session } = await authClient.getSession();
  if (!session) throw redirect("/login");
  return null;
}

export default function UserLayout() {
  return <Outlet />;
}