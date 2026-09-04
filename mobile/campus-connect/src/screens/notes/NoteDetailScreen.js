import React, { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { colors, radius, spacing } from "../../theme/colors";
import { notesApi } from "../../api/notes";

export default function NoteDetailScreen({ route }) {
  const { resource } = route.params;
  const [opening, setOpening] = useState(false);
  const isLink = resource.deliveryType === "link" || resource.resourceType === "link" || resource.resourceType === "external_link";

  const openResource = async () => {
    setOpening(true);
    try {
      const download = await notesApi.getDownload(resource._id);
      if (!download?.url) throw new Error("No download is available");
      await Linking.openURL(download.url);
    } catch (error) {
      Alert.alert("Unable to open resource", error.message);
    } finally {
      setOpening(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={isLink ? "link-outline" : "document-outline"}
          size={28}
          color={colors.primary}
        />
      </View>

      <Text style={styles.title}>{resource.title}</Text>
      <Text style={styles.meta}>
        {resource.courseId} · Semester {resource.semester}
      </Text>

      {resource.description ? <Text style={styles.description}>{resource.description}</Text> : null}

      {resource.uploadedBy?.name ? (
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>Shared by {resource.uploadedBy.name}</Text>
        </View>
      ) : null}

      <Button
        title={isLink ? "Open link" : "Get secure download"}
        onPress={openResource}
        loading={opening}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 6,
  },
});
