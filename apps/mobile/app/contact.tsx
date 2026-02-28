/**
 * Contact Us Screen — Allows users to send messages to project maintainers.
 *
 * Provides a simple form collecting name, email, and message
 * with validation and submission feedback.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, spacing, fontSize, borderRadius } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isValid = name.trim().length > 0 && email.trim().length > 0 && message.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSending(true);

    // Simulate sending — in production, wire this to an API endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSending(false);
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');

    Alert.alert(
      'Message Sent',
      'Thank you for reaching out! We\'ll get back to you as soon as possible.',
      [{ text: 'OK', onPress: () => setSent(false) }],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="mail" size={32} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <Text style={styles.headerSubtitle}>
            Have a question, suggestion, or just want to say hello? Drop us a message and we'll get
            back to you.
          </Text>
        </View>

        {/* Contact Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!isValid || isSending) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isSending}
            activeOpacity={0.7}
          >
            <Feather name="send" size={18} color={colors.textInverse} />
            <Text style={styles.submitButtonText}>
              {isSending ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additional Contact Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Other Ways to Reach Us</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="github" size={18} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>GitHub Issues</Text>
                <Text style={styles.infoText}>
                  Report bugs or request features on our GitHub repository.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="message-circle" size={18} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Community Discussions</Text>
                <Text style={styles.infoText}>
                  Join the conversation in our GitHub Discussions forum.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    // Header
    header: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    headerIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + '14',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    headerTitle: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    headerSubtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 320,
    },

    // Form
    form: {
      gap: spacing.lg,
      marginBottom: spacing.xl,
    },
    field: {
      gap: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textPrimary,
      marginLeft: spacing.xs,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 120,
      paddingTop: spacing.md,
    },
    submitButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textInverse,
    },

    // Info Section
    infoSection: {
      gap: spacing.md,
    },
    infoTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    infoText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
}
