import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { RootStackParamList, MangaChapter } from '../routes/types';
import { COLORS } from '../theme/colors';
import { mediaRepository } from '../services/mediaRepository';
import { loadReadChapters, loadReadingMode, loadReadingProgress, markChapterRead, MangaReadingMode, saveReadingMode, saveReadingProgress } from '../utils/readingProgress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'MangaReader'>;

const MODE_LABEL: Record<MangaReadingMode, string> = { manga: 'Mangá', comic: 'HQ', manhwa: 'Manhwa' };

export default function MangaReaderScreen({ route, navigation }: Props) {
    const { mangaTitle, chapters } = route.params;
    const insets = useSafeAreaInsets();
    const [chapter, setChapter] = useState(route.params.chapter);
    const [mode, setMode] = useState<MangaReadingMode>('manga');
    const [readIds, setReadIds] = useState<string[]>([]);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showChapters, setShowChapters] = useState(false);
    const [showModes, setShowModes] = useState(false);
    const [pdfError, setPdfError] = useState(false);
    const [progressLoaded, setProgressLoaded] = useState(false);

    const orderedChapters = useMemo(() => [...chapters].sort((a, b) => a.number - b.number), [chapters]);
    const currentIndex = orderedChapters.findIndex((item) => item.id === chapter.id);
    const previous = orderedChapters[currentIndex - 1];
    const next = orderedChapters[currentIndex + 1];

    useEffect(() => {
        let active = true;
        Promise.all([loadReadChapters(mangaTitle), loadReadingProgress(mangaTitle), loadReadingMode(mangaTitle)]).then(([read, progress, preferredMode]) => {
            if (!active) return;
            setReadIds(read);
            if (preferredMode || progress) setMode(preferredMode ?? progress!.mode);
            setProgressLoaded(true);
        });
        return () => { active = false; };
    }, [mangaTitle]);

    useEffect(() => {
        let active = true;
        setPdfUrl(null);
        setPdfError(false);
        const reference = chapter.asset ?? chapter.pdfUrl;
        setLoading(Boolean(reference));
        if (progressLoaded) void saveReadingProgress(mangaTitle, chapter.id, chapter.number, mode);
        if (!reference) return () => { active = false; };
        mediaRepository.resolve(reference).then((url) => {
            if (active) setPdfUrl(url);
        }).catch(() => { if (active) setPdfError(true); }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [chapter, mangaTitle, mode, progressLoaded]);

    const goToChapter = async (target: MangaChapter, markCurrent = false) => {
        if (markCurrent) {
            await markChapterRead(mangaTitle, chapter.id);
            setReadIds((current) => current.includes(chapter.id) ? current : [...current, chapter.id]);
        }
        setChapter(target);
        setShowChapters(false);
    };

    const finishChapter = async () => {
        await markChapterRead(mangaTitle, chapter.id);
        setReadIds((current) => current.includes(chapter.id) ? current : [...current, chapter.id]);
        if (next) await goToChapter(next);
        else navigation.goBack();
    };

    const renderPage = ({ item }: { item: string }) => <Image source={{ uri: item }} style={styles.pageImage} resizeMode="contain" />;

    return (
        <View style={styles.screen}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar aos detalhes do mangá" style={styles.headerButton} onPress={() => { if (navigation.canGoBack()) navigation.pop(); else navigation.navigate('Main'); }}><Ionicons name="arrow-back" size={23} color={COLORS.text.main} /></TouchableOpacity>
                <TouchableOpacity style={styles.chapterPicker} onPress={() => setShowChapters(true)}>
                    <Text style={styles.chapterTitle} numberOfLines={1}>{chapter.number} - {chapter.title}</Text>
                    <Ionicons name="chevron-down" size={19} color={COLORS.text.main} />
                </TouchableOpacity>
                {pdfUrl && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Abrir PDF no leitor do dispositivo" style={styles.headerButton} onPress={() => Linking.openURL(pdfUrl)}><Ionicons name="open-outline" size={21} color={COLORS.text.main} /></TouchableOpacity>}
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Modo de leitura" style={styles.headerButton} onPress={() => setShowModes(true)}><Ionicons name="book-outline" size={22} color={COLORS.text.main} /></TouchableOpacity>
            </View>

            <View style={styles.reader}>
                {chapter.pages?.length ? (
                    mode === 'manhwa' ? (
                        <FlatList data={chapter.pages} keyExtractor={(_, index) => `${chapter.id}-page-${index}`} renderItem={renderPage} />
                    ) : (
                        <FlatList horizontal pagingEnabled inverted={mode === 'manga'} data={chapter.pages} keyExtractor={(_, index) => `${chapter.id}-page-${index}`} renderItem={renderPage} />
                    )
                ) : pdfUrl ? (
                    <WebView
                        key={`${chapter.id}-${pdfUrl}`}
                        source={{ uri: pdfUrl }}
                        style={styles.pdfView}
                        originWhitelist={['https://*', 'http://*']}
                        startInLoadingState
                        onError={() => setPdfError(true)}
                        renderLoading={() => <View style={styles.readerMessage}><ActivityIndicator color={COLORS.primary} /><Text style={styles.readerMessageText}>Carregando capítulo…</Text></View>}
                    />
                ) : (
                    <View style={styles.readerMessage}>
                        {loading ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="book-outline" size={52} color={COLORS.primary} />}
                        <Text style={styles.readerMessageTitle}>{loading ? 'Carregando capítulo…' : pdfError ? 'Não foi possível carregar o capítulo' : 'Capítulo ainda não publicado'}</Text>
                        <Text style={styles.readerMessageText}>{pdfError ? 'O PDF não abriu no leitor integrado.' : 'O catálogo já aceita PDF ou páginas por capítulo. Quando o arquivo for vinculado, ele aparecerá aqui.'}</Text>
                        {!!pdfUrl && pdfError && <TouchableOpacity style={styles.openExternal} onPress={() => Linking.openURL(pdfUrl)}><Text style={styles.openExternalText}>Abrir PDF no navegador</Text></TouchableOpacity>}
                    </View>
                )}
            </View>

            <View style={styles.bottomBar}>
                <TouchableOpacity disabled={!previous} style={[styles.navButton, !previous && styles.navButtonDisabled]} onPress={() => previous && goToChapter(previous)}><Ionicons name="chevron-back" size={20} color={COLORS.text.main} /><Text style={styles.navText}>Anterior</Text></TouchableOpacity>
                <Text style={styles.readMode}>{MODE_LABEL[mode]}</Text>
                <TouchableOpacity style={styles.navButton} onPress={finishChapter}><Text style={styles.navText}>{next ? 'Próximo' : 'Concluir'}</Text><Ionicons name="chevron-forward" size={20} color={COLORS.text.main} /></TouchableOpacity>
            </View>

            <Modal visible={showChapters} transparent animationType="slide" onRequestClose={() => setShowChapters(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.chapterSheet}>
                        <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Capítulos</Text><TouchableOpacity onPress={() => setShowChapters(false)}><Ionicons name="close" size={24} color={COLORS.text.main} /></TouchableOpacity></View>
                        <ScrollView>
                            {orderedChapters.map((item) => {
                                const isRead = readIds.includes(item.id);
                                const selected = item.id === chapter.id;
                                return <TouchableOpacity key={item.id} style={[styles.chapterRow, selected && styles.chapterRowSelected]} onPress={() => goToChapter(item)}>
                                    <View style={[styles.numberBadge, isRead && styles.numberBadgeRead]}><Text style={[styles.numberText, isRead && styles.numberTextRead]}>{item.number}</Text></View>
                                    <View style={styles.chapterCopy}><Text style={styles.listChapterTitle}>{item.number} - {item.title}</Text><Text style={styles.listChapterState}>{isRead ? 'Lido' : 'Ainda não lido'}</Text></View>
                                    {selected && <Ionicons name="volume-high" size={18} color={COLORS.primary} />}
                                </TouchableOpacity>;
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showModes} transparent animationType="fade" onRequestClose={() => setShowModes(false)}>
                <View style={styles.modeBackdrop}><View style={styles.modeSheet}>
                    <Text style={styles.sheetTitle}>Como você quer ler?</Text>
                    {([
                        ['manga', 'Mangá', 'Direita para a esquerda'],
                        ['comic', 'HQ', 'Esquerda para a direita'],
                        ['manhwa', 'Manhwa', 'Rolagem vertical'],
                    ] as [MangaReadingMode, string, string][]).map(([value, label, detail]) => <TouchableOpacity key={value} style={styles.modeRow} onPress={() => { setMode(value); void saveReadingMode(mangaTitle, value); setShowModes(false); }}>
                        <View style={styles.chapterCopy}><Text style={styles.listChapterTitle}>{label}</Text><Text style={styles.listChapterState}>{detail}</Text></View>
                        {mode === value && <Ionicons name="checkmark-circle" size={21} color={COLORS.primary} />}
                    </TouchableOpacity>)}
                    <TouchableOpacity style={styles.closeModes} onPress={() => setShowModes(false)}><Text style={styles.closeModesText}>Fechar</Text></TouchableOpacity>
                </View></View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background.primary },
    header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: COLORS.background.primary },
    headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    chapterPicker: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 8 },
    chapterTitle: { flex: 1, color: COLORS.text.main, fontSize: 16, fontWeight: '600' },
    reader: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
    pageImage: { width: '100%', height: '100%', backgroundColor: '#000' },
    pdfView: { flex: 1, backgroundColor: COLORS.background.primary },
    readerMessage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: COLORS.background.secondary },
    readerMessageTitle: { color: COLORS.text.main, fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginTop: 14 },
    readerMessageText: { color: COLORS.text.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
    openExternal: { minHeight: 46, justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 24, paddingHorizontal: 22, marginTop: 18 },
    openExternalText: { color: COLORS.background.primary, fontWeight: 'bold' },
    bottomBar: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, backgroundColor: COLORS.background.primary, borderTopWidth: 1, borderColor: COLORS.surface.primary },
    navButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
    navButtonDisabled: { opacity: 0.35 },
    navText: { color: COLORS.text.main, fontSize: 13, fontWeight: '600' },
    readMode: { color: COLORS.text.muted, fontSize: 12 },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
    chapterSheet: { height: '78%', backgroundColor: COLORS.background.secondary, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 16, paddingTop: 18 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
    sheetTitle: { color: COLORS.text.main, fontSize: 20, fontWeight: 'bold' },
    chapterRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.surface.primary },
    chapterRowSelected: { backgroundColor: COLORS.surface.primary },
    numberBadge: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface.secondary },
    numberBadgeRead: { backgroundColor: COLORS.accent },
    numberText: { color: COLORS.text.main, fontWeight: 'bold' },
    numberTextRead: { color: COLORS.background.primary },
    chapterCopy: { flex: 1 },
    listChapterTitle: { color: COLORS.text.main, fontSize: 14, fontWeight: '600' },
    listChapterState: { color: COLORS.text.muted, fontSize: 12, marginTop: 4 },
    modeBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.65)' },
    modeSheet: { backgroundColor: COLORS.background.secondary, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.surface.primary },
    modeRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.surface.primary },
    closeModes: { alignSelf: 'flex-end', padding: 12, marginTop: 8 },
    closeModesText: { color: COLORS.primary, fontWeight: 'bold' },
});
