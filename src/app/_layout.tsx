import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import {
  ThemeProvider,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { Text } from 'react-native';
import Colors from '@/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db, expo } from '@/db';
import migrations from '../../drizzle/migrations/migrations';
import useStore from '@/store';

DarkTheme.colors.primary = Colors.dark.tint;
DefaultTheme.colors.primary = Colors.light.tint;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useMigrations(db, migrations);
  const loadWorkouts = useStore((state) => state.loadWorkouts);

  useDrizzleStudio(expo);

  useEffect(() => {
    if (success) loadWorkouts();
  }, [success]);

  if (error) return <Text>Migration error: {error.message}</Text>;
  if (!success) return <Text>Setting up database...</Text>;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="workout/current" options={{ title: 'Workout' }} />
          <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
