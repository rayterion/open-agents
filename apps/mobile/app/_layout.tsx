/**
 * Root layout for the Open Agents mobile app.
 * Configures navigation with Expo Router tab-based layout.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

function AppTabs() {
  const { colors, isDark, toggleTheme } = useTheme();

  const ThemeToggle = () => (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{ marginRight: 16, padding: 4 }}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Feather name={isDark ? 'sun' : 'moon'} size={20} color={colors.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerRight: () => <ThemeToggle />,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Welcome',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: 'Projects',
            tabBarLabel: 'Projects',
            tabBarIcon: ({ color, size }) => <Feather name="folder" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="agents"
          options={{
            title: 'Agents',
            tabBarLabel: 'Agents',
            tabBarIcon: ({ color, size }) => <Feather name="cpu" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="blog"
          options={{
            title: 'Blog',
            tabBarLabel: 'Blog',
            tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="faq"
          options={{
            title: 'FAQ',
            tabBarLabel: 'FAQ',
            tabBarIcon: ({ color, size }) => <Feather name="help-circle" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="contact"
          options={{
            title: 'Contact',
            tabBarLabel: 'Contact',
            tabBarIcon: ({ color, size }) => <Feather name="mail" size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppTabs />
    </ThemeProvider>
  );
}
