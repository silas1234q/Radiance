/**
 * Reusable morning/evening reminder pickers for a routine.
 *
 * A reminder is "on" when its time is a non-null "HH:mm" string. Toggling on
 * seeds a sensible default time; the user can then tap to adjust it. Used by
 * both the new-routine and edit-routine screens.
 */
import React, { useState } from 'react';
import { View, Text, Switch, Pressable, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { COLORS } from '../../constants/theme';
import { formatTime, timeToDate } from '../../lib/notifications';

export interface RoutineReminderValue {
  amReminderTime: string | null;
  pmReminderTime: string | null;
}

const DEFAULT_AM = '08:00';
const DEFAULT_PM = '21:00';

export default function RoutineReminderFields({
  value,
  onChange,
}: {
  value: RoutineReminderValue;
  onChange: (next: RoutineReminderValue) => void;
}) {
  const [activePicker, setActivePicker] = useState<'am' | 'pm' | null>(null);

  const setAm = (t: string | null) => onChange({ ...value, amReminderTime: t });
  const setPm = (t: string | null) => onChange({ ...value, pmReminderTime: t });

  const onPick = (which: 'am' | 'pm', e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (e.type === 'dismissed' || !d) return;
    which === 'am' ? setAm(formatTime(d)) : setPm(formatTime(d));
  };

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        overflow: 'hidden',
      }}
    >
      <ReminderRow
        icon="sunny-outline"
        label="Morning reminder"
        time={value.amReminderTime}
        onToggle={(on) => setAm(on ? DEFAULT_AM : null)}
        onPressTime={() => setActivePicker('am')}
        showBorder
      />
      <ReminderRow
        icon="moon-outline"
        label="Evening reminder"
        time={value.pmReminderTime}
        onToggle={(on) => setPm(on ? DEFAULT_PM : null)}
        onPressTime={() => setActivePicker('pm')}
      />

      {/* iOS: present the spinner in a sheet with a Done bar (it has no built-in
          dismiss); Android uses its native dialog. */}
      {activePicker && Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible
          onRequestClose={() => setActivePicker(null)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
            onPress={() => setActivePicker(null)}
          />
          <View style={{ backgroundColor: '#fff', paddingBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <Pressable onPress={() => setActivePicker(null)} hitSlop={8}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                  Done
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={timeToDate(
                (activePicker === 'am' ? value.amReminderTime : value.pmReminderTime) ??
                  (activePicker === 'am' ? DEFAULT_AM : DEFAULT_PM),
              )}
              mode="time"
              display="spinner"
              textColor={COLORS.text}
              themeVariant="light"
              style={{ height: 216, backgroundColor: '#fff' }}
              onChange={(e, d) => onPick(activePicker, e, d)}
            />
          </View>
        </Modal>
      )}

      {activePicker && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={timeToDate(
            (activePicker === 'am' ? value.amReminderTime : value.pmReminderTime) ??
              (activePicker === 'am' ? DEFAULT_AM : DEFAULT_PM),
          )}
          mode="time"
          display="default"
          onChange={(e, d) => onPick(activePicker, e, d)}
        />
      )}
    </View>
  );
}

function ReminderRow({
  icon,
  label,
  time,
  onToggle,
  onPressTime,
  showBorder,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  time: string | null;
  onToggle: (on: boolean) => void;
  onPressTime: () => void;
  showBorder?: boolean;
}) {
  const on = time !== null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: 'rgba(0,0,0,0.05)',
      }}
    >
      <Ionicons name={icon} size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontFamily: 'SFProRounded_Medium', color: COLORS.text }}
        >
          {label}
        </Text>
        {on && (
          <Pressable onPress={onPressTime} hitSlop={8}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'SFProRounded_Semibold',
                color: COLORS.primary,
                marginTop: 2,
              }}
            >
              {time} · tap to change
            </Text>
          </Pressable>
        )}
      </View>
      <Switch
        value={on}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}
