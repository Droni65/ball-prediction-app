// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          title: '1X2 Predictions',
          headerStyle: { backgroundColor: '#0F1115' },
          headerTintColor: '#fff',
        }}
      />
    </>
  );
}
