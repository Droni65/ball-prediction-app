import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Match1X2 } from "../../types/match";
import {
    parseSingleMatchPage,
    SingleMatchDetails,
} from "../../utils/parseSingleMatch";

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; match?: string }>();
  const [parsedDetails, setParsedDetails] = useState<SingleMatchDetails | null>(
    null,
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const match = useMemo(() => {
    const rawMatch = Array.isArray(params.match)
      ? params.match[0]
      : params.match;
    if (!rawMatch) return null;

    try {
      return JSON.parse(rawMatch) as Match1X2;
    } catch {
      return null;
    }
  }, [params.match]);

  useEffect(() => {
    if (!match?.matchUrl) {
      setParsedDetails(null);
      setLoadingDetails(false);
      return;
    }

    let isActive = true;
    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        if (!match.matchUrl) {
          if (!isActive) return;
          setParsedDetails(null);
          return;
        }

        const response = await fetch(match.matchUrl);
        const html = await response.text();
        if (!isActive) return;
        setParsedDetails(parseSingleMatchPage(html, match));
      } catch {
        if (isActive) setParsedDetails(null);
      } finally {
        if (isActive) setLoadingDetails(false);
      }
    };

    loadDetails();

    return () => {
      isActive = false;
    };
  }, [match]);

  const browserUrl = useMemo(() => {
    if (!match) return null;

    const slugify = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const leagueSlug = slugify(match.league || match.country || "match");
    const homeSlug = slugify(match.homeTeam);
    const awaySlug = slugify(match.awayTeam);

    if (!leagueSlug || !homeSlug || !awaySlug) {
      if (!match.matchUrl) return null;
      return match.matchUrl.startsWith("http")
        ? match.matchUrl
        : `https://ballprediction.com${match.matchUrl}`;
    }

    return `https://ballprediction.com/${leagueSlug}/${homeSlug}-v-${awaySlug}`;
  }, [match]);

  const details = parsedDetails ?? null;

  if (!match) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#0F1115" />
        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Indietro</Text>
          </Pressable>
          <Text style={styles.empty}>Partita non trovata.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#0F1115" />
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Indietro</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.teamHeader}>
            <Text style={styles.title}>
              {details?.homeTeam || match.homeTeam}
            </Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.title}>
              {details?.awayTeam || match.awayTeam}
            </Text>
          </View>

          {loadingDetails ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#93C5FD" />
              <Text style={styles.loadingText}>Caricamento dettagli...</Text>
            </View>
          ) : null}

          {details ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Probabilità</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>1</Text>
                  <Text style={styles.value}>
                    {details.probabilities.home ?? match.home.probability}%
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>X</Text>
                  <Text style={styles.value}>
                    {details.probabilities.draw ?? match.draw.probability}%
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>2</Text>
                  <Text style={styles.value}>
                    {details.probabilities.away ?? match.away.probability}%
                  </Text>
                </View>
              </View>

              {details.correctScore ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Risultato esatto</Text>
                  <Text style={styles.score}>
                    {details.correctScore.home}-{details.correctScore.away}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Probabilità</Text>
              <View style={styles.row}>
                <Text style={styles.label}>1</Text>
                <Text style={styles.value}>{match.home.probability}%</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>X</Text>
                <Text style={styles.value}>{match.draw.probability}%</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>2</Text>
                <Text style={styles.value}>{match.away.probability}%</Text>
              </View>
            </View>
          )}

          {browserUrl ? (
            <Pressable
              style={styles.card}
              onPress={() => {
                void WebBrowser.openBrowserAsync(browserUrl);
              }}
            >
              <Text style={styles.cardTitle}>URL partita</Text>
              <Text style={styles.url}>{browserUrl}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F1115" },
  container: { flex: 1, backgroundColor: "#0F1115", padding: 16 },
  backButton: { alignSelf: "flex-start", marginBottom: 16 },
  backButtonText: { color: "#93C5FD", fontSize: 15, fontWeight: "700" },
  content: { paddingBottom: 24 },
  teamHeader: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  vs: { color: "#9AA0AC", fontSize: 16, fontWeight: "700", marginVertical: 6 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: { color: "#CBD5E1", fontSize: 14 },
  summary: { color: "#CBD5E1", fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: "#1B1E27",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2E38",
  },
  label: { color: "#9AA0AC", fontSize: 14, fontWeight: "700" },
  value: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  score: { color: "#22C55E", fontSize: 20, fontWeight: "800" },
  url: { color: "#93C5FD", fontSize: 13, lineHeight: 20 },
  empty: { color: "#FFF", fontSize: 16, marginTop: 24 },
});
