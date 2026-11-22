// Game categories, same grouping/labels/order as lotto-seed-app:
// card + poker + keno are merged into one "CARDGROUP" category; others map 1:1 to an API game type.
export type Category = {
  id: string;
  en: string;
  th: string;
  short: string; // label for narrow spaces (mobile sidebar)
  icon: string; // key understood by <CategoryIcon>
  types: string[]; // backend game types ( /games/providers/{type} )
};

export const ALL_CATEGORIES: Category[] = [
  { id: "slot", en: "SLOT", th: "สล็อต", short: "สล็อต", icon: "slot", types: ["slot"] },
  { id: "casino", en: "CASINO", th: "คาสิโน", short: "คาสิโน", icon: "casino", types: ["casino"] },
  { id: "sport", en: "SPORT", th: "กีฬา", short: "กีฬา", icon: "sport", types: ["sport"] },
  { id: "cardgroup", en: "CARD GAME", th: "เกมไพ่ / โป๊กเกอร์ / คีโน่", short: "เกมไพ่", icon: "cardgroup", types: ["card", "poker", "keno"] },
  { id: "cock", en: "COCK FIGHT", th: "ไก่ชน", short: "ไก่ชน", icon: "cock", types: ["cock"] },
  { id: "fish", en: "FISHING", th: "ยิงปลา", short: "ยิงปลา", icon: "fishing", types: ["fish"] },
];

export const DEFAULT_CATEGORY = "slot";
export const getCategory = (id: string | null | undefined) => ALL_CATEGORIES.find((c) => c.id === id);
