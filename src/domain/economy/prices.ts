export const PRICES = {
  foodPack: 5,
  premiumFood: 15,
  plantDecoration: 25,
  cleaningKit: 10,
} as const;

export type ShopItem = keyof typeof PRICES;
