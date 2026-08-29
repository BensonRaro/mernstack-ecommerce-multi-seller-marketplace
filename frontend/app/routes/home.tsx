import { useEffect } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/home";
import { toast } from "@/components/ui/toast";
import { Hero } from "@/components/globals/hero";
import { Categories } from "@/components/globals/categories";
import { NewArrivals } from "@/components/product/NewArrivals";
import { BestSellers } from "@/components/product/BestSellers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NovaTrend — Trending Products for Modern Lifestyles" },
    { name: "description", content: "Shop the latest trending products curated for modern lifestyles." },
  ];
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "google") {
      toast.add({
        type: "success",
        title: "Welcome!",
        description: "You've successfully signed in with Google.",
      });
      searchParams.delete("auth");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <main>
      <Hero />
      <Categories />
      <NewArrivals />
      <BestSellers />
    </main>
  );
}
