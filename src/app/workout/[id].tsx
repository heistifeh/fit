import { useLocalSearchParams } from 'expo-router';
import { View, Text } from '@/components/general/Themed';
import dummyWorkouts from '@/data/dummyWorkouts';
import WorkoutExerciseItem from '@/components/workouts/WorkoutExerciseItem';
import { FlatList, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import useStore from '@/store';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams();

  const workout = useStore((state) => state.workouts.find((w) => w.id === id));

  if (!workout) {
    return <Text>Workout not found</Text>;
  }

  return (
    <FlatList
      data={workout.exercises}
      contentContainerStyle={{ gap: 8, padding: 8 }}
      renderItem={({ item }) => <WorkoutExerciseItem exercise={item} />}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Workout details</Text>
          <Text style={styles.date}>
            {dayjs(workout.createdAt).format('HH:mm dddd, D MMM')}
          </Text>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontSize: 18,
    marginBottom: 20,
  },
});
