/**
 * Debug Screen Component
 * 
 * Provides system information and debugging tools for the application.
 * Monitors storage usage, downloaded files, and maintains debug logs.
 * 
 * Features:
 * - Storage space monitoring
 * - Downloaded files tracking
 * - Debug log management
 * - Real-time refresh capability
 * 
 * @module Debug
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { colors } from '@/constants/tokens';
import DownloadManager from '@/services/DownloadManager';

/**
 * Storage information interface
 * Tracks device and application storage metrics
 */
interface StorageInfo {
    totalSpace: number;      // Total device storage capacity
    freeSpace: number;       // Available device storage
    songsDirectory: string;  // Path to downloaded songs
    downloadedFiles: Array<{
        name: string;        // File name
        size: number;        // File size in bytes
        exists: boolean;     // File existence status
    }>;
}

/**
 * File details interface
 * Individual file information
 */
interface FileDetails {
    name: string;    // File name
    size: number;    // File size in bytes
    exists: boolean; // File existence status
}

/**
 * Extended file information interface
 * Detailed file system information
 */
interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
    md5?: string;
}

/**
 * DebugScreen Component
 * 
 * Main debugging interface providing system information and tools.
 * Handles storage monitoring, file tracking, and debug logging.
 * 
 * @returns {JSX.Element} The debug interface
 */
export default function DebugScreen() {
    // State Management
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [logs, setLogs] = useState<string>('');

    /**
     * Initialize component data
     * Loads storage information and logs on mount and refresh
     */
    useEffect(() => {
        loadStorageInfo();
        loadLogs();
    }, [refreshKey]);

    /**
     * Loads and updates storage information
     * Includes file system checks and download validation
     */
    const loadStorageInfo = async () => {
        try {
            const downloadManager = DownloadManager.getInstance();
            await downloadManager.appendToLog('Refreshing storage info...');

            // Get device storage metrics
            const [totalSpace, freeSpace] = await Promise.all([
                FileSystem.getTotalDiskCapacityAsync(),
                FileSystem.getFreeDiskStorageAsync()
            ]);

            // Check songs directory
            const songsDir = `${FileSystem.documentDirectory}songs/`;
            const dirInfo = await FileSystem.getInfoAsync(songsDir);
            
            let downloadedFiles: FileDetails[] = [];
            if (dirInfo.exists) {
                const files = await FileSystem.readDirectoryAsync(songsDir);
                downloadedFiles = await Promise.all(
                    files.map(async (fileName): Promise<FileDetails> => {
                        const filePath = `${songsDir}${fileName}`;
                        const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true }) as FileInfo;
                        const songId = fileName.replace('.mp3', '');
                        const isDownloaded = await downloadManager.isDownloaded(songId);
                        return {
                            name: fileName,
                            size: fileInfo.size || 0,
                            exists: fileInfo.exists && isDownloaded // Validate both file existence and tracking
                        };
                    })
                );
                const validFiles = downloadedFiles.filter(file => file.exists);
                await downloadManager.appendToLog(`Found ${validFiles.length} valid downloaded files`);
            } else {
                await downloadManager.appendToLog('Songs directory does not exist');
            }

            // Update state with collected information
            setStorageInfo({
                totalSpace,
                freeSpace,
                songsDirectory: songsDir,
                downloadedFiles
            });

            await downloadManager.appendToLog('Storage info refresh complete');
        } catch (error) {
            console.error('Error loading storage info:', error);
            const downloadManager = DownloadManager.getInstance();
            await downloadManager.appendToLog(`Error refreshing storage info: ${error}`);
        }
    };

    /**
     * Loads debug logs from download manager
     */
    const loadLogs = async () => {
        const downloadManager = DownloadManager.getInstance();
        const logs = await downloadManager.getDownloadLog();
        setLogs(logs);
    };

    /**
     * Formats byte values into human-readable sizes
     * @param bytes - Number of bytes to format
     * @returns Formatted string with appropriate unit
     */
    const formatBytes = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    };

    // Loading state
    if (!storageInfo) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Loading storage info...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={() => setRefreshKey(prev => prev + 1)}
                    >
                        <Text style={styles.buttonText}>Refresh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.refreshButton, styles.clearButton]}
                        onPress={async () => {
                            const downloadManager = DownloadManager.getInstance();
                            await downloadManager.clearDownloadLog();
                            setLogs('');
                        }}
                    >
                        <Text style={styles.buttonText}>Clear Logs</Text>
                    </TouchableOpacity>
                </View>

                {/* Storage Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Storage Information</Text>
                    <Text style={styles.text}>Total Space: {formatBytes(storageInfo.totalSpace)}</Text>
                    <Text style={styles.text}>Free Space: {formatBytes(storageInfo.freeSpace)}</Text>
                    <Text style={styles.text}>Songs Directory: {storageInfo.songsDirectory}</Text>
                </View>

                {/* Downloaded Files Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Downloaded Files ({storageInfo.downloadedFiles.length})</Text>
                    {storageInfo.downloadedFiles.map((file, index) => (
                        <View key={index} style={styles.fileItem}>
                            <Text style={styles.fileName}>{file.name}</Text>
                            <Text style={styles.fileDetails}>
                                Size: {formatBytes(file.size)}
                                {'\n'}
                                Status: {file.exists ? 'Exists' : 'Missing'}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Debug Logs Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Download Logs</Text>
                    <ScrollView style={styles.logsContainer}>
                        <Text style={styles.logs}>{logs}</Text>
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
}

/**
 * Debug Screen Styles
 * 
 * Defines the visual styling for the debug interface.
 * Uses the application's color tokens for consistency.
 */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: 80, // Space for player bar
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    refreshButton: {
        backgroundColor: colors.greenPrimary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    clearButton: {
        backgroundColor: colors.redPrimary,
        marginRight: 0,
    },
    buttonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.greenTertiary,
    },
    sectionTitle: {
        color: colors.greenPrimary,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    text: {
        color: colors.text,
        fontSize: 14,
        marginBottom: 8,
    },
    fileItem: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.greenTertiary,
    },
    fileName: {
        color: colors.greenPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    fileDetails: {
        color: colors.text,
        fontSize: 12,
    },
    logsContainer: {
        maxHeight: 200,
        marginTop: 8,
    },
    logs: {
        color: colors.text,
        fontSize: 12,
        fontFamily: 'monospace',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
}); 