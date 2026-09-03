import { useState, useMemo } from 'react';
import {
  Modal, View, Pressable, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { X, Plus, ChevronDown, ChevronUp, Pencil } from 'lucide-react-native';
import { radius, space, v7Text, v7Surface, CATEGORY_PASTEL } from '../theme';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from '../lib/budget';
import type { MainCategoryId, SubCategory, MainCategory } from '../lib/budget';
import { useCustomMains, useCustomSubs, CustomMain } from '../lib/storage';

const SHEET_H = Dimensions.get('window').height - 60;
const BUILTIN_IDS = new Set(MAIN_CATEGORIES.map(m => m.id));

interface Props {
  visible: boolean;
  onClose: () => void;
  onEditMain: (cat: CustomMain | null) => void;
  onEditSub: (sub: SubCategory | null, parentMain: string, parentColor?: string) => void;
}

export function CategoriesViewerSheet({ visible, onClose, onEditMain, onEditSub }: Props) {
  const { customMains } = useCustomMains();
  const { customSubs } = useCustomSubs();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const allMains: (MainCategory | CustomMain)[] = useMemo(
    () => [...MAIN_CATEGORIES, ...customMains],
    [customMains],
  );

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function subsFor(mainId: string): SubCategory[] {
    return [
      ...SUB_CATEGORIES.filter(s => s.main === mainId),
      ...customSubs.filter(s => s.main === mainId),
    ];
  }

  const isCustomSub = (id: string) => customSubs.some(s => s.id === id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={S.sheet}>
          <Pressable onPress={onClose} style={S.handleArea} hitSlop={8}>
            <View style={S.handleIndicator} />
          </Pressable>

          <View style={S.header}>
            <View style={{ flex: 1 }}>
              <Txt variant="headingSm" color={v7Text.primary}>Categories</Txt>
              <Txt variant="caption" color={v7Text.tertiary} style={{ marginTop: 2 }}>
                {allMains.length} categories · tap to expand
              </Txt>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={S.iconBtn}>
              <X size={14} color={v7Text.primary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>
            <Pressable
              onPress={() => onEditMain(null)}
              style={({ pressed }) => [S.addBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Plus size={14} color={v7Text.primary} strokeWidth={2.2} />
              <Txt variant="bodySmMed" color={v7Text.primary}>Add new category</Txt>
            </Pressable>

            {allMains.map((m) => {
              const isBuiltin = BUILTIN_IDS.has(m.id as MainCategoryId);
              const custom = !isBuiltin ? (m as CustomMain) : null;
              const color = custom?.color ?? v7Text.primary;
              const pastel = custom?.pastel ?? CATEGORY_PASTEL[m.id as MainCategoryId] ?? '#F5F6FA';
              const isOpen = expanded.has(m.id);
              const subs = subsFor(m.id);

              return (
                <View key={m.id} style={S.group}>
                  <Pressable onPress={() => toggle(m.id)} style={S.groupHeader}>
                    <View style={[S.iconChip, { backgroundColor: pastel }]}>
                      <Icon name={m.icon} size={15} color={color} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Txt variant="bodySmMed" color={v7Text.primary}>{m.label}</Txt>
                        {isBuiltin && (
                          <View style={S.badge}>
                            <Txt variant="micro" color={v7Text.tertiary}>built-in</Txt>
                          </View>
                        )}
                      </View>
                      <Txt variant="micro" color={v7Text.tertiary} style={{ marginTop: 2 }}>
                        {m.type === 'in' ? 'Income' : m.type === 'saving' ? 'Savings' : 'Expense'} · {subs.length} {subs.length === 1 ? 'sub' : 'subs'}
                      </Txt>
                    </View>

                    {!isBuiltin && custom && (
                      <Pressable onPress={() => onEditMain(custom)} hitSlop={8} style={S.editChip}>
                        <Pencil size={12} color={v7Text.secondary} strokeWidth={2} />
                      </Pressable>
                    )}
                    {isOpen
                      ? <ChevronUp size={16} color={v7Text.tertiary} strokeWidth={2} />
                      : <ChevronDown size={16} color={v7Text.tertiary} strokeWidth={2} />}
                  </Pressable>

                  {isOpen && (
                    <View style={S.subList}>
                      {subs.map((s) => {
                        const editable = isCustomSub(s.id);
                        return (
                          <View key={s.id} style={S.subRow}>
                            <Icon name={s.icon} size={13} color={color} strokeWidth={2} />
                            <Txt variant="caption" color={v7Text.primary} style={{ flex: 1 }}>{s.label}</Txt>
                            {editable && (
                              <Pressable onPress={() => onEditSub(s, m.id, color)} hitSlop={6}>
                                <Pencil size={11} color={v7Text.tertiary} strokeWidth={2} />
                              </Pressable>
                            )}
                          </View>
                        );
                      })}
                      <Pressable
                        onPress={() => onEditSub(null, m.id, color)}
                        style={({ pressed }) => [S.addSubBtn, { opacity: pressed ? 0.6 : 1 }]}
                      >
                        <Plus size={12} color={v7Text.secondary} strokeWidth={2} />
                        <Txt variant="caption" color={v7Text.secondary}>Add sub-category</Txt>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    height: SHEET_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: space.md,
  },
  handleArea: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  handleIndicator: { backgroundColor: '#9AA1AE', width: 48, height: 5, borderRadius: 3 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: radius.full,
    backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: v7Surface.hairline,
    marginBottom: 12,
  },
  group: {
    backgroundColor: v7Surface.plainCard,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  iconChip: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: '#E9ECF3' },
  editChip: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  subList: {
    paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: v7Surface.hairline,
    gap: 8,
  },
  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#FFFFFF',
  },
  addSubBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderStyle: 'dashed', borderColor: v7Surface.hairline,
    marginTop: 2,
  },
});
