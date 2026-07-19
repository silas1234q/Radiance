import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../../constants/theme";
import GlassCard from "../../components/ui/GlassCard";
import { useBarcodeLookup } from "../../hooks/queries/useProducts";
import ManualProductModal from "../../components/scan/ManualProductModal";

const { width: SCREEN_W } = Dimensions.get("window");
const CUTOUT_W = 280;
const CUTOUT_H = 160;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

type ScanState = "scanning" | "loading" | "not-found" | "error";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const barcodeLookup = useBarcodeLookup();

  const [state, setState] = useState<ScanState>("scanning");
  const [lastBarcode, setLastBarcode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const lastScanRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });

  const [permission, requestPermission] = useCameraPermissions();

  // Animated scan line
  const scanLineY = useSharedValue(0);
  React.useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(CUTOUT_H - 4, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  // Reset state when tab comes back into focus
  useFocusEffect(
    useCallback(() => {
      setState("scanning");
      setLastBarcode("");
    }, []),
  );

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      const now = Date.now();
      if (
        lastScanRef.current.code === data &&
        now - lastScanRef.current.time < 3000
      ) {
        return;
      }
      lastScanRef.current = { code: data, time: now };
      setLastBarcode(data);
      setState("loading");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        const product = await barcodeLookup.mutateAsync(data);
        router.push({
          pathname: "/product-detail",
          params: { id: product.id },
        });
        setTimeout(() => setState("scanning"), 1000);
      } catch (err: any) {
        if (
          err?.status === 404 ||
          err?.message?.includes("404") ||
          err?.message?.includes("not found")
        ) {
          setState("not-found");
          setShowManualEntry(true);
        } else {
          setState("error");
        }
      }
    },
    [barcodeLookup, router],
  );

  // --- Permission loading ---
  if (!permission) {
    return <View style={styles.container} />;
  }

  // --- Permission denied ---
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons
          name="barcode-outline"
          size={48}
          color={COLORS.primary}
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionBody}>
          We need camera access to scan product barcodes and check their
          compatibility with your skin.
        </Text>
        {permission.canAskAgain ? (
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => Linking.openSettings()}
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera — only render when tab is focused */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
          onBarcodeScanned={
            state === "scanning" ? handleBarcodeScanned : undefined
          }
        />
      )}

      {/* Dark overlay with cutout */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top */}
        <View
          style={[styles.overlay, { top: 0, left: 0, right: 0, height: "38%" }]}
        />
        {/* Bottom */}
        <View
          style={[
            styles.overlay,
            { bottom: 0, left: 0, right: 0, height: "38%" },
          ]}
        />
        {/* Left */}
        <View
          style={[
            styles.overlay,
            {
              top: "38%",
              left: 0,
              width: (SCREEN_W - CUTOUT_W) / 2,
              bottom: "38%",
            },
          ]}
        />
        {/* Right */}
        <View
          style={[
            styles.overlay,
            {
              top: "38%",
              right: 0,
              width: (SCREEN_W - CUTOUT_W) / 2,
              bottom: "38%",
            },
          ]}
        />
      </View>

      {/* Cutout frame with corner brackets */}
      <View style={styles.cutoutWrapper} pointerEvents="none">
        <View style={styles.cutout}>
          {/* Top-left corner */}
          <View style={[styles.corner, styles.cornerTL]} />
          {/* Top-right corner */}
          <View style={[styles.corner, styles.cornerTR]} />
          {/* Bottom-left corner */}
          <View style={[styles.corner, styles.cornerBL]} />
          {/* Bottom-right corner */}
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Animated scan line */}
          <Animated.View style={[styles.scanLine, scanLineStyle]} />
        </View>
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Scan Product</Text>
        <Text style={styles.headerSubtitle}>Point at a barcode</Text>
      </View>

      {/* Loading overlay */}
      {state === "loading" && (
        <View style={styles.cardOverlay}>
          <GlassCard style={styles.statusCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.statusText}>Looking up product...</Text>
          </GlassCard>
        </View>
      )}

      {/* Not found overlay */}
      {state === "not-found" && (
        <View style={styles.cardOverlay}>
          <GlassCard style={styles.statusCard}>
            <Ionicons name="warning-outline" size={36} color="#F59E0B" />
            <Text style={styles.statusText}>Product not found</Text>
            <Text style={styles.statusSubtext}>{lastBarcode}</Text>
            <Pressable
              onPress={() => setShowManualEntry(true)}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.actionButtonText}>Enter Manually</Text>
            </Pressable>
            <Pressable
              onPress={() => setState("scanning")}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.secondaryButtonText}>Scan Another</Text>
            </Pressable>
          </GlassCard>
        </View>
      )}

      {/* Manual product entry modal */}
      <ManualProductModal
        visible={showManualEntry}
        barcode={lastBarcode}
        onClose={() => setShowManualEntry(false)}
        onProductCreated={(productId) => {
          setShowManualEntry(false);
          setState("scanning");
          router.push({ pathname: "/product-detail", params: { id: productId } });
        }}
      />

      {/* Error overlay */}
      {state === "error" && (
        <View style={styles.cardOverlay}>
          <GlassCard style={styles.statusCard}>
            <Ionicons name="cloud-offline-outline" size={36} color="#EF4444" />
            <Text style={styles.statusText}>Something went wrong</Text>
            <Pressable
              onPress={() => setState("scanning")}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.actionButtonText}>Try Again</Text>
            </Pressable>
          </GlassCard>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cutoutWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  cutout: {
    width: CUTOUT_W,
    height: CUTOUT_H,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: COLORS.primary,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: COLORS.primary,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: COLORS.primary,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
    borderRadius: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  statusCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 32,
    width: 260,
  },
  statusText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1a1a2e",
    marginTop: 12,
    textAlign: "center",
  },
  statusSubtext: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryButton: {
    marginTop: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  skinScanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  skinScanText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 8,
  },
  permissionBody: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    height: 56,
    width: "100%",
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
});
