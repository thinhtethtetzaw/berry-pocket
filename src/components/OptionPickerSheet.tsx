import { Fragment } from "react";
import { Modal, View, Pressable, StyleSheet, ScrollView } from "react-native";
import { Check, X } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, v7Text, v7Surface } from "../theme";
import { Txt } from "./Txt";

export interface PickerOption<T extends string = string> {
  id: T;
  label: string;
  sub?: string;
  disabled?: boolean;
}

interface Props<T extends string = string> {
  visible: boolean;
  title: string;
  hint?: string;
  options: PickerOption<T>[];
  selected: T;
  onClose: () => void;
  onSelect: (id: T) => void;
}

/**
 * Generic single-select picker — used for currency, theme, language, etc.
 * Slides up from the bottom; tapping an option calls onSelect + closes.
 */
export function OptionPickerSheet<T extends string = string>({
  visible,
  title,
  hint,
  options,
  selected,
  onClose,
  onSelect,
}: Props<T>) {
  const { theme } = useTheme();

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
          <View style={S.handle} />

          <View style={S.header}>
            <Txt variant="headingSm" color={v7Text.primary}>
              {title}
            </Txt>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[S.iconBtn, { backgroundColor: "#F5F6FA" }]}
            >
              <X size={14} color={v7Text.primary} strokeWidth={2} />
            </Pressable>
          </View>

          {hint ? (
            <Txt
              variant="caption"
              color={v7Text.tertiary}
              style={{ marginBottom: space.md }}
            >
              {hint}
            </Txt>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={S.list}>
              {options.map((opt, i) => {
                const isLast = i === options.length - 1;
                const isActive = opt.id === selected;
                return (
                  <Fragment key={opt.id}>
                    <Pressable
                      disabled={opt.disabled}
                      onPress={() => {
                        if (opt.disabled) return;
                        onSelect(opt.id);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        S.row,
                        { opacity: opt.disabled ? 0.35 : pressed ? 0.6 : 1 },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Txt variant="bodySmMed" color={v7Text.primary}>
                          {opt.label}
                        </Txt>
                        {opt.sub ? (
                          <Txt
                            variant="micro"
                            color={v7Text.tertiary}
                            style={{ marginTop: 2 }}
                          >
                            {opt.sub}
                          </Txt>
                        ) : null}
                      </View>
                      {isActive && (
                        <Check
                          size={18}
                          color={v7Text.primary}
                          strokeWidth={2.4}
                        />
                      )}
                    </Pressable>
                    {!isLast && <View style={S.divider} />}
                  </Fragment>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    paddingTop: 6,
    maxHeight: "70%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#D8DCE5",
    marginVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.sm,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    backgroundColor: v7Surface.plainCard,
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: v7Surface.hairline,
    marginHorizontal: 8,
  },
});
