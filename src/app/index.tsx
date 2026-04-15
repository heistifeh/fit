import { Link } from "expo-router";
import { View, Text } from "@/components/general/Themed";
import CustomButton from "@/components/general/CustomButton";
import WorkoutListItem from "@/components/workouts/WorkoutListItem";
import workouts from "@/data/dummyWorkouts";
import { FlatList } from "react-native";
import useStore from "@/store";
import { State } from "react-native-gesture-handler";

export default function HomeScreen() {
  const currentWorkout = useStore((state) => state.currentWorkout);
  const startWorkout = useStore((state) => state.startWorkout);
const workouts = useStore((state) => state.workouts);
  const onStartWorkout = () => {
    startWorkout();
  };
  return (
    <View
      style={{
        flex: 1,
        gap: 10,
        padding: 10,
        backgroundColor: "transparent",
      }}
    >
      {currentWorkout ? (
        <Link href="/workout/current" asChild>
          <CustomButton title="Resume workout" />
        </Link>
      ) : (
        <CustomButton title="Start new workout" onPress={onStartWorkout} />
      )}
      <FlatList
        data={workouts}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => <WorkoutListItem workout={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
