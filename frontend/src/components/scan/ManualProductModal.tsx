import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, FONTS } from '../../constants/theme';
import { useCreateProduct, useExtractIngredients } from '../../hooks/queries/useProducts';
import { uploadProductPhoto } from '../../api/uploadPhoto';

const CATEGORIES = [
  'Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen',
  'Eye Cream', 'Exfoliant', 'Mask', 'Oil',
];

interface ManualProductModalProps {
  visible: boolean;
  barcode: string;
  onClose: () => void;
  onProductCreated: (productId: string) => void;
}

export default function ManualProductModal({
  visible,
  barcode,
  onClose,
  onProductCreated,
}: ManualProductModalProps) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const createProduct = useCreateProduct();
  const extractIngredients = useExtractIngredients();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [scanningLabel, setScanningLabel] = useState(false);

  const isValid = name.trim() && brand.trim() && category && ingredients.trim();

  const pickImage = (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
    };

    return source === 'camera'
      ? ImagePicker.launchCameraAsync(options)
      : ImagePicker.launchImageLibraryAsync(options);
  };

  const handlePickProductImage = () => {
    Alert.alert('Product Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await pickImage('camera');
          if (!result.canceled) uploadImage(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await pickImage('gallery');
          if (!result.canceled) uploadImage(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadImage = async (uri: string) => {
    setImageUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const url = await uploadProductPhoto(uri, token);
      setImageUrl(url);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload the photo. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleScanLabel = () => {
    Alert.alert('Scan Ingredient Label', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await pickImage('camera');
          if (!result.canceled) processLabelImage(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await pickImage('gallery');
          if (!result.canceled) processLabelImage(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const processLabelImage = async (uri: string) => {
    setScanningLabel(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const url = await uploadProductPhoto(uri, token);
      const result = await extractIngredients.mutateAsync(url);
      if (result.ingredients.length > 0) {
        setIngredients(result.ingredients.join(', '));
      } else {
        Alert.alert('No Ingredients Found', 'Could not read ingredients from the image. Please enter them manually.');
      }
    } catch {
      Alert.alert('Scan Failed', 'Could not extract ingredients. Please try again or enter them manually.');
    } finally {
      setScanningLabel(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const product = await createProduct.mutateAsync({
        name: name.trim(),
        brand: brand.trim(),
        category,
        ingredients: ingredients.trim(),
        barcode: barcode || undefined,
        imageUrl: imageUrl || undefined,
      });
      // Reset form
      setName('');
      setBrand('');
      setCategory('');
      setIngredients('');
      setImageUrl(null);
      onProductCreated(product.id);
    } catch {
      // mutation error is accessible via createProduct.error
    }
  };

  const handleClose = () => {
    setName('');
    setBrand('');
    setCategory('');
    setIngredients('');
    setImageUrl(null);
    createProduct.reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <BlurView
            intensity={60}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />

          <Animated.View
            entering={SlideInDown.duration(400).easing(Easing.out(Easing.cubic))}
            exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.cubic))}
            style={[styles.content, { paddingBottom: insets.bottom + 16 }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Enter Product Details</Text>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {barcode ? (
              <View style={styles.barcodeTag}>
                <Ionicons name="barcode-outline" size={14} color="#666" />
                <Text style={styles.barcodeText}>{barcode}</Text>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.form}
            >
              {/* Product Image */}
              <TouchableOpacity
                onPress={handlePickProductImage}
                activeOpacity={0.8}
                style={styles.imagePicker}
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <ActivityIndicator color={COLORS.primary} size="large" />
                ) : imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={32} color="#aaa" />
                    <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Product Name */}
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Gentle Foaming Cleanser"
                placeholderTextColor="#aaa"
              />

              {/* Brand */}
              <Text style={styles.label}>Brand *</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g. CeraVe"
                placeholderTextColor="#aaa"
              />

              {/* Category */}
              <Text style={styles.label}>Category *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipContainer}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                    style={[
                      styles.chip,
                      category === cat && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === cat && styles.chipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Ingredients */}
              <View style={styles.labelRow}>
                <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Ingredients *</Text>
                <TouchableOpacity
                  onPress={handleScanLabel}
                  activeOpacity={0.8}
                  style={styles.scanLabelButton}
                  disabled={scanningLabel}
                >
                  {scanningLabel ? (
                    <ActivityIndicator color={COLORS.primary} size="small" style={{ marginRight: 4 }} />
                  ) : (
                    <Ionicons name="scan-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={styles.scanLabelText}>
                    {scanningLabel ? 'Scanning...' : 'Scan Label'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={ingredients}
                onChangeText={setIngredients}
                placeholder="Comma-separated, e.g. Water, Glycerin, Niacinamide"
                placeholderTextColor="#aaa"
                multiline
                textAlignVertical="top"
              />

              {/* Error */}
              {createProduct.isError && (
                <Text style={styles.errorText}>
                  Failed to create product. Please try again.
                </Text>
              )}

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={!isValid || createProduct.isPending}
                style={[
                  styles.submitButton,
                  (!isValid || createProduct.isPending) && styles.submitButtonDisabled,
                ]}
              >
                {createProduct.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Analyze Product</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    color: '#1a1a2e',
    ...FONTS.bold,
  },
  barcodeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f5f5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  barcodeText: {
    fontSize: 13,
    color: '#666',
    ...FONTS.regular,
  },
  form: {
    flexGrow: 1,
  },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#f7f7fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#aaa',
    ...FONTS.regular,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
    ...FONTS.semibold,
  },
  scanLabelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '14',
  },
  scanLabelText: {
    fontSize: 12,
    color: COLORS.primary,
    ...FONTS.semibold,
  },
  input: {
    backgroundColor: '#f7f7fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#eee',
    ...FONTS.regular,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: 4,
  },
  chipContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipSelected: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: '#666',
    ...FONTS.semibold,
  },
  chipTextSelected: {
    color: COLORS.primary,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    ...FONTS.regular,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
    height: 52,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    ...FONTS.semibold,
  },
});
