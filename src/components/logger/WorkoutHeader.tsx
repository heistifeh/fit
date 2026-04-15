import { View, Text } from "@/components/general/Themed";
import { useEffect, useState } from "react";
import dummyWorkouts from "@/data/dummyWorkouts";
import { calculateDurationHourMinutes } from "@/utils/time";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import useStore from "@/store";

export default function WorkoutHeader() {
  const [timer, setTimer] = useState("0:00");

  const workout = useStore((state) => state.currentWorkout);

  useEffect(() => {
    const interval = setInterval(() => {
      const duration = calculateDurationHourMinutes(
        new Date(workout?.createdAt || ""),
        new Date(),
      );
      setTimer(duration);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [workout]);

  return (
    <View style={{ gap: 10, backgroundColor: "transparent", marginBottom: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 24 }}>Workout tracker</Text>
      <Text style={{ fontSize: 18 }}>
        <FontAwesome5 name="clock" size={18} color="gray" /> {timer}
      </Text>
    </View>
  );
}
