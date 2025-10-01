import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Platform,
  Image,
  DeviceEventEmitter,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";
import TabBar from "@/src/ui/TabBar";
import CartEmpty from "@/assets/cart-empty.svg";
import {
  searchProductsByName,
  getProductMediaUrls,
  Product,
} from "@/src/api/productService.mobile";
import { CART_EVENTS } from "@/src/api/cartService.mobile";

const BG = "#ffffff";
const TEXT = "#111111";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#4563d1";
const DANGER = "#ef4444";
const CARD = "#ffffff";

const RECS_H = 200;
const PANEL_FOOTER_H = 64;

type CartItem = {
  id?: string;
  productId?: string;
  productName?: string | null;
  price?: number;
  pcs?: number;
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
  const a = withApi(p), b = withoutApi(p);
  return a === b ? [a] : [a, b];
};
const ok = (r: Response) => r.ok || r.status === 204;

function fmtPrice(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n) + " ₴";
  } catch {
    return Math.round(n).toString() + " ₴";
  }
}

function normalizeCartItems(json: any): CartItem[] {
  const src: any[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.items)
    ? json.items
    : Array.isArray(json?.list)
    ? json.list
    : Array.isArray(json?.carts)
    ? json.carts
    : [];

  return src
    .map((x) => {
      const id =
        x?.id ?? x?.cartItemId ?? x?._id ?? (typeof x?.cartId === "string" ? x.cartId : undefined);
      const productId =
        x?.productId ??
        x?.productID ??
        x?.product_id ??
        x?.product?.id ??
        (typeof x?.idProduct === "string" ? x.idProduct : undefined);
      const productName = x?.productName ?? x?.name ?? x?.product?.name ?? null;
      const pcs = Number(
        x?.pcs ?? x?.quantity ?? x?.count ?? x?.qty ?? x?.amount ?? x?.pieces ?? 0
      );
      const price = Number(x?.price ?? x?.unitPrice ?? x?.unit_price ?? x?.product?.price ?? 0);
      return {
        id: id ? String(id) : undefined,
        productId: productId ? String(productId) : undefined,
        productName,
        pcs: Number.isFinite(pcs) ? pcs : 0,
        price: Number.isFinite(price) ? price : 0,
      } as CartItem;
    })
    .filter((it) => it.id && (it.productId || it.productName));
}

async function fetchProductById(productId: string) {
  const tries = bothPaths(`Product/get-by-id/${encodeURIComponent(productId)}`);
  let last: any = null;
  for (const u of tries) {
    try {
      const r = await fetch(u, { headers: { Accept: "application/json" } });
      if (!ok(r)) {
        last = `HTTP ${r.status}`;
        continue;
      }
      const j = await r.json();
      return (j?.data ?? j?.item ?? j) as {
        id?: string;
        name?: string;
        price?: number;
        hasDiscount?: boolean;
        discountPrice?: number | null;
      };
    } catch (e) {
      last = e;
    }
  }
  throw last ?? new Error("product not found");
}

function finalPrice(p?: { price?: number; hasDiscount?: boolean; discountPrice?: number | null }) {
  if (!p) return 0;
  const d = typeof p.discountPrice === "number" && p.discountPrice > 0 ? p.discountPrice : undefined;
  return p.hasDiscount && d ? d : p.price ?? 0;
}

export default function CartScreen() {
  const r = useRouter();
  const clearCartOnSuccess = React.useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("401");
      for (const url of bothPaths("Cart/ClearCartList")) {
        const res = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ok(res)) break;
      }
    } catch {}
    setItems([]);
    DeviceEventEmitter.emit(CART_EVENTS.Changed);
  }, []);

  const [items, setItems] = React.useState<CartItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [unauth, setUnauth] = React.useState(false);

  const [rec, setRec] = React.useState<Product[]>([]);
  const [recLoading, setRecLoading] = React.useState(true);

  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [ordering, setOrdering] = React.useState(false);

  const DELIVERY = ["Нова пошта", "Укрпошта", "Самовивіз"] as const;
  const PAY = ["Картка онлайн", "Післяплата"] as const;

  const [delivery, setDelivery] = React.useState<(typeof DELIVERY)[number]>("Нова пошта");
  const [payment, setPayment] = React.useState<(typeof PAY)[number]>("Картка онлайн");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");

  const [cardNumber, setCardNumber] = React.useState("");
  const [cardName, setCardName] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");

  const total = React.useMemo(
    () => items.reduce((s, it) => s + (it.price || 0) * (it.pcs || 0), 0),
    [items]
  );

  const resetCheckout = React.useCallback(() => {
    setStep(1);
    setDelivery("Нова пошта");
    setPayment("Картка онлайн");
    setFullName("");
    setPhone("");
    setCity("");
    setAddress("");
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setUnauth(false);
    try {
      const token = await getToken();
      if (!token) {
        setUnauth(true);
        setItems([]);
        return;
      }
      let json: any = null;
      for (const url of bothPaths("Cart/GetByMyId")) {
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (res.status === 401) {
            setUnauth(true);
            setItems([]);
            return;
          }
          if (!ok(res)) continue;
          json = await res.json().catch(() => []);
          break;
        } catch {}
      }
      const normalized = normalizeCartItems(json);
      const needFetch = [
        ...new Set(
          normalized
            .filter((x) => !x.productName || !x.price || x.price === 0)
            .map((x) => x.productId)
            .filter(Boolean) as string[]
        ),
      ];
      const map = new Map<string, { name?: string; unitPrice: number }>();
      await Promise.all(
        needFetch.map(async (pid) => {
          try {
            const p = await fetchProductById(pid);
            map.set(pid, { name: p?.name, unitPrice: finalPrice(p) });
          } catch {}
        })
      );
      const enriched = normalized.map((x) => {
        if (!x.productId) return x;
        const found = map.get(x.productId);
        return !found
          ? x
          : {
              ...x,
              productName: x.productName ?? found.name ?? x.productId,
              price: x.price && x.price > 0 ? x.price : found.unitPrice,
            };
      });
      setItems(enriched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CART_EVENTS.Changed, () => load());
    return () => sub.remove();
  }, [load]);

  const loadRecs = React.useCallback(async () => {
    setRecLoading(true);
    try {
      const seed: Array<{ lang: "uk" | "ru" | "en"; q: string[] }> = [
        { lang: "uk", q: ["чохол", "телефон", "наушники", "годинник", "ноутбук"] },
        { lang: "ru", q: ["чехол", "телефон", "наушники", "ноутбук"] },
        { lang: "en", q: ["case", "phone", "laptop", "watch"] },
      ];
      const out: Product[] = [];
      const seen = new Set<string>();
      for (const pack of seed) {
        for (const s of pack.q) {
          const list = await searchProductsByName(s, pack.lang);
          for (const p of list) {
            if (!p?.id || seen.has(p.id)) continue;
            seen.add(p.id);
            out.push(p);
            if (out.length >= 16) break;
          }
          if (out.length >= 16) break;
        }
        if (out.length >= 16) break;
      }
      setRec(out.slice(0, 16));
    } catch {
      setRec([]);
    } finally {
      setRecLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRecs();
  }, [loadRecs]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    load();
    loadRecs();
  }, [load, loadRecs]);

  const change = async (id?: string, delta = 1) => {
    if (!id) return;
    const current = items.find((x) => x.id === id);
    const newCount = Math.max(0, (current?.pcs || 0) + delta);

    const prev = items;
    const next = prev.map((it) => (it.id === id ? { ...it, pcs: newCount } : it));
    setItems(next);

    try {
      const token = await getToken();
      if (!token) throw new Error("401");
      if (newCount === 0) {
        let okDel = false;
        for (const url of bothPaths(`Cart/DeleteFromCart?id=${encodeURIComponent(id)}`)) {
          const resDel = await fetch(url, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (ok(resDel)) {
            okDel = true;
            break;
          }
        }
        if (!okDel) throw new Error("Не вдалося видалити");
      } else {
        let okPut = false;
        for (const url of bothPaths(
          `Cart/ChangeCartPcs?id=${encodeURIComponent(id)}&pcs=${newCount}`
        )) {
          const res = await fetch(url, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (ok(res)) {
            okPut = true;
            break;
          }
        }
        if (!okPut) throw new Error("Не вдалося змінити кількість");
      }
    } catch (e: any) {
      setItems(prev);
      Alert.alert("Помилка", e?.message || "Не вдалося змінити кількість");
    }
  };

  const remove = async (id?: string) => {
    if (!id) return;
    const prev = items;
    const next = prev.filter((x) => x.id !== id);
    setItems(next);

    try {
      const token = await getToken();
      if (!token) throw new Error("401");
      let okDel = false;
      for (const url of bothPaths(`Cart/DeleteFromCart?id=${encodeURIComponent(id)}`)) {
        const res = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ok(res)) {
          okDel = true;
          break;
        }
      }
      if (!okDel) throw new Error("Не вдалося видалити");
    } catch (e: any) {
      setItems(prev);
      Alert.alert("Помилка", e?.message || "Не вдалося видалити");
    }
  };

  if (loading) {
    return (
      <View style={[S.screen, S.center]}>
        <ActivityIndicator />
        <TabBar active="cart" />
      </View>
    );
  }

  return (
    <View style={S.screen}>
      {items.length > 0 ? (
        <View style={S.headerRow}>
          <Pressable onPress={() => onRefresh()} style={S.headerBtn}>
            <Text style={S.headerBtnText}>Оновити</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              if (!items.length) return;
              try {
                const token = await getToken();
                if (!token) throw new Error("401");
                let okDel = false;
                for (const url of bothPaths("Cart/ClearCartList")) {
                  const res = await fetch(url, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (ok(res)) {
                    okDel = true;
                    break;
                  }
                }
                if (!okDel) throw new Error("Не вдалося очистити");
                load();
              } catch (e: any) {
                Alert.alert("Помилка", e?.message || "Не вдалося очистити");
              }
            }}
            style={[S.headerBtn, { marginLeft: 8 }]}
          >
            <Text style={S.headerBtnText}>Очистити</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={S.panel}>
        <FlatList
          data={items}
          keyExtractor={(it, i) => it.id ?? `${i}`}
          showsVerticalScrollIndicator
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: PANEL_FOOTER_H + 16 }}
          ListEmptyComponent={
            <EmptyCartBlock
              unauth={unauth}
              goCatalog={() => r.push("/home" as any)}
              goSignIn={() => r.push("/sign-in" as any)}
            />
          }
          renderItem={({ item }) => (
            <CartRow
              item={item}
              onDec={() => change(item.id, -1)}
              onInc={() => change(item.id, +1)}
              onRemove={() => remove(item.id)}
            />
          )}
        />

        <View style={S.panelFooter}>
          <View style={{ flex: 1 }}>
            <Text style={S.totalLabel}>Всього</Text>
            <Text style={S.totalValue}>{fmtPrice(total)}</Text>
          </View>
          <Pressable
            onPress={() => {
              resetCheckout();
              setCheckoutOpen(true);
            }}
            style={[S.checkout, ordering && { opacity: 0.85 }]}
          >
            <FontAwesome name="shopping-cart" size={16} color="#fff" />
            <Text style={S.checkoutText}>Замовити</Text>
          </Pressable>
        </View>
      </View>

      <RecommendationsBox
        items={rec}
        loading={recLoading}
        onPressItem={(id) => r.push(`/product/id?id=${encodeURIComponent(id)}` as any)}
      />

      <Modal visible={checkoutOpen} transparent animationType="slide" onRequestClose={() => setCheckoutOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
          <Pressable style={S.sheetDim} onPress={() => setCheckoutOpen(false)} />
          <View style={S.sheet}>
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>Оформлення</Text>
              <Pressable onPress={() => setCheckoutOpen(false)} style={S.xBtn}>
                <FontAwesome name="close" size={18} color={TEXT} />
              </Pressable>
            </View>

            {step === 1 ? (
              <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
                <Text style={S.sheetLabel}>Контакти</Text>
                <TextInput
                  placeholder="ПІБ"
                  value={fullName}
                  onChangeText={setFullName}
                  style={S.input}
                  placeholderTextColor={MUTED}
                />
                <TextInput
                  placeholder="Телефон"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={S.input}
                  placeholderTextColor={MUTED}
                />

                <Text style={[S.sheetLabel, { marginTop: 10 }]}>Доставка</Text>
                <View style={S.segmentRow}>
                  {DELIVERY.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setDelivery(d)}
                      style={[S.segmentBtn, delivery === d && S.segmentBtnActive]}
                    >
                      <Text style={[S.segmentTxt, delivery === d && S.segmentTxtActive]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>

                {delivery !== "Самовивіз" ? (
                  <>
                    <TextInput
                      placeholder="Населений пункт"
                      value={city}
                      onChangeText={setCity}
                      style={S.input}
                      placeholderTextColor={MUTED}
                    />
                    <TextInput
                      placeholder="Адреса / відділення"
                      value={address}
                      onChangeText={setAddress}
                      style={S.input}
                      placeholderTextColor={MUTED}
                    />
                  </>
                ) : null}

                <Text style={[S.sheetLabel, { marginTop: 10 }]}>Оплата</Text>
                <View style={S.segmentRow}>
                  {PAY.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setPayment(p)}
                      style={[S.segmentBtn, payment === p && S.segmentBtnActive]}
                    >
                      <Text style={[S.segmentTxt, payment === p && S.segmentTxtActive]}>{p}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={() => {
                    if (!fullName.trim() || !phone.trim()) {
                      Alert.alert("Заповніть контакти", "Вкажіть ПІБ і телефон.");
                      return;
                    }
                    if (delivery !== "Самовивіз" && (!city.trim() || !address.trim())) {
                      Alert.alert("Адреса", "Вкажіть населений пункт і адресу/відділення.");
                      return;
                    }
                    if (payment === "Картка онлайн") {
                      setStep(2);
                    } else {
                      setOrdering(true);
                      setTimeout(async () => {
                        await clearCartOnSuccess();
                        setOrdering(false);
                        setCheckoutOpen(false);
                        Alert.alert("Дякуємо за покупку!", `Сума до сплати: ${fmtPrice(total)}\nСтатус: оформлено (демо).`);
                      }, 1000);
                    }
                  }}
                  style={[S.primaryBtn, { marginTop: 12 }]}
                >
                  <Text style={S.primaryBtnText}>
                    {payment === "Картка онлайн" ? "Перейти до оплати" : "Підтвердити замовлення"}
                  </Text>
                </Pressable>
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
                <Text style={S.sheetLabel}>Оплата карткою</Text>
                <TextInput
                  placeholder="Номер картки"
                  value={cardNumber}
                  onChangeText={(t) => {
                    const digits = t.replace(/\D+/g, "").slice(0, 16);
                    const groups = digits.match(/.{1,4}/g) ?? [];
                    setCardNumber(groups.join(" "));
                  }}
                  keyboardType="number-pad"
                  style={S.input}
                  placeholderTextColor={MUTED}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChangeText={(t) => {
                      const d = t.replace(/\D+/g, "").slice(0, 4);
                      const out = d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
                      setCardExpiry(out);
                    }}
                    keyboardType="number-pad"
                    style={[S.input, { flex: 1 }]}
                    placeholderTextColor={MUTED}
                  />
                  <TextInput
                    placeholder="CVV"
                    value={cardCvv}
                    onChangeText={(t) => setCardCvv(t.replace(/\D+/g, "").slice(0, 3))}
                    keyboardType="number-pad"
                    secureTextEntry
                    style={[S.input, { flex: 1 }]}
                    placeholderTextColor={MUTED}
                  />
                </View>
                <TextInput
                  placeholder="Ім'я на картці"
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="characters"
                  style={S.input}
                  placeholderTextColor={MUTED}
                />

                <Pressable
                  onPress={() => {
                    const okNum = cardNumber.replace(/\s+/g, "").length === 16;
                    const okExp = /^\d{2}\/\d{2}$/.test(cardExpiry);
                    const okCvv = /^\d{3}$/.test(cardCvv);
                    if (!okNum || !okExp || !okCvv || !cardName.trim()) {
                      Alert.alert("Перевірте дані картки", "Вкажіть коректні номер, строк, CVV та ім'я.");
                      return;
                    }
                    setOrdering(true);
                    setTimeout(async () => {
                      await clearCartOnSuccess();
                      setOrdering(false);
                      setCheckoutOpen(false);
                      resetCheckout();
                      Alert.alert("Дякуємо за покупку!", `Оплачено: ${fmtPrice(total)}\nСтатус: успішно (демо).`);
                    }, 1200);
                  }}
                  style={[S.primaryBtn, { marginTop: 12 }]}
                >
                  {ordering ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={S.primaryBtnText}>Оплатити {fmtPrice(total)}</Text>
                  )}
                </Pressable>

                <Pressable onPress={() => setStep(1)} style={[S.secondaryBtn, { marginTop: 10 }]}>
                  <Text style={S.secondaryBtnText}>Назад</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TabBar active="cart" />
    </View>
  );
}

function EmptyCartBlock({
  unauth,
  goCatalog,
  goSignIn,
}: {
  unauth: boolean;
  goCatalog: () => void;
  goSignIn: () => void;
}) {
  return (
    <View style={{ paddingTop: 28, paddingBottom: 16 }}>
      <View style={[S.center, { paddingHorizontal: 16 }]}>
        <CartEmpty width={220} height={160} />
        <Text style={S.emptyTitle}>Твій кошик порожній</Text>
        <Text style={S.emptySub}>Подивись наш каталог, обов'язково щось знайдеш!</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Pressable onPress={goCatalog} style={S.btnPrimary}>
            <Text style={S.btnPrimaryText}>За покупками</Text>
          </Pressable>
          {unauth ? (
            <Pressable onPress={goSignIn} style={S.btnSecondary}>
              <Text style={S.btnSecondaryText}>Увійти</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function CartRow({
  item,
  onDec,
  onInc,
  onRemove,
}: {
  item: CartItem;
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
}) {
  const [img, setImg] = React.useState<string>("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!item.productId) return;
      try {
        const media = await getProductMediaUrls(item.productId);
        const first = media[0]?.url || "";
        if (alive) setImg(first);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [item.productId]);

  const price = item.price ?? 0;
  const qty = item.pcs ?? 0;
  const subtotal = price * qty;

  return (
    <View style={S.card}>
      <View style={S.thumb}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View
            style={[
              S.thumb,
              { alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" },
            ]}
          >
            <ActivityIndicator />
          </View>
        )}
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text numberOfLines={2} style={S.name}>
          {item.productName ?? item.productId ?? "—"}
        </Text>
        <Text style={S.muted}>{fmtPrice(price)}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
          <View style={S.qtyWrap}>
            <Pressable onPress={onDec} style={S.qtyBtn}>
              <Text style={S.qtyTxt}>−</Text>
            </Pressable>
            <Text style={S.qtyValue}>{qty}</Text>
            <Pressable onPress={onInc} style={S.qtyBtn}>
              <Text style={S.qtyTxt}>+</Text>
            </Pressable>
          </View>
          <Text style={S.subtotal}>{fmtPrice(subtotal)}</Text>
        </View>
      </View>

      <Pressable onPress={onRemove} style={S.del}>
        <FontAwesome name="trash" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

function RecommendationsBox({
  items,
  loading,
  onPressItem,
}: {
  items: Product[];
  loading: boolean;
  onPressItem: (id: string) => void;
}) {
  return (
    <View style={S.recsBox}>
      <View style={S.recsHeader}>
        <Text style={S.recsTitle}>Для тебе</Text>
        <FontAwesome name="chevron-right" size={12} color={MUTED} />
      </View>

      {loading ? (
        <View style={{ flexDirection: "row", paddingHorizontal: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={S.recsSkeleton} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 10, gap: 10 }}
          renderItem={({ item }) => <RecCard p={item} onPress={() => onPressItem(item.id)} />}
        />
      )}
    </View>
  );
}

function RecCard({ p, onPress }: { p: Product; onPress: () => void }) {
  const [img, setImg] = React.useState<string>("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const media = await getProductMediaUrls(p.id);
        const first = media[0]?.url || "";
        if (alive) setImg(first);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [p.id]);

  const price = p.finalPrice ?? p.discountPrice ?? p.price;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.recsCard, pressed && { opacity: 0.96 }]}>
      <View style={S.recsThumb}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={[S.recsThumb, { backgroundColor: "#f3f4f6" }]} />
        )}
      </View>
      <Text numberOfLines={2} style={S.recsName}>
        {p.name}
      </Text>
      <Text style={S.recsPrice}>{fmtPrice(price)}</Text>
    </Pressable>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, padding: 16, paddingBottom: 8 },

  headerRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 },
  headerBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerBtnText: { color: TEXT, fontWeight: "700" },

  panel: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  panelFooter: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: PANEL_FOOTER_H,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: CARD,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  totalLabel: { color: MUTED, fontSize: 12 },
  totalValue: { color: TEXT, fontSize: 18, fontWeight: "800" },
  checkout: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkoutText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: CARD,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  name: { color: TEXT, fontSize: 15, fontWeight: "700" },
  muted: { color: MUTED, marginTop: 2 },

  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 8, android: 6, default: 8 }),
    backgroundColor: "#f9fafb",
  },
  qtyTxt: { color: TEXT, fontSize: 18, fontWeight: "800" },
  qtyValue: { marginHorizontal: 10, minWidth: 22, textAlign: "center", color: TEXT },
  subtotal: { color: TEXT, fontWeight: "800" },

  del: {
    marginLeft: "auto",
    backgroundColor: DANGER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  recsBox: {
    height: RECS_H,
    backgroundColor: "#fafafa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    marginBottom: 8,
  },
  recsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  recsTitle: { color: TEXT, fontWeight: "800" },
  recsSkeleton: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    marginRight: 10,
  },
  recsCard: {
    width: 120,
    paddingHorizontal: 2,
  },
  recsThumb: {
    width: "60%",
    height: "40%",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  recsName: { color: TEXT, marginTop: 6, fontSize: 12 },
  recsPrice: { color: TEXT, fontWeight: "800", marginTop: 2, fontSize: 13 },

  center: { alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: TEXT, fontSize: 22, fontWeight: "800", marginTop: 10, textAlign: "center" },
  emptySub: { color: MUTED, textAlign: "center", marginTop: 6 },
  btnPrimary: {
    backgroundColor: ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnSecondary: {
    borderColor: BORDER,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  btnSecondaryText: { color: TEXT, fontWeight: "700" },

  sheetDim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sheetTitle: { flex: 1, color: TEXT, fontSize: 18, fontWeight: "800" },
  xBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  sheetLabel: { color: MUTED, marginTop: 6, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    color: TEXT,
    marginBottom: 8,
  },
  segmentRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  segmentBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  segmentBtnActive: { borderColor: ACCENT, backgroundColor: "#eef2ff" },
  segmentTxt: { color: TEXT, fontWeight: "700", fontSize: 12 },
  segmentTxtActive: { color: ACCENT },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: TEXT, fontWeight: "800" },
});
