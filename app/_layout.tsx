import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Gaegu: require('../src/assets/fonts/Gaegu-Regular.ttf'),
    'Gaegu-Bold': require('../src/assets/fonts/Gaegu-Bold.ttf'),
  });

  // 폰트 로딩 중이면 로딩 표시 (에러 시에도 앱 진행)
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDF9' }}>
        <ActivityIndicator size="large" color="#FFDE59" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFDF9' },
        }}
      />
    </>
  );
}
