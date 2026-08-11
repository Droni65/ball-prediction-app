// app/index.tsx
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Match1X2 } from '../types/match';
import { SOURCES, SourceKey } from '../constants/config';
import { parseMatches } from '../utils/parseMatches';

type OutcomeColumn = 'home' | 'draw' | 'away';
type Operator = '<' | '>' | '=';
type SortDirection = 'asc' | 'desc';
type SortableColumnKey = 'home' | 'draw' | 'away' | 'correctScore';
type SortState = { column: SortableColumnKey | null; direction: SortDirection | null };
const OPERATORS: Operator[] = ['<', '>', '='];

function labelsFor(source: SourceKey): [string, string, string] {
  if (source === 'over') return ['U2.5', 'U3.5', ''];
  if (source === 'btts') return ['Yes', 'No', ''];
  if (source === 'doubleChance') return ['1X', '12', 'X2'];
  return ['1', 'X', '2'];
}

function showCs(source: SourceKey) { return source !== 'doubleChance'; }
function compare(a: number, op: Operator, b: number) { return op === '<' ? a < b : op === '>' ? a > b : a === b; }
function scoreText(score: Match1X2['correctScore']) { return score ? `${score.home}-${score.away}` : '—'; }

function headersFor(source: SourceKey): Array<{ key: SortableColumnKey; label: string }> {
  if (source === 'over') return [{ key: 'home', label: 'U2.5' }, { key: 'away', label: 'U3.5' }];
  if (source === 'btts') return [{ key: 'home', label: 'Yes' }, { key: 'away', label: 'No' }];
  if (source === 'doubleChance') return [{ key: 'home', label: '1X' }, { key: 'draw', label: '12' }, { key: 'away', label: 'X2' }];
  return [{ key: 'home', label: '1' }, { key: 'draw', label: 'X' }, { key: 'away', label: '2' }];
}

function visibleHeaders(source: SourceKey) {
  const baseHeaders = headersFor(source);
  return showCs(source) ? [...baseHeaders, { key: 'correctScore' as SortableColumnKey, label: 'CS' }] : baseHeaders;
}

function getSortValue(match: Match1X2, column: SortableColumnKey) {
  if (column === 'correctScore') {
    if (!match.correctScore) return null;
    return match.correctScore.home * 100 + match.correctScore.away;
  }
  return match[column].probability;
}

export default function HomeScreen() {
  const [matches, setMatches] = useState<Match1X2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<OutcomeColumn>('home');
  const [operator, setOperator] = useState<Operator>('>');
  const [filterValue, setFilterValue] = useState('');
  const [activeSource, setActiveSource] = useState<SourceKey>('1x2');
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const labels = labelsFor(activeSource);
  const sortableHeaders = visibleHeaders(activeSource);

  async function loadMatches() {
    setLoading(true);
    setError(false);
    try {
      const source = SOURCES.find((item) => item.key === activeSource);
      if (!source) throw new Error('Sorgente non trovata');
      const response = await fetch(source.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7', 'Cache-Control': 'max-age=0', Referer: 'https://www.google.com/' } });
      const html = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMatches(parseMatches(html, activeSource));
    } catch (err) {
      console.error('Errore nel caricamento delle partite:', err);
      setMatches([]);
      setError(true);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    setSortState({ column: null, direction: null });
    loadMatches();
  }, [activeSource]);

  function handleSort(column: SortableColumnKey) {
    setSortState((current) => {
      if (current.column !== column) return { column, direction: 'asc' };
      if (current.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: null };
    });
  }

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    const value = filterValue.trim() === '' ? null : Number(filterValue);
    const baseMatches = matches.filter((match) => {
      if (search && !`${match.homeTeam} ${match.awayTeam}`.toLowerCase().includes(search)) return false;
      if (value !== null && !Number.isNaN(value) && !compare(match[selectedColumn].probability, operator, value)) return false;
      return true;
    });

    if (!sortState.column || !sortState.direction) return baseMatches;

    return [...baseMatches].sort((a, b) => {
      const aValue = getSortValue(a, sortState.column!);
      const bValue = getSortValue(b, sortState.column!);

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (sortState.direction === 'asc') return aValue - bValue;
      return bValue - aValue;
    });
  }, [matches, searchText, selectedColumn, operator, filterValue, sortState.column, sortState.direction]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="#0F1115" />
      <View style={styles.container}>
        <View style={styles.titleBar}>
          <Text style={styles.appTitle}>1X2 Prediction</Text>
          <Text style={styles.byline}>by Droni</Text>
        </View>

        <View style={styles.tabsBar}>
          {SOURCES.map((source) => <Pressable key={source.key} onPress={() => setActiveSource(source.key)} style={[styles.tab, activeSource === source.key && styles.tabActive]}><Text style={styles.tabText}>{source.label}</Text></Pressable>)}
        </View>

        <View style={styles.filterBar}>
          <TextInput style={styles.input} placeholder="Cerca squadra..." placeholderTextColor="#6B7280" value={searchText} onChangeText={setSearchText} />
          <Pressable style={styles.refreshBtn} onPress={loadMatches}><Text style={styles.refreshText}>↻</Text></Pressable>
        </View>

        <View style={styles.criteriaBar}>
          <View style={styles.segmentGroup}>{labels.map((label, index) => label ? <Pressable key={label} onPress={() => setSelectedColumn(index === 0 ? 'home' : index === 1 ? 'draw' : 'away')} style={styles.segmentBtn}><Text style={styles.segmentText}>{label}</Text></Pressable> : null)}</View>
          <View style={styles.segmentGroup}>{OPERATORS.map((op) => <Pressable key={op} onPress={() => setOperator(op)} style={[styles.segmentBtn, operator === op && styles.segmentBtnActive]}><Text style={styles.segmentText}>{op}</Text></Pressable>)}</View>
          <TextInput style={[styles.input, styles.valueInput]} placeholder="%" placeholderTextColor="#6B7280" keyboardType="numeric" value={filterValue} onChangeText={setFilterValue} />
        </View>

        {loading && <ActivityIndicator style={styles.loader} color="#2563EB" />}
        {error && !loading && <Text style={styles.error}>Errore nel caricamento dei dati. Trascina per riprovare.</Text>}
        {!loading && !error && matches.length > 0 && (
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.matchHeader]}>Match</Text>
            {sortableHeaders.map((header) => (
              <Pressable key={header.key} onPress={() => handleSort(header.key)} style={styles.headerCellPressable}>
                <Text style={[styles.headerCell, sortState.column === header.key && sortState.direction ? styles.headerCellActive : null]}>{header.label}</Text>
                {sortState.column === header.key && sortState.direction ? <Text style={styles.sortIndicator}>{sortState.direction === 'asc' ? '↑' : '↓'}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}

        <FlatList data={filtered} keyExtractor={(item) => item.id} onRefresh={loadMatches} refreshing={loading} renderItem={({ item }) => <MatchRow match={item} source={activeSource} />} ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>Nessuna partita trovata.</Text> : null} contentContainerStyle={styles.listContent} />
      </View>
    </SafeAreaView>
  );
}

function MatchRow({ match, source }: { match: Match1X2; source: SourceKey }) {
  const labels = labelsFor(source);
  const outcomes = [match.home, match.draw, match.away];
  const best = Math.max(...outcomes.map((outcome) => outcome.probability));
  return <View style={styles.row}>
    <View style={styles.matchInfo}><Text style={styles.league} numberOfLines={1}>{match.country ?? match.league}{match.startTime ? ` • ${match.startTime}` : ''}</Text><Text style={styles.teamLine} numberOfLines={1}>{match.homeTeam}</Text><Text style={styles.teamLine} numberOfLines={1}>{match.awayTeam}</Text></View>
    {outcomes.map((outcome, index) => labels[index] ? <View key={`outcome-${labels[index]}`} style={styles.cellWrap}><Text style={styles.outcomeLabel}>{labels[index]}</Text><Text style={outcome.probability === best ? styles.cellBest : styles.cell}>{outcome.probability}%</Text>{outcome.odd != null && <Text style={styles.odd}>{outcome.odd.toFixed(2)}</Text>}</View> : null)}
    {showCs(source) && <View style={styles.csWrap}><Text style={styles.csText}>{scoreText(match.correctScore)}</Text></View>}
  </View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1115' },
  container: { flex: 1, backgroundColor: '#0F1115', paddingHorizontal: 12 },
  titleBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 10 },
  appTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  byline: { color: '#93C5FD', fontSize: 10, fontWeight: '700' },
  tabsBar: { flexDirection: 'row', backgroundColor: '#1B1E27', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  tab: {
   flex: 1,
   minHeight: 42,
   paddingVertical: 10,
   alignItems: 'center',
   justifyContent: 'center',
   backgroundColor: '#1B1E27',
 },

 tabActive: {
   backgroundColor: '#2563EB',
   borderRightWidth: 3,
   borderRightColor: '#172554',
   shadowColor: '#000000',
   shadowOffset: { width: 3, height: 0 },
   shadowOpacity: 0.35,
   shadowRadius: 3,
   elevation: 5,
 },

 tabText: {
   color: '#FFFFFF',
   fontSize: 12,
   fontWeight: '700',
   textAlign: 'center',
 },

 tabTextActive: {
   color: '#FFFFFF',
   fontWeight: '900',
 },

  filterBar: { flexDirection: 'row', gap: 8, marginBottom: 8 }, input: { flex: 1, backgroundColor: '#1B1E27', color: '#FFF', borderRadius: 8, padding: 8 }, refreshBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' }, refreshText: { color: '#FFF', fontSize: 20 },
  criteriaBar: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }, segmentGroup: { flexDirection: 'row', backgroundColor: '#1B1E27', borderRadius: 8, overflow: 'hidden' }, segmentBtn: { paddingVertical: 8, paddingHorizontal: 12 }, segmentBtnActive: { backgroundColor: '#2563EB' }, segmentText: { color: '#FFF', fontWeight: '700' }, valueInput: { flex: 0.6, textAlign: 'center' }, loader: { marginTop: 20 }, error: { color: '#EF4444', textAlign: 'center', marginTop: 20 }, empty: { color: '#9AA0AC', textAlign: 'center', marginTop: 30 }, listContent: { flexGrow: 1 },
  headerRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#2A2E38' }, headerCellPressable: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 }, headerCell: { color: '#9AA0AC', fontSize: 12, fontWeight: '700', textAlign: 'center' }, headerCellActive: { color: '#FFFFFF' }, sortIndicator: { color: '#60A5FA', fontSize: 12, marginTop: 2 }, matchHeader: { flex: 2.5, textAlign: 'left' }, row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#1B1E27' }, matchInfo: { flex: 2.5, flexShrink: 1 }, league: { color: '#9AA0AC', fontSize: 11, marginBottom: 2 }, teamLine: { color: '#FFF', fontSize: 13, fontWeight: '600', lineHeight: 17 }, cellWrap: { flex: 1, alignItems: 'center' }, outcomeLabel: { color: '#111827', backgroundColor: '#FBBF24', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, fontSize: 12, fontWeight: '800', marginBottom: 2 }, cell: { color: '#D1D5DB', fontSize: 15, fontWeight: '600' }, cellBest: { color: '#22C55E', fontSize: 15, fontWeight: '800' }, odd: { color: '#6B7280', fontSize: 14 }, csWrap: { width: 42, alignItems: 'center', justifyContent: 'center' }, csText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
