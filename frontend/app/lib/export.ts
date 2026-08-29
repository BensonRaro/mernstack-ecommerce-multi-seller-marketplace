import type { Product } from "@/hooks/use-products";

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(products: Product[], filename = "products") {
  if (!products.length) return;

  const headers = ["Name", "Category", "Price", "Discount", "Stock", "Status", "Sizes", "Colors", "Gender", "Created At"];
  const rows = products.map((p) => [
    escapeCsvValue(p.name),
    escapeCsvValue(p.category),
    escapeCsvValue(p.price),
    escapeCsvValue(p.discount),
    escapeCsvValue(p.stock),
    escapeCsvValue(p.status),
    escapeCsvValue(p.sizes.join("|")),
    escapeCsvValue(p.colors.join("|")),
    escapeCsvValue(p.gender ?? ""),
    escapeCsvValue(new Date(p.createdAt).toISOString()),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToJson(products: Product[], filename = "products") {
  const json = JSON.stringify(products, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
