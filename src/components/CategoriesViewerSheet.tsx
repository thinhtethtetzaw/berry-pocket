import { useEffect, useMemo, useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { radius, v7Text, v7Surface, CATEGORY_PASTEL } from '../theme';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from '../lib/budget';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Categories viewer — uses @gorhom/bottom-sheet for a draggable, snap-pointed
 * drawer. Drag the handle up/down to resize, swipe down to dismiss.
 */
export function CategoriesViewerSheet({ visible, onClose }: Props) {
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['55%', '90%'], []);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.35}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      index={1}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={S.handleIndicator}
      backgroundStyle={S.sheetBg}
      onDismiss={onClose}
    >
      <View style={S.header}>
        <View style={{ flex: 1 }}>
          <Txt variant="headingSm" color={v7Text.primary}>Categories</Txt>
          <Txt variant="caption" color={v7Text.tertiary} style={{ marginTop: 2 }}>
            Built-in · custom categories coming soon
          </Txt>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={S.iconBtn}>
          <X size={14} color={v7Text.primary} strokeWidth={2} />
        </Pressable>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
      >
        {MAIN_CATEGORIES.map((m) => {
          const subs = SUB_CATEGORIES.filter(s => s.main === m.id);
          return (
            <View key={m.id} style={S.group}>
              <View style={S.groupHeader}>
                <View style={[S.iconChip, { backgroundColor: CATEGORY_PASTEL[m.id] }]}>
                  <Icon name={m.icon} size={14} color={v7Text.primary} strokeWidth={2} />
                </View>
                <Txt variant="bodySmMed" color={v7Text.primary} style={{ flex: 1 }}>
                  {m.label}
                </Txt>
                <Txt variant="caption" color={v7Text.tertiary}>
                  {subs.length} {subs.length === 1 ? 'item' : 'items'}
                </Txt>
              </View>
              {subs.length > 0 && (
                <View style={S.subList}>
                  {subs.map((s) => (
                    <View key={s.id} style={S.subRow}>
                      <Icon name={s.icon} size={13} color={v7Text.secondary} strokeWidth={2} />
                      <Txt variant="caption" color={v7Text.secondary}>{s.label}</Txt>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const S = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: '#D8DCE5',
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 30, height: 30,
    borderRadius: radius.full,
    backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  group: {
    backgroundColor: v7Surface.plainCard,
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconChip: {
    width: 30, height: 30,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  subList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: v7Surface.hairline,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
});
