/**
 * Root layout for the Open Agents mobile app.
 * Configures navigation with Expo Router tab-based layout.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
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
      </Tabs>
    </>
  );
}
