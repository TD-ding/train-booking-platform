import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

export const statusLabels: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  cancelled: "已取消",
  completed: "已完成",
  refunded: "已退票",
};

export const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  completed: "bg-blue-100 text-blue-800",
  refunded: "bg-red-100 text-red-800",
};
