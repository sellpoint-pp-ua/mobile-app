import { View, Text, Button, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { t } from "../../i18n/ua";

export function CrudList<T extends { id?: number | string; name?: string; price?: number }>(props: {
  title: string;
  data?: T[];
  isLoading?: boolean;
  onCreate?: () => void;
  onItemPress?: (item: T) => void;
}) {
  const { title, data, isLoading, onCreate, onItemPress } = props;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 8 }}>{title}</Text>
      {onCreate ? <Button title={t("create")} onPress={onCreate} /> : null}
      {isLoading ? <ActivityIndicator /> : null}
      {!isLoading && (!data || data.length === 0) ? <Text>{t("empty_list")}</Text> : null}
      <FlatList
        style={{ marginTop: 12 }}
        data={data ?? []}
        keyExtractor={(x, i) => String((x as any).id ?? i)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onItemPress?.(item)}
            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" }}
          >
            <Text>
              {((item as any).name ?? (item as any).title ?? "Без назви") +
                ((item as any).price ? ` — ${(item as any).price} ₴` : "")}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
