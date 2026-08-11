// app/onboarding.tsx
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const pages = [
  {
    eyebrow: "Benvenuto",
    title: "Ball Prediction",
    text: "Trova rapidamente le probabilità e i pronostici delle partite di calcio nelle quattro sezioni dell’app.",
    icon: "1X2",
  },
  {
    eyebrow: "Tab 1",
    title: "1X2",
    text: "Visualizza le probabilità della vittoria della squadra di casa, del pareggio e della vittoria della squadra ospite. Le colonne sono 1, X e 2.",
    icon: "1  X  2",
  },
  {
    eyebrow: "Tab 2",
    title: "Over",
    text: "Controlla le previsioni Over per 2.5 e 3.5 gol. Per ogni partita puoi vedere percentuale, quota e risultato esatto quando disponibile.",
    icon: "2.5  3.5",
  },
  {
    eyebrow: "Tab 3",
    title: "BTTS",
    text: "La sezione BTTS mostra le probabilità che entrambe le squadre segnino: Yes oppure No.",
    icon: "YES  NO",
  },
  {
    eyebrow: "Tab 4",
    title: "Doppia Scelta",
    text: "Confronta le tre doppie possibilità: 1X, 12 e X2. Questa sezione non mostra la colonna CS.",
    icon: "1X  12  X2",
  },
  {
    eyebrow: "Filtri e ricerca",
    title: "Trova solo ciò che ti interessa",
    text: "Usa la ricerca per trovare una squadra o un campionato. Puoi anche scegliere una colonna, un operatore (<, >, =) e una percentuale per filtrare i risultati.",
    icon: "⌕  %  >",
  },
  {
    eyebrow: "Nuovo",
    title: "Tab Campionati",
    text: "La sezione Campionati ti permette di vedere i campionati presenti nei dati caricati e selezionarne uno per applicare subito il filtro desiderato.",
    icon: "⚽",
  },
  {
    eyebrow: "Nuovo",
    title: "Ordina le colonne",
    text: "Clicca sulle intestazioni delle colonne per alternare l’ordinamento crescente o decrescente e trovare subito le partite più interessanti.",
    icon: "⇅",
  },
  {
    eyebrow: "Informazioni",
    title: "Grazie a BallPrediction.com",
    text: "Le informazioni mostrate nell’app provengono da BallPrediction.com. Grazie al sito per i dati sulle partite e sui pronostici.",
    icon: "♥",
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const current = pages[page];
  const isLast = page === pages.length - 1;

  function finish() {
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#0B1220" />
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>1X2</Text>
          <Pressable onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>Salta</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>{current.icon}</Text>
          </View>
          <Text style={styles.eyebrow}>{current.eyebrow.toUpperCase()}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.text}</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {pages.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[styles.dot, index === page && styles.dotActive]}
              />
            ))}
          </View>
          {isLast ? (
            <View style={styles.buttonGroup}>
              <Pressable style={styles.button} onPress={finish}>
                <Text style={styles.buttonText}>Inizia</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.button}
              onPress={() => setPage((value) => value + 1)}
            >
              <Text style={styles.buttonText}>Continua</Text>
            </Pressable>
          )}
          {!isLast && (
            <Text style={styles.counter}>
              {page + 1} di {pages.length}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B1220" },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 18 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  skip: { color: "#93C5FD", fontSize: 15, fontWeight: "600" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#153B78",
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 42,
  },
  icon: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
  },
  eyebrow: {
    color: "#60A5FA",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    maxWidth: 360,
  },
  bottom: { alignItems: "center" },
  dots: { flexDirection: "row", gap: 6, marginBottom: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#334155" },
  dotActive: { width: 23, backgroundColor: "#60A5FA" },
  buttonGroup: { width: "100%", gap: 10 },
  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButton: { backgroundColor: "#1E3A8A" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  counter: { color: "#64748B", fontSize: 12, marginTop: 12 },
});
