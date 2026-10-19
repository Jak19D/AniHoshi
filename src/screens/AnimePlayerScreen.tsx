import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import { mediaRepository } from '../services/mediaRepository';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'AnimePlayer'>;
const { width } = Dimensions.get('window');

export default function AnimePlayerScreen({ route, navigation }: Props) {
    const { animeTitle, episode, episodeList = [] } = route.params;
    const insets = useSafeAreaInsets();
    const player = useVideoPlayer(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        const reference = episode.asset ?? episode.videoUrl;
        if (!reference) {
            setVideoUrl(null);
            setLoading(false);
            return () => { active = false; };
        }
        mediaRepository.resolve(reference).then((url) => {
            if (!active) return;
            setVideoUrl(url);
            if (url) player.replace(url);
            setLoading(false);
        }).catch(() => {
            if (!active) return;
            setPlayerError('Não foi possível carregar este episódio.');
            setLoading(false);
        });
        return () => { active = false; player.pause(); };
    }, [episode.asset, episode.videoUrl, player]);

    useEffect(() => {
        if (!videoUrl) return;
        const subscription = player.addListener('statusChange', ({ status, error }) => {
            if (status === 'error') setPlayerError(error?.message ?? 'Falha ao reproduzir este vídeo.');
        });
        return () => subscription.remove();
    }, [player, videoUrl]);

    const nextEpisode = episodeList[episodeList.findIndex((item) => item.id === episode.id) + 1];

    const playNext = () => {
        if (!nextEpisode) {
            Alert.alert('Fim da lista', 'Não há outro episódio cadastrado.');
            return;
        }
        navigation.replace('AnimePlayer', { animeTitle, episode: nextEpisode, episodeList });
    };

    return (
        <View style={styles.screen}>
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar aos detalhes do anime" style={styles.iconButton} onPress={() => { if (navigation.canGoBack()) navigation.pop(); else navigation.navigate('Main'); }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.main} />
                </TouchableOpacity>
                <Text numberOfLines={1} style={styles.topTitle}>{animeTitle}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mais opções" style={styles.iconButton} onPress={() => setShowOptions(true)}>
                    <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text.main} />
                </TouchableOpacity>
            </View>

            <View style={styles.videoContainer}>
                {videoUrl ? (
                    <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
                ) : (
                    <View style={styles.emptyVideo}>
                        {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : <Ionicons name="play-circle-outline" size={64} color={COLORS.primary} />}
                        <Text style={styles.emptyVideoTitle}>{loading ? 'Carregando episódio…' : 'Episódio ainda não cadastrado'}</Text>
                        <Text style={styles.emptyVideoText}>{playerError ?? 'A tela está pronta. O endereço do vídeo será vinculado ao catálogo de mídia quando houver um arquivo configurado.'}</Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.details}>
                <Text style={styles.seriesName}>{animeTitle}</Text>
                <Text style={styles.episodeTitle}>{episode.title}</Text>
                <Text style={styles.metadata}>{episode.duration ?? 'Duração indisponível'}  ·  AniHoshi</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => { if (videoUrl) player.seekBy(-10); }}>
                        <Ionicons name="play-back" size={21} color={COLORS.primary} /><Text style={styles.actionText}>−10 s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => { if (videoUrl) player.seekBy(10); }}>
                        <Ionicons name="play-forward" size={21} color={COLORS.primary} /><Text style={styles.actionText}>+10 s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={playNext}>
                        <Ionicons name="play-skip-forward" size={21} color={COLORS.primary} /><Text style={styles.actionText}>Próximo</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>Episódios</Text>
                {episodeList.map((item, index) => (
                    <TouchableOpacity key={item.id} style={[styles.episodeRow, item.id === episode.id && styles.episodeSelected]} onPress={() => navigation.replace('AnimePlayer', { animeTitle, episode: item, episodeList })}>
                        <Text style={styles.episodeIndex}>{String(index + 1).padStart(2, '0')}</Text>
                        <View style={styles.episodeCopy}><Text style={styles.episodeRowTitle}>{item.title}</Text><Text style={styles.episodeRowMeta}>{item.duration ?? 'Duração indisponível'}</Text></View>
                        {item.id === episode.id && <Ionicons name="volume-high" size={19} color={COLORS.primary} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal transparent visible={showOptions} animationType="fade" onRequestClose={() => setShowOptions(false)}>
                <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setShowOptions(false)}>
                    <View style={styles.optionsSheet}>
                        <Text style={styles.sectionTitle}>Opções do episódio</Text>
                        <Text style={styles.optionsHint}>Controles do episódio</Text>
                        <TouchableOpacity style={styles.optionAction} onPress={() => { if (videoUrl) { player.currentTime = 0; player.play(); } setShowOptions(false); }}>
                            <Ionicons name="refresh-outline" size={21} color={COLORS.primary} /><Text style={styles.optionText}>Recomeçar episódio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionAction} onPress={() => { setShowOptions(false); playNext(); }}>
                            <Ionicons name="play-skip-forward-outline" size={21} color={COLORS.primary} /><Text style={styles.optionText}>Reproduzir próximo episódio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionAction} onPress={() => setShowOptions(false)}>
                            <Ionicons name="close-outline" size={21} color={COLORS.text.muted} /><Text style={styles.optionText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background.primary },
    topBar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 4 },
    iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    topTitle: { flex: 1, color: COLORS.text.main, fontSize: 17, fontWeight: '600', marginHorizontal: 8 },
    videoContainer: { width, aspectRatio: 16 / 9, backgroundColor: '#000', justifyContent: 'center' },
    video: { width: '100%', height: '100%' },
    emptyVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, backgroundColor: COLORS.background.secondary },
    emptyVideoTitle: { color: COLORS.text.main, fontSize: 16, fontWeight: 'bold', marginTop: 14, textAlign: 'center' },
    emptyVideoText: { color: COLORS.text.muted, fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: 'center' },
    details: { padding: 20, paddingBottom: 36 },
    seriesName: { color: COLORS.accent, fontWeight: '700', fontSize: 14, marginBottom: 8 },
    episodeTitle: { color: COLORS.text.main, fontSize: 23, fontWeight: 'bold' },
    metadata: { color: COLORS.text.muted, fontSize: 13, marginTop: 8 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.surface.primary },
    actionButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    actionText: { color: COLORS.text.main, fontSize: 12, fontWeight: '600' },
    sectionTitle: { color: COLORS.text.main, fontSize: 19, fontWeight: 'bold', marginBottom: 12 },
    episodeRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8, backgroundColor: COLORS.background.secondary, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
    episodeSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.surface.primary },
    episodeIndex: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold', width: 36 },
    episodeCopy: { flex: 1 },
    episodeRowTitle: { color: COLORS.text.main, fontSize: 14, fontWeight: '600' },
    episodeRowMeta: { color: COLORS.text.muted, fontSize: 12, marginTop: 4 },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
    optionsSheet: { backgroundColor: COLORS.background.secondary, padding: 22, paddingBottom: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    optionsHint: { color: COLORS.text.muted, fontSize: 13, marginBottom: 10 },
    optionAction: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: 12 },
    optionText: { color: COLORS.text.main, fontSize: 15 },
});
