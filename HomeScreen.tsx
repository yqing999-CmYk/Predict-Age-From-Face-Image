import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { predictAge, PredictAgeResponse } from "../services/api";

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictAgeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pickImage(fromCamera: boolean) {
    setResult(null);
    setError(null);

    // Request permission
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera access is needed.");
        return;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Photo library access is needed.");
        return;
      }
    }

    const pickerResult = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          allowsEditing: false,
        });

    if (pickerResult.canceled || !pickerResult.assets?.length) return;

    const asset = pickerResult.assets[0];
    setImageUri(asset.uri);
    await analyze(asset.uri, asset.fileName ?? "photo.jpg", asset.mimeType ?? "image/jpeg");
  }

  async function analyze(uri: string, fileName: string, mimeType: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictAge(uri, fileName, mimeType);
      setResult(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect to the server.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImageUri(null);
    setResult(null);
    setError(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Age Predictor</Text>
      <Text style={styles.subtitle}>Upload a photo to detect face age(s)</Text>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => pickImage(false)}
        >
          <Text style={styles.btnText}>Gallery</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => pickImage(true)}
        >
          <Text style={styles.btnText}>Camera</Text>
        </Pressable>
      </View>

      {/* Preview */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color="#4F8EF7" />
          <Text style={styles.statusText}>Analyzing faces...</Text>
        </View>
      )}

      {/* Result */}
      {result && !loading && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>
            {result.faces_found === 0 ? "No Face Found" : "Result"}
          </Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
          {result.ages.length > 1 && (
            <View style={styles.ageTags}>
              {result.ages.map((age, i) => (
                <View key={i} style={styles.ageTag}>
                  <Text style={styles.ageTagText}>
                    Person {i + 1}: ~{age} yrs
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Reset */}
      {(imageUri || result || error) && !loading && (
        <Pressable
          style={({ pressed }) => [styles.resetBtn, pressed && styles.btnPressed]}
          onPress={reset}
        >
          <Text style={styles.resetBtnText}>Try Another Photo</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F7FF",
    alignItems: "center",
    padding: 24,
    paddingTop: Platform.OS === "android" ? 48 : 60,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: "#4F8EF7",
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  preview: {
    width: "100%",
    height: 280,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: "#ddd",
  },
  statusBox: {
    alignItems: "center",
    gap: 10,
    marginVertical: 16,
  },
  statusText: {
    fontSize: 15,
    color: "#555",
  },
  resultBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  ageTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  ageTag: {
    backgroundColor: "#EEF3FF",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ageTagText: {
    color: "#4F8EF7",
    fontWeight: "600",
    fontSize: 13,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#E53935",
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
    lineHeight: 20,
  },
  resetBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#4F8EF7",
  },
  resetBtnText: {
    color: "#4F8EF7",
    fontSize: 15,
    fontWeight: "600",
  },
});
