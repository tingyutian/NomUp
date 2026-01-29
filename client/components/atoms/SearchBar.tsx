import React, { memo, useState, useCallback, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { IconButton } from "./IconButton";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onAddPress: () => void;
  placeholder?: string;
}

export const SearchBar = memo(function SearchBar({
  value,
  onChangeText,
  onAddPress,
  placeholder = "Search items...",
}: SearchBarProps) {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = useCallback((text: string) => {
    setLocalValue(text);
    onChangeText(text);
  }, [onChangeText]);

  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
      <Feather name="search" size={20} color={theme.textSecondary} />
      <TextInput
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.searchInput, { color: theme.text }]}
        testID="input-search"
      />
      <IconButton
        name="plus"
        size={20}
        onPress={onAddPress}
        backgroundColor={theme.text}
        color={theme.buttonText}
        style={styles.addButton}
        testID="button-add-item"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addButton: {
    marginLeft: Spacing.sm,
  },
});
