import { ReactNode, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { radius, v7Text } from '../theme';
import { Txt } from './Txt';

/**
 * Reusable wrapper around @gorhom/bottom-sheet's BottomSheetModal.
 *
 * Solves the pitfalls we hit before:
 * - Calls `present()` / `dismiss()` based on `visible` prop with proper timing.
 * - Memoizes snap points so reanimated doesn't re-create them every render.
 * - Skips `KeyboardAvoidingView` (which conflicts with the modal's own
 *   keyboard handling). Use `BottomSheetTextInput` inside.
 * - Uses sibling-modal pattern: do NOT render another BottomSheetModal
 *   inside `children`. Lift it to the same parent.
 */
export interface BottomDrawerRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Title shown in the header. Pass null/undefined for no header. */
  title?: string;
  /** Optional subtitle below title. */
  subtitle?: string;
  /** Right-side element in the header (defaults to a close X). */
  headerRight?: ReactNode;
  /** Snap heights as percent strings (e.g. ['60%','92%']) or pixel numbers. */
  snapPoints?: (string | number)[];
  /** Index to open at. Defaults to the last snap (largest). */
  initialIndex?: number;
  /** Whether content is scrollable (uses BottomSheetScrollView). */
  scrollable?: boolean;
  /** Children rendered inside the sheet body. */
  children: ReactNode;
}

export const BottomDrawer = forwardRef<BottomDrawerRef, Props>(function BottomDrawer(
  {
    visible, onClose, title, subtitle, headerRight,
    snapPoints, initialIndex, scrollable = true, children,
  },
  externalRef,
) {
  const ref = useRef<BottomSheetModal>(null);
  const points = useMemo(() => snapPoints ?? ['90%'], [snapPoints]);
  const defaultIndex = initialIndex ?? Math.max(0, points.length - 1);

  useImperativeHandle(externalRef, () => ({
    present: () => ref.current?.present(),
    dismiss: () => ref.current?.dismiss(),
  }));

  // Sync visibility — use a small timeout to let the modal mount on
  // first render before calling present(); otherwise the ref may not
  // be attached yet on Android.
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => ref.current?.present(), 0);
      return () => clearTimeout(t);
    }
    ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.35}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={points}
      index={defaultIndex}
      enablePanDownToClose
      enableHandlePanningGesture
      enableContentPanningGesture
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleStyle={styles.handleArea}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBg}
      onDismiss={onClose}
    >
      {(title || headerRight !== undefined) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title ? <Txt variant="headingSm" color={v7Text.primary}>{title}</Txt> : null}
            {subtitle ? (
              <Txt variant="caption" color={v7Text.tertiary} style={{ marginTop: 2 }}>
                {subtitle}
              </Txt>
            ) : null}
          </View>
          {headerRight === undefined ? (
            <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
              <X size={14} color={v7Text.primary} strokeWidth={2} />
            </Pressable>
          ) : (
            headerRight
          )}
        </View>
      )}

      {scrollable ? (
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleArea: { paddingTop: 12, paddingBottom: 8 },
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
});
