import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation, loadLanguage, type Language } from '../i18n';

const LANGUAGES: { code: Language; labelKey: 'english' | 'hausa' }[] = [
  { code: 'en', labelKey: 'english' },
  { code: 'ha', labelKey: 'hausa' },
];

export default function SettingsScreen() {
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    loadLanguage();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings')}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <View style={styles.languageRow}>
          {LANGUAGES.map(({ code, labelKey }) => {
            const selected = language === code;
            return (
              <TouchableOpacity
                key={code}
                style={[styles.languageButton, selected && styles.languageButtonSelected]}
                onPress={() => setLanguage(code)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[styles.languageLabel, selected && styles.languageLabelSelected]}
                >
                  {t(labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  languageButtonSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  languageLabel: {
    fontSize: 15,
    color: '#374151',
  },
  languageLabelSelected: {
    color: '#16a34a',
    fontWeight: '600',
  },
});
