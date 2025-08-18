import { View, Text, TextInput, Button } from "react-native";
import { t } from "../../i18n/ua";

type Values = Record<string, any>;
type SetValues = (patch: Partial<Values>) => void;

function renderField(key: string, value: any, setValues: SetValues) {
  if (key === "id") return null;
  const isNumber = typeof value === "number";
  const keyboardType = isNumber ? "numeric" : "default";

  return (
    <View key={key} style={{ marginBottom: 10 }}>
      <Text style={{ marginBottom: 4 }}>{key}</Text>
      <TextInput
        value={value == null ? "" : String(value)}
        onChangeText={(v) =>
          setValues({ [key]: isNumber ? Number(v.replace(/[^\d.-]/g, "")) : v })
        }
        keyboardType={keyboardType as any}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />
    </View>
  );
}

export function CrudForm(props: {
  title: string;
  values: Values;
  setValues: SetValues;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  const { title, values, setValues, onSubmit, onCancel } = props;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>{title}</Text>

      {/* динамически рендерим все поля объекта */}
      {Object.keys(values).map((k) => renderField(k, (values as any)[k], setValues))}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title={t("save")} onPress={onSubmit} />
        {onCancel ? <Button title={t("cancel")} onPress={onCancel} /> : null}
      </View>
    </View>
  );
}
