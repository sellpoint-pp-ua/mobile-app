import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

const COLORS = {
  bg: "#0B0C10",
  card: "#12161C",
  border: "#2A2F36",
  text: "#FFFFFF",
  muted: "#C5C6C7",
  accent: "#66FCF1",
  danger: "#ef4444",
};

async function read(res: Response) {
  try {
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) return await res.json();
    const txt = await res.text();
    return txt || null;
  } catch {
    return null;
  }
}

export default function DebugNetwork() {
  const [log, setLog] = useState<string>("Готово. Натисни «Запустити тести»");

  async function run() {
    setLog("Починаю тести…\n");

    const BASE = "https://api.sellpoint.pp.ua";
    try {
      setLog((s) => s + `STEP1 GET ${BASE}/swagger/index.html …\n`);
      const r1 = await fetch(`${BASE}/swagger/index.html`, { method: "GET" });
      const b1 = await read(r1);
      setLog((s) => s + `STEP1 → ${r1.status} ${r1.statusText}\n`);

      if (!r1.ok) {
        setLog((s) => s + `Тіло: ${typeof b1 === "string" ? b1.slice(0, 300) : JSON.stringify(b1).slice(0, 300)}\n`);
        setLog((s) => s + "❌ STEP1 провалився — проблема мережі/SSL/сертифіката на пристрої.\n");
        return;
      }

      setLog((s) => s + `STEP2 POST ${BASE}/api/Auth/login …\n`);
      const fd = new FormData();
      fd.append("Login", "test@example.com");
      fd.append("Password", "wrong-pass");
      fd.append("DeviceInfo", "mobile-expo");

      const r2 = await fetch(`${BASE}/api/Auth/login`, {
        method: "POST",
        headers: { Accept: "application/json, text/plain, */*" },
        body: fd,
      });
      const b2 = await read(r2);
      setLog((s) => s + `STEP2 → ${r2.status} ${r2.statusText}\n`);
      if (!r2.ok) {
        setLog((s) => s + `Тіло: ${typeof b2 === "string" ? b2.slice(0, 300) : JSON.stringify(b2).slice(0, 300)}\n`);
        setLog((s) => s + "ℹ️ Для невірних кредів очікуємо 401, головне — НЕ network error.\n");
      } else {
        setLog((s) => s + "✅ POST відпрацював без network error.\n");
      }
    } catch (e: any) {
      setLog((s) => s + `❌ NetworkError: ${e?.message || String(e)}\n`);
    }
  }

  useEffect(() => {
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: COLORS.accent, fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
          Діагностика мережі
        </Text>

        <TouchableOpacity
          onPress={run}
          activeOpacity={0.85}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.bg, fontWeight: "800" }}>Запустити тести</Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 12,
          }}
        >
          <Text style={{ color: COLORS.muted, fontFamily: "monospace", lineHeight: 18 }}>
            {log}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
