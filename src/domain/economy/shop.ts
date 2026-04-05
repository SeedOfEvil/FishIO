import { PRICES, type ShopItem } from "./prices";

export function canAfford(gold: number, item: ShopItem): boolean {
  return gold >= PRICES[item];
}

export function purchaseItem(gold: number, item: ShopItem): { gold: number; success: boolean } {
  if (!canAfford(gold, item)) return { gold, success: false };
  return { gold: gold - PRICES[item], success: true };
}
