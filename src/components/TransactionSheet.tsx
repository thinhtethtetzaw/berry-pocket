import { useEffect, useState } from "react";
import {
  Modal,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
// full-screen sheet — height removed, flex: 1 used instead
import { X, Trash2 } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import { palette, radius, space, v7Accent } from "../theme";
import { MAIN_CATEGORIES, SUB_CATEGORIES } from "../lib/budget";
import type { MainCategoryId, Transaction } from "../lib/budget";
import { todayISO } from "../lib/format";
import { Icon } from "./Icon";
import { Txt } from "./Txt";
import { categoryAccent } from "./categoryAccent";
import { DatePickerField } from "./DatePickerField";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id">) => void;
  editing?: Transaction | null;
  onUpdate?: (id: number, tx: Omit<Transaction, "id">) => void;
  onDelete?: (id: number) => void;
  defaultMain?: MainCategoryId;
}

export function TransactionSheet({
  visible,
  onClose,
  onSave,
  editing,
  onUpdate,
  onDelete,
  defaultMain = "living",
}: Props) {
  const { theme } = useTheme();
  const [main, setMain] = useState<MainCategoryId>("living");
  const [cat, setCat] = useState("food");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const isEdit = !!editing;
  const isIncome = MAIN_CATEGORIES.find((m) => m.id === main)?.type === "in";
  const accentColor = isIncome ? palette.successText : v7Accent.danger;
  const accentBg = isIncome ? "#DEF1E6" : "#FCE5DC";

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setMain(editing.main);
      setCat(editing.cat);
      setDesc(editing.desc);
      setAmount(String(editing.amount));
      setDate(editing.date);
    } else {
      setDate(todayISO());
      setDesc("");
      setAmount("");
      setMain(defaultMain);
      const firstSub = SUB_CATEGORIES.find((c) => c.main === defaultMain);
      if (firstSub) setCat(firstSub.id);
    }
  }, [visible, editing]);

  useEffect(() => {
    if (editing && main === editing.main) return;
    const first = SUB_CATEGORIES.find((c) => c.main === main);
    if (first) setCat(first.id);
  }, [main, editing]);

  // Income sheet locks to income category only; expense sheet hides income
  const isIncomeMode = defaultMain === "income" && !editing;
  const visibleCategories = editing
    ? MAIN_CATEGORIES
    : isIncomeMode
      ? MAIN_CATEGORIES.filter((m) => m.type === "in")
      : MAIN_CATEGORIES.filter((m) => m.type === "out");

  const subs = SUB_CATEGORIES.filter((c) => c.main === main);

  function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const payload = { main, cat, desc: desc.trim(), amount: amt, date };
    if (isEdit && editing && onUpdate) onUpdate(editing.id, payload);
    else onSave(payload);
    onClose();
  }

  function handleDelete() {
    if (!editing || !onDelete) return;
    Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          onDelete(editing.id);
          onClose();
        },
      },
    ]);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[S.sheet, { borderColor: theme.border }]}
        >
          <View style={[S.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={S.header}>
            <Txt variant="headingSm" color={theme.ink}>
              {isEdit ? "Edit Transaction" : "New Transaction"}
            </Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {isEdit && onDelete && (
                <Pressable
                  onPress={handleDelete}
                  hitSlop={10}
                  style={[
                    S.iconBtn,
                    { backgroundColor: v7Accent.danger + "14" },
                  ]}
                >
                  <Trash2 size={14} color={v7Accent.danger} strokeWidth={2} />
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={[S.iconBtn, { backgroundColor: theme.bgSubtle }]}
              >
                <X size={14} color={theme.ink} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Amount — hero input */}
              <View style={[S.amountRow, { backgroundColor: accentBg }]}>
                <Txt variant="headingMd" color={accentColor}>
                  ฿
                </Txt>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={accentColor + "60"}
                  keyboardType="decimal-pad"
                  autoFocus={!isEdit}
                  selectTextOnFocus
                  style={[S.amountInput, { color: accentColor }]}
                />
              </View>

              {/* Main category — locked to single option in income mode */}
              {!isIncomeMode && <FieldLabel label="Category" />}
              {!isIncomeMode && (
                <View style={S.pillRow}>
                  {visibleCategories.map((m) => {
                    const accent = categoryAccent(m.id, "light");
                    const active = main === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setMain(m.id)}
                        style={[
                          S.pill,
                          {
                            backgroundColor: active ? accent : "#FFFFFF",
                            borderColor: active ? accent : theme.border,
                          },
                        ]}
                      >
                        <Icon
                          name={m.icon}
                          size={13}
                          color={active ? "#FFFFFF" : theme.steel}
                          strokeWidth={2}
                        />
                        <Txt
                          variant="bodySmMed"
                          color={active ? "#FFFFFF" : theme.ink}
                        >
                          {m.label}
                        </Txt>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Sub category */}
              {subs.length > 0 && (
                <>
                  <FieldLabel label="Sub-category" />
                  <View style={S.pillRow}>
                    {subs.map((s) => {
                      const active = cat === s.id;
                      const accent = categoryAccent(main, "light");
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => setCat(s.id)}
                          style={[
                            S.pill,
                            S.pillSm,
                            {
                              backgroundColor: active
                                ? accent + "15"
                                : "#FFFFFF",
                              borderColor: active ? accent : theme.border,
                            },
                          ]}
                        >
                          <Icon
                            name={s.icon}
                            size={12}
                            color={active ? accent : theme.steel}
                            strokeWidth={2}
                          />
                          <Txt
                            variant="caption"
                            color={active ? accent : theme.steel}
                          >
                            {s.label}
                          </Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Description */}
              <FieldLabel label="Description" />
              <TextInput
                value={desc}
                onChangeText={setDesc}
                placeholder={
                  isIncome ? "e.g. Monthly salary" : "e.g. Lunch at MBK"
                }
                placeholderTextColor={theme.muted}
                style={[
                  S.input,
                  { color: theme.ink, borderColor: theme.border },
                ]}
              />

              {/* Date */}
              <FieldLabel label="Date" />
              <DatePickerField value={date} onChange={setDate} />

              {/* Actions */}
              <View style={S.actions}>
                <Pressable
                  onPress={onClose}
                  style={[S.btn, S.btnCancel, { borderColor: theme.border }]}
                >
                  <Txt variant="buttonMd" color={theme.steel}>
                    Cancel
                  </Txt>
                </Pressable>
                <Pressable
                  onPress={submit}
                  style={[
                    S.btn,
                    S.btnPrimary,
                    { backgroundColor: accentColor },
                  ]}
                >
                  <Txt variant="buttonMd" color="#FFFFFF">
                    {isEdit ? "Save Changes" : "Add"}
                  </Txt>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FieldLabel({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <Txt variant="microBold" color={theme.steel} style={FL.label}>
      {label.toUpperCase()}
    </Txt>
  );
}
const FL = StyleSheet.create({
  label: { letterSpacing: 1.2, marginTop: space.lg, marginBottom: space.sm },
});

const S = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderTopWidth: 1,
    paddingTop: Platform.OS === "ios" ? 12 : 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: space.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
    paddingVertical: space.xl,
    borderRadius: radius.xl,
    marginBottom: space.sm,
  },
  amountInput: {
    fontSize: 48,
    fontFamily: "DMSans_700Bold",
    letterSpacing: -2,
    minWidth: 80,
    textAlign: "center",
    padding: 0,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillSm: { paddingHorizontal: 10, paddingVertical: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
  },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.xl },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: { borderWidth: 1 },
  btnPrimary: { flex: 2 },
});
