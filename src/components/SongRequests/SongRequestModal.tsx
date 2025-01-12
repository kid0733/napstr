import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { SongRequestService } from '@/services/songRequestService';

export const SongRequestModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    const spotifyPattern = /^https?:\/\/(?:open\.)?spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+/;
    const youtubePattern = /^https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    return spotifyPattern.test(url) || youtubePattern.test(url);
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid Spotify or YouTube URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await SongRequestService.createRequest(url.trim());
      setUrl('');
      setIsVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setIsVisible(true)} style={styles.iconButton}>
        <Ionicons name="add-circle-outline" size={24} color={colors.text} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Request Song</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="Paste Spotify or YouTube URL here"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.supportedServices}>
              <View style={styles.serviceItem}>
                <Ionicons name="musical-notes" size={16} color={colors.greenTertiary} />
                <Text style={styles.serviceText}>Spotify</Text>
              </View>
              <View style={styles.serviceItem}>
                <Ionicons name="logo-youtube" size={16} color={colors.greenTertiary} />
                <Text style={styles.serviceText}>YouTube</Text>
              </View>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !url.trim()}
            >
              <Text style={styles.submitText}>
                {loading ? 'Requesting...' : 'Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.title,
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    marginBottom: 8,
  },
  supportedServices: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceText: {
    color: colors.greenTertiary,
    fontSize: 12,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: colors.greenPrimary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.text,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
}); 