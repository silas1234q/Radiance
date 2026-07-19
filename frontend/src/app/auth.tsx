import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, Image } from "react-native";
import { useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import Svg, { Path } from "react-native-svg";
import GoogleLogo from '@/src/assets/images/googleimage.png'
import { Ionicons } from "@expo/vector-icons";

export default function AuthScreen() {
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);

  const handleOAuth = async (strategy: "oauth_apple" | "oauth_google") => {
    setLoading(strategy === "oauth_apple" ? "apple" : "google");
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else {
        setLoading(null);
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code?: string; message?: string }[] };
      if (clerkErr?.errors?.[0]?.code !== "session_exists") {
        Alert.alert("Error", clerkErr.errors?.[0]?.message || "Sign in failed");
      }
      setLoading(null);
    }
  };

  return (
    <View className="flex-1 bg-white px-[30px] pb-10 justify-between">
      <View style={{ flex: 0.3 }} />

      <View className="items-center">
        <View
          className="w-24 h-24 rounded-[30px] bg-primary items-center justify-center mb-[30px] shadow-primary"
          style={{
            shadowColor: '#F06680',
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.55,
            shadowRadius: 40,
            elevation: 12,
          }}
        >
          <Svg width={46} height={46} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2.5c3.2 4.2 6.2 7.2 6.2 11.1A6.2 6.2 0 0 1 12 19.8a6.2 6.2 0 0 1-6.2-6.2C5.8 9.7 8.8 6.7 12 2.5z"
              fill="#fff"
            />
            <Path
              d="M9.4 13.6a2.6 2.6 0 0 0 2.6 2.6"
              stroke="#FF5A5F"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </Svg>
        </View>
        <Text className="text-[52px] font-poppins-extrabold tracking-[-2px] text-skin-text">
          Radiance
        </Text>
        <Text className="text-[21px] font-poppins-semibold text-skin-text mt-[18px] max-w-[260px] text-center leading-[27px]">
          Skincare that actually understands your skin
        </Text>
        <Text className="text-base text-skin-text-secondary mt-3 max-w-[250px] text-center leading-[22px]">
          Answer a few questions and we'll build a routine around you.
        </Text>
      </View>

      <View className="items-center gap-4">
        <Pressable
          className="w-full h-[54px] rounded-xl bg-black flex-row items-center justify-center gap-2.5"
          style={loading ? { opacity: 0.6 } : undefined}
          disabled={!!loading}
          onPress={() => handleOAuth("oauth_apple")}
        >
          {loading === "apple" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons  name={'logo-apple'} color="white" size={18}/>
              <Text className="text-base font-poppins-semibold text-white">
                Continue with Apple
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          className="w-full h-[54px] rounded-xl bg-white border-[1.5px] border-skin-border flex-row items-center justify-center gap-2.5"
          style={loading ? { opacity: 0.6 } : undefined}
          disabled={!!loading}
          onPress={() => handleOAuth("oauth_google")}
        >
          {loading === "google" ? (
            <ActivityIndicator color="#1C1C1E" />
          ) : (
            <>
               <Image source={GoogleLogo} className="w-6 h-6"/>
              <Text className="text-base font-poppins-semibold text-skin-text">
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Text className="text-[13px] text-skin-text-tertiary font-poppins">
          Takes about 2 minutes
        </Text>
      </View>
    </View>
  );
}
