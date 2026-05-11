import { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { radius, space, v7Surface } from '../theme';

/**
 * Draggable bottom sheet with snap points.
 *
 * - Drag the handle (top grip) up or down to resize.
 * - On release the sheet springs to the nearest snap point.
 * - Dragging well below the lowest snap point dismisses the sheet.
 * - Scroll gestures on content below the handle pass through to children
 *   (so a ScrollView inside still scrolls naturally).
 *
 * No extra libraries — built on RN's PanResponder + Animated.
 */

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Snap heights as fractions of screen height (0..1). Sorted ascending. */
  snapPoints?: number[];
  /** Index of the snap point to open at. */
  initialSnap?: number;
  /** Optional title bar — title + close button shown above content. */
  title?: string;
  /** Right-side element in the title bar (e.g. counter). */
  titleRight?: ReactNode;
  /** Sheet body. Wrap your own ScrollView inside if you need scrolling. */
  children: ReactNode;
}

const SCREEN_H = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 0.08; // drag this fraction below lowest snap to close
const VELOCITY_DISMISS = 1.2;   // px/ms downward velocity that always dismisses

export function DraggableSheet({
  visible,
  onClose,
  snapPoints = [0.5, 0.85, 0.95],
  initialSnap = 1,
  title,
  titleRight,
  children,
}: Props) {
  // Sort snap points ascending and convert to absolute pixel heights.
  const snapsPx = useMemo(
    () => [...snapPoints].sort((a, b) => a - b).map(f => Math.round(SCREEN_H * f)),
    [snapPoints],
  );
  const initialIdx = Math.min(initialSnap, snapsPx.length - 1);

  // We animate the sheet HEIGHT (not translateY) so the inner ScrollView
  // always sees the right available size.
  const height = useRef(new Animated.Value(0)).current;
  const heightAtGestureStart = useRef(0);
  const currentHeight = useRef(0);

  // Track value so we can read it inside the PanResponder callbacks.
  useEffect(() => {
    const id = height.addListener(({ value }) => { currentHeight.current = value; });
    return () => height.removeListener(id);
  }, [height]);

  // Spring open / close when visibility changes.
  useEffect(() => {
    if (visible) {
      Animated.spring(height, {
        toValue: snapsPx[initialIdx],
        useNativeDriver: false,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      // Just reset; the Modal will hide it anyway.
      height.setValue(0);
    }
  }, [visible, initialIdx, snapsPx, height]);

  function snapTo(targetPx: number) {
    Animated.spring(height, {
      toValue: targetPx,
      useNativeDriver: false,
      tension: 90,
      friction: 14,
    }).start();
  }

  function nearestSnap(current: number, dyVelocity: number): number {
    // Velocity bias — if user flicks up/down, prefer that direction.
    let target = current;
    if (dyVelocity > 0.5) target = current - 80; // dragging down → smaller
    else if (dyVelocity < -0.5) target = current + 80; // dragging up → bigger
    return snapsPx.reduce((best, s) =>
      Math.abs(s - target) < Math.abs(best - target) ? s : best,
    snapsPx[0]);
  }

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        heightAtGestureStart.current = currentHeight.current;
      },
      onPanResponderMove: (_e, g) => {
        // dragging up = positive height growth (since sheet grows from bottom)
        const next = heightAtGestureStart.current - g.dy;
        const min = snapsPx[0] * 0.7; // allow dragging a bit below smallest
        const max = SCREEN_H;
        height.setValue(Math.max(min, Math.min(max, next)));
      },
      onPanResponderRelease: (_e, g) => {
        const final = currentHeight.current;
        // velocity (px/ms): g.vy is px per second-ish, normalize by ÷1000
        const v = g.vy;
        // Dismiss if dragged well below smallest snap, or very fast downward flick.
        const dismissBelow = snapsPx[0] * (1 - DISMISS_THRESHOLD);
        if (final < dismissBelow || v > VELOCITY_DISMISS) {
          onClose();
          return;
        }
        snapTo(nearestSnap(final, v));
      },
    }),
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { height }]}>
          {/* Drag area — the entire top strip listens for the pan gesture */}
          <View style={styles.dragArea} {...pan.panHandlers}>
            <View style={styles.handle} />
            {title ? (
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <TitleText>{title}</TitleText>
                </View>
                {titleRight}
              </View>
            ) : null}
          </View>

          {/* Content — scrollables here behave normally because the
              PanResponder is only attached to dragArea above. */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Small wrapper so consumers don't need to import Txt inline.
function TitleText({ children }: { children: ReactNode }) {
  return (
    <Animated.Text style={styles.title}>{children}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    overflow: 'hidden',
  },
  dragArea: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: space.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: '#D8DCE5',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: space.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
    color: '#0E1220',
    letterSpacing: -0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
});
