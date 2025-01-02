import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { colors } from '@/constants/tokens';
import DownloadManager from '@/services/DownloadManager';

interface StorageInfo {
    totalSpace: number;
    freeSpace: number;
    songsDirectory: string;
    downloadedFiles: Array<{
        name: string;
        size: number;
        exists: boolean;
    }>;
}

interface FileDetails {
    name: string;
    size: number;
    exists: boolean;
}

interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
    md5?: string;
}

export default function DebugScreen() {
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        loadStorageInfo();
    }, [refreshKey]);

    const loadStorageInfo = async () => {
        try {
            const [totalSpace, freeSpace] = await Promise.all([
                FileSystem.getTotalDiskCapacityAsync(),
                FileSystem.getFreeDiskStorageAsync()
            ]);

            const songsDir = `${FileSystem.documentDirectory}songs/`;
            const dirInfo = await FileSystem.getInfoAsync(songsDir);
            
            let downloadedFiles: FileDetails[] = [];
            if (dirInfo.exists) {
                const files = await FileSystem.readDirectoryAsync(songsDir);
                downloadedFiles = await Promise.all(
                    files.map(async (fileName): Promise<FileDetails> => {
                        const filePath = `${songsDir}${fileName}`;
                        const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true }) as FileInfo;
                        return {
                            name: fileName,
                            size: fileInfo.size || 0,
                            exists: fileInfo.exists
                        };
                    })
                );
            }

            setStorageInfo({
                totalSpace,
                freeSpace,
                songsDirectory: songsDir,
                downloadedFiles
            });
        } catch (error) {
            console.error('Error loading storage info:', error);
        }
    };

    const formatBytes = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    };

    if (!storageInfo) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Loading storage info...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => setRefreshKey(prev => prev + 1)}
            >
                <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Storage Information</Text>
                <Text style={styles.text}>Total Space: {formatBytes(storageInfo.totalSpace)}</Text>
                <Text style={styles.text}>Free Space: {formatBytes(storageInfo.freeSpace)}</Text>
                <Text style={styles.text}>Songs Directory: {storageInfo.songsDirectory}</Text>
            </View>

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    refreshButton: {
        backgroundColor: colors.greenPrimary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    refreshButtonText: {
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
}); 