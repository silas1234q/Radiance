import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import type { DailyCompletionData } from "../../types/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface WeekDayTrackerProps {
  completedDays?: number[];
  weeklyCompletions?: DailyCompletionData[];
  currentDay?: number;
}

export default function WeekDayTracker({
  completedDays = [],
  weeklyCompletions,
  currentDay,
}: WeekDayTrackerProps) {
  const today = currentDay ?? new Date().getDay();
  const date = new Date();
  const currentDayOfMonth = date.getDate();
  const currentDayOfWeek = date.getDay();

  return (
    <View className="flex-row justify-between px-2 my-5">
      {DAYS.map((day, index) => {
        const isToday = index === today;

        // Use weeklyCompletions if available, otherwise fall back to completedDays
        let isFullDay = false;
        let isPartial = false;
        if (weeklyCompletions) {
          const dayData = weeklyCompletions.find((d) => d.dayIndex === index);
          if (dayData) {
            isFullDay = dayData.isFullDay;
            isPartial = !isFullDay && (dayData.amCompleted || dayData.pmCompleted || dayData.moodLogged);
          }
        } else {
          isFullDay = completedDays.includes(index);
        }

        const dayOfMonth = currentDayOfMonth - (currentDayOfWeek - index);

        return (
          <View key={day} className="items-center gap-1.5">
            <View
              className="px-3 py-5 rounded-full items-center justify-center"
              style={
                isToday
                  ? {
                      backgroundColor: "rgba(240, 102, 128, 0.12)",
                      borderWidth: 2,
                      borderColor: COLORS.primary,
                    }
                  : { backgroundColor: "rgba(255, 255, 255, 0.5)" }
              }
            >
              <Text
                className="text-[12px] mb-2"
                style={{
                  color: isToday ? COLORS.primary : COLORS.textTertiary,
                  fontWeight: '500',
                }}
              >
                {day}
              </Text>
              {isFullDay && !isToday ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={COLORS.success ?? '#34C759'}
                />
              ) : isPartial && !isToday ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: COLORS.warning ?? '#FF9500',
                    marginTop: 6,
                    marginBottom: 6,
                  }}
                />
              ) : (
                <Text
                  className="text-[15px]"
                  style={{
                    color: isToday ? COLORS.primary : COLORS.textSecondary,
                    fontWeight: '600',
                  }}
                >
                  {dayOfMonth}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
