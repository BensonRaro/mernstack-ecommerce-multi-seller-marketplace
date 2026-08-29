import { Outlet } from "react-router";
import { Header } from "@/components/globals/header";

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  );
}
