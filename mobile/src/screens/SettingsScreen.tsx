import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ONBOARDING_COMPLETED_KEY } from './OnboardingScreen';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();

  const replayOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch (e) {
      // Non-fatal: still navigate so the demo can proceed.
    }
    navigation.navigate('Onboarding');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>General</Text>

      <TouchableOpacity style={styles.row} onPress={replayOnboarding}>
        <Text style={styles.rowLabel}>Replay onboarding</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rowLabel: { fontSize: 16, color: '#1a1a1a' },
  rowChevron: { fontSize: 20, color: '#bbbbbb' },
});
