import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Typography, FontWeight } from "../theme/tokens";

/**
 * CitySearchPicker
 * A searchable, modal-based city picker that replaces the inline scrolling dropdown.
 *
 * Props:
 *  visible      — boolean, controls modal visibility
 *  cities       — string[], full list of cities (including "Other")
 *  selectedCity — string | null, currently selected city
 *  onSelect     — (city: string | null) => void, called with the chosen city (null = "All Cities")
 *  onClose      — () => void, called when the modal is dismissed without selecting
 *  allowAll     — boolean (default true), shows an "All Cities" option at the top
 */
export default function CitySearchPicker({
  visible,
  cities = [],
  selectedCity,
  onSelect,
  onClose,
  allowAll = true,
}) {
  const [searchText, setSearchText] = useState("");

  const filtered = useMemo(() => {
    if (!searchText.trim()) return cities;
    const q = searchText.trim().toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, searchText]);

  const handleSelect = (city) => {
    setSearchText("");
    onSelect(city);
  };

  const handleClose = () => {
    setSearchText("");
    onClose();
  };

  const renderItem = ({ item }) => {
    const isSelected = item === selectedCity;
    return (
      <TouchableOpacity
        style={[styles.cityRow, isSelected && styles.cityRowSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>
          {item}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select City</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={Colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities…"
              placeholderTextColor={Colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              autoCapitalize="words"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* "All Cities" option */}
          {allowAll && !searchText && (
            <TouchableOpacity
              style={[styles.cityRow, !selectedCity && styles.cityRowSelected]}
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cityText, !selectedCity && styles.cityTextSelected]}>
                All Cities
              </Text>
              {!selectedCity && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          )}

          {/* City list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No cities match "{searchText}"</Text>
              </View>
            }
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: "rgba(9, 13, 26, 0.6)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  list: {
    flexGrow: 0,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight || Colors.border,
  },
  cityRowSelected: {
    backgroundColor: "rgba(0, 245, 160, 0.06)",
  },
  cityText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  cityTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  emptyWrap: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: Typography.body,
  },
});
