import React from "react";
import { View, Pressable, Text, StyleSheet, DeviceEventEmitter } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";
import { CART_EVENTS } from "@/src/api/cartService.mobile";

const BG = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const ACCENT = "#3d36feff";
const BORDER = "#e5e7eb";
const DANGER = "#ef4444";

export type TabKey = "home" | "catalog" | "cart" | "favorites" | "profile";

type Props = {
  /** Активная вкладка. Если не передать — вычислится по URL. */
  active?: TabKey;
};

const baseRaw = () => (OpenAPI.baseUrl || "").replace(/\/+$/, "");
const baseNoApi = () => baseRaw().replace(/\/api$/i, "");
const withApi = (p: string) => {
  const b = baseRaw();
  const hasApi = /\/api$/i.test(b);
  const path = p.replace(/^\/+/, "").replace(/^api\/?/i, "");
  return hasApi ? `${b}/${path}` : `${b}/api/${path}`;
};
const withoutApi = (p: string) =>
  `${baseNoApi()}/${p.replace(/^\/+/, "").replace(/^api\/?/i, "")}`;
const bothPaths = (p: string) => {
  const a = withApi(p),
    b = withoutApi(p);
  return a === b ? [a] : [a, b];
};
const ok = (r: Response) => r.ok || r.status === 204;

export default function TabBar({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // если active не передали — попытаемся определить по текущему пути
  const current: TabKey =
    active ??
    (pathname?.includes("/catalog")
      ? "catalog"
      : pathname?.includes("/cart")
      ? "cart"
      : pathname?.includes("/favorites")
      ? "favorites"
      : pathname?.includes("/profile")
      ? "profile"
      : "home");

  // ====== cart badge ======
  const [cartCount, setCartCount] = React.useState<number>(0);

  const loadCartCount = React.useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setCartCount(0);
        return;
      }
      let data: any = null;
      for (const url of bothPaths("Cart/GetByMyId")) {
        try {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
          if (!ok(res)) continue;
          data = await res.json().catch(() => []);
          break;
        } catch {}
      }
      const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.list)
        ? data.list
        : Array.isArray(data?.carts)
        ? data.carts
        : [];

      // суммируем pcs; если pcs нигде нет — считаем количество позиций
      let sum = 0;
      let sawQty = false;
      for (const x of list) {
        const q = Number(x?.pcs ?? x?.quantity ?? x?.count ?? x?.qty ?? x?.amount ?? x?.pieces);
        if (Number.isFinite(q) && q > 0) {
          sum += q;
          sawQty = true;
        }
      }
      if (!sawQty) sum = list.length;
      setCartCount(sum || 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  React.useEffect(() => {
    loadCartCount(); // при монтировании/смене маршрута
  }, [loadCartCount, pathname]);

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CART_EVENTS.Changed, loadCartCount);
    return () => sub.remove();
  }, [loadCartCount]);

  const Btn = ({
    label,
    icon,
    tab,
    to,
    badge,
  }: {
    label: string;
    icon: React.ComponentProps<typeof FontAwesome>["name"];
    tab: TabKey;
    to: string;
    badge?: number;
  }) => {
    const activeTab = current === tab;
    const showBadge = !!badge && badge > 0;

    // текст для бейджа
    const badgeText = showBadge ? (badge > 99 ? "99+" : String(badge)) : "";

    return (
      <Pressable onPress={() => router.push(to as any)} style={({ pressed }) => [S.tabBtn, pressed && { opacity: 0.85 }]}>
        <View style={{ position: "relative", marginBottom: 2 }}>
          <FontAwesome name={icon} size={18} color={activeTab ? ACCENT : TEXT} />
          {showBadge && (
            <View style={S.badge}>
              <Text style={S.badgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
        <Text style={[S.tabText, activeTab && { color: ACCENT }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={S.wrap}>
      <Btn label="Головна" icon="home" tab="home" to="/home" />
      <Btn label="Каталог" icon="bars" tab="catalog" to="/catalog" />
      <Btn label="Кошик" icon="shopping-cart" tab="cart" to="/cart" badge={cartCount} />
      <Btn label="Обране" icon="heart" tab="favorites" to="/favorites" />
      <Btn label="Кабінет" icon="user" tab="profile" to="/profile" />
    </View>
  );
}

const S = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tabBtn: { alignItems: "center", paddingHorizontal: 8 },
  tabText: { color: SUBTEXT, fontSize: 12, fontWeight: "700" },

  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: DANGER,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
