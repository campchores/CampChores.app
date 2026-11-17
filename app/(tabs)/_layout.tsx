import { ClipboardList, House, Settings, UserRound } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useApp } from '@/src/context/AppContext';
import { useTheme } from '@/src/context/ThemeContext';

export default function TabsLayout() {
  const { status } = useApp();
  const palette = useTheme();

  if (status === 'loading') return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [styles.tabBar, { backgroundColor: palette.tabBarBg, borderTopColor: palette.line }],
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="contracts" options={{ title: 'Contratações', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Configurações', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={2.2} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { height: 74, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1 },
  tabLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
});
