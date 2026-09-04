import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme/colors";

export default function SignupScreen({ navigation }) {
  const { signup, authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const onSubmit = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!email.trim().endsWith("iiitg.ac.in")) {
      setError("Please use your college email (iiitg.ac.in)");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      const user = await signup(name.trim(), email.trim(), password);
      if (!user) {
        // Backend didn't return a token in body — fall back to login screen.
        navigation.navigate("Login");
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Campus Connect</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Only IIITG college emails are accepted</Text>

        <View style={{ marginTop: spacing.lg }}>
          <Input label="Full name" placeholder="Jane Doe" value={name} onChangeText={setName} />
          <Input
            label="College email"
            placeholder="you@iiitg.ac.in"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button title="Sign up" onPress={onSubmit} loading={authLoading} style={{ marginTop: spacing.sm }} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
            Log in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
});
