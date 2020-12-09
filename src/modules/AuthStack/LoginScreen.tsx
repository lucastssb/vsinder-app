import React, { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform, View } from "react-native";
import { apiBaseUrl } from "../../constants";
import { Center } from "../../ui/Center";
import { MyButton } from "../../ui/MyButton";
import { ScreenWrapper } from "../../ui/ScreenWrapper";
import { AuthStackNav } from "./AuthNav";
import { showMessage } from "react-native-flash-message";
import * as AppleAuthentication from "expo-apple-authentication";
import { useMutation } from "react-query";
import { defaultMutationFn } from "../../Providers";
import { MyText } from "../../ui/MyText";
import { TouchableOpacity } from "react-native-gesture-handler";
import Modal from "react-native-modal";
import { useTheme } from "../../hooks/useTheme";

export const LoginScreen: React.FC<AuthStackNav<"login">> = ({
  navigation,
}) => {
  const [open, setOpen] = useState(Platform.OS === "ios");
  const [underAge, setUnderAge] = useState(false);
  const [mutate] = useMutation(defaultMutationFn);
  const { editorBackground } = useTheme();
  return (
    <ScreenWrapper>
      <Modal
        isVisible={open}
        backdropOpacity={1}
        backdropColor={editorBackground}
      >
        <View style={{ padding: 32, flex: 1 }}>
          {underAge ? (
            <Center>
              <MyText style={{ fontSize: 26 }}>
                You need to be 18 or older to use the app.
              </MyText>
            </Center>
          ) : (
            <Center>
              <MyText style={{ fontSize: 32, marginBottom: 20 }}>
                Are you 18 or older?
              </MyText>
              <View style={{ flexDirection: "row" }}>
                <MyButton style={{ flex: 1 }} onPress={() => setOpen(false)}>
                  yes
                </MyButton>
                <View style={{ width: 20 }} />
                <MyButton style={{ flex: 1 }} onPress={() => setUnderAge(true)}>
                  no
                </MyButton>
              </View>
            </Center>
          )}
        </View>
      </Modal>
      <Center>
        <View style={{ width: "100%" }}>
          <TouchableOpacity
            onPress={() => Linking.openURL(`https://www.vsinder.com/terms`)}
            style={{ marginBottom: 40 }}
          >
            <MyText style={{ textDecorationLine: "underline" }}>
              By tapping Sign in/login with Github, Apple, or Email, you agree
              to our terms
            </MyText>
          </TouchableOpacity>
          <MyButton
            style={{ marginBottom: 30 }}
            onPress={async () => {
              try {
                // @todo we can probably hard code this
                const redirectUrl = await Linking.getInitialURL();
                if (redirectUrl) {
                  const authResult = await WebBrowser.openAuthSessionAsync(
                    `${apiBaseUrl}/auth/github/rn`,
                    redirectUrl
                  );
                  if (authResult.type === "success") {
                    const parts = authResult.url.split("/");
                    const refreshToken = parts[parts.length - 1];
                    const accessToken = parts[parts.length - 2];

                    if (refreshToken && accessToken) {
                      navigation.navigate("tokens", {
                        accessToken,
                        refreshToken,
                      });
                    }
                    return;
                  }

                  if (
                    authResult.type === "cancel" ||
                    authResult.type === "dismiss"
                  ) {
                    return;
                  }
                }
              } catch (err) {
                console.log("ERROR:", err);
              }
              showMessage({ message: "something went wrong", type: "danger" });
            }}
          >
            login with GitHub to get started
          </MyButton>
          {Platform.OS === "ios" ? (
            <>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                }
                cornerRadius={5}
                style={{ height: 44 }}
                onPress={async () => {
                  try {
                    const credential = await AppleAuthentication.signInAsync({
                      requestedScopes: [
                        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                        AppleAuthentication.AppleAuthenticationScope.EMAIL,
                      ],
                    });
                    const tokens = await mutate([
                      "/apple/login",
                      credential,
                      "POST",
                    ]);
                    navigation.navigate("tokens", tokens);
                    // signed in
                  } catch (e) {
                    if (e.code === "ERR_CANCELED") {
                      // handle that the user canceled the sign-in flow
                    } else {
                      // handle other errors
                    }
                  }
                }}
              />
              <MyButton
                style={{ marginTop: 30 }}
                secondary
                onPress={() => navigation.navigate("EmailLogin")}
              >
                login with email
              </MyButton>
            </>
          ) : null}
        </View>
      </Center>
    </ScreenWrapper>
  );
};