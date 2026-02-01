import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Slider } from "@/components/atoms/Slider";
import { Badge } from "@/components/atoms/Badge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { GroceryItem } from "@/context/AppContext";

interface ItemDetailModalProps {
  visible: boolean;
  onClose: () => void;
  item: GroceryItem | null;
  onLogConsumption: (id: string, amount: number) => void;
  onUsedAll: (id: string) => void;
  onThrewAway: (id: string) => void;
  onEdit: (id: string, data: { name: string; category: string; expiresIn: number; quantity: number }) => void;
  onAddToShoppingList: (item: GroceryItem) => void;
}

type ViewMode = "detail" | "edit";

const categories = ["produce", "dairy", "bakery", "meat", "pantry", "frozen"];

export function ItemDetailModal({
  visible,
  onClose,
  item,
  onLogConsumption,
  onUsedAll,
  onThrewAway,
  onEdit,
  onAddToShoppingList,
}: ItemDetailModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [consumptionAmount, setConsumptionAmount] = useState(1);
  const [showDestructiveConfirm, setShowDestructiveConfirm] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState<"usedAll" | "threwAway" | null>(null);
  
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editExpiresIn, setEditExpiresIn] = useState(7);
  const [editQuantity, setEditQuantity] = useState(1);

  useEffect(() => {
    if (visible && item) {
      setViewMode("detail");
      setConsumptionAmount(item.usedAmount);
      setEditName(item.name);
      setEditCategory(item.category);
      setEditExpiresIn(item.expiresIn);
      setEditQuantity(item.quantity);
      setShowDestructiveConfirm(false);
      setDestructiveAction(null);
    }
  }, [visible, item]);

  if (!item) return null;

  const handleLogConsumption = () => {
    const amountToAdd = consumptionAmount - item.usedAmount;
    if (amountToAdd > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLogConsumption(item.id, amountToAdd);
    }
    onClose();
  };

  const handleUsedAll = () => {
    setDestructiveAction("usedAll");
    setShowDestructiveConfirm(true);
  };

  const handleThrewAway = () => {
    setDestructiveAction("threwAway");
    setShowDestructiveConfirm(true);
  };

  const confirmDestructiveAction = () => {
    if (destructiveAction === "usedAll") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUsedAll(item.id);
    } else if (destructiveAction === "threwAway") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onThrewAway(item.id);
    }
    setShowDestructiveConfirm(false);
    setDestructiveAction(null);
    onClose();
  };

  const cancelDestructiveAction = () => {
    setShowDestructiveConfirm(false);
    setDestructiveAction(null);
  };

  const handleSaveEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(item.id, {
      name: editName,
      category: editCategory,
      expiresIn: editExpiresIn,
      quantity: editQuantity,
    });
    setViewMode("detail");
  };

  const handleAddToShoppingList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddToShoppingList(item);
    onClose();
  };

  const getExpirationColor = () => {
    if (item.expiresIn <= 0) return theme.expiredRed;
    if (item.expiresIn <= 2) return theme.expiringOrange;
    if (item.expiresIn <= 5) return theme.expiringYellow;
    return theme.backgroundSecondary;
  };

  const getExpirationText = () => {
    if (item.expiresIn < 0) return `Expired ${Math.abs(item.expiresIn)}d ago`;
    if (item.expiresIn === 0) return "Expires today";
    if (item.expiresIn === 1) return "Expires tomorrow";
    return `Expires in ${item.expiresIn} days`;
  };

  const renderDetailView = () => (
    <>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <ThemedText type="h2" style={styles.itemName}>{item.name}</ThemedText>
          <View style={styles.iconActions}>
            <Pressable
              onPress={() => setViewMode("edit")}
              style={[styles.iconButton, { backgroundColor: theme.backgroundDefault }]}
              testID="button-edit-item"
            >
              <Feather name="edit-2" size={18} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={handleAddToShoppingList}
              style={[styles.iconButton, { backgroundColor: theme.text }]}
              testID="button-add-to-list"
            >
              <Feather name="shopping-cart" size={18} color={theme.buttonText} />
            </Pressable>
          </View>
        </View>
        <View style={styles.itemMeta}>
          <Badge label={item.category} variant="category" category={item.category} />
          <View style={[styles.expirationBadge, { backgroundColor: getExpirationColor() }]}>
            <ThemedText type="caption" style={styles.expirationText}>
              {getExpirationText()}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          {item.quantity} {item.unit} in {item.storageLocation}
        </ThemedText>
      </View>

      <View style={[styles.section, { borderColor: theme.divider }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Log Consumption
        </ThemedText>
        <Slider
          value={consumptionAmount}
          onValueChange={setConsumptionAmount}
          min={0}
          max={10}
          step={1}
          showLabel
        />
        <View style={styles.consumptionActions}>
          <Pressable
            onPress={handleThrewAway}
            style={[styles.actionButton, { borderColor: theme.divider }]}
          >
            <Feather name="trash-2" size={16} color={theme.text} />
            <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
              THREW AWAY
            </ThemedText>
          </Pressable>
        </View>
        <Button onPress={handleLogConsumption} style={styles.logButton}>
          SAVE
        </Button>
      </View>
    </>
  );

  const renderEditView = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.field}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Product Name
        </ThemedText>
        <TextInput
          value={editName}
          onChangeText={setEditName}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: theme.divider,
            },
          ]}
          placeholderTextColor={theme.textSecondary}
          placeholder="Enter product name"
          testID="input-name"
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Category
        </ThemedText>
        <View style={styles.categoryOptions}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setEditCategory(cat)}
              style={[
                styles.categoryOption,
                {
                  backgroundColor: editCategory === cat ? theme.text : theme.backgroundDefault,
                  borderColor: theme.divider,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: editCategory === cat ? theme.buttonText : theme.text }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Quantity
        </ThemedText>
        <View style={styles.quantityControls}>
          <Pressable
            onPress={() => setEditQuantity(Math.max(1, editQuantity - 1))}
            style={[styles.quantityButton, { borderColor: theme.divider }]}
          >
            <Feather name="minus" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="h4" style={styles.quantityText}>
            {editQuantity}
          </ThemedText>
          <Pressable
            onPress={() => setEditQuantity(editQuantity + 1)}
            style={[styles.quantityButton, { borderColor: theme.divider }]}
          >
            <Feather name="plus" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Expires In (days)
        </ThemedText>
        <View style={styles.quantityControls}>
          <Pressable
            onPress={() => setEditExpiresIn(Math.max(0, editExpiresIn - 1))}
            style={[styles.quantityButton, { borderColor: theme.divider }]}
          >
            <Feather name="minus" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="h4" style={styles.quantityText}>
            {editExpiresIn}d
          </ThemedText>
          <Pressable
            onPress={() => setEditExpiresIn(editExpiresIn + 1)}
            style={[styles.quantityButton, { borderColor: theme.divider }]}
          >
            <Feather name="plus" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.editActions}>
        <Pressable
          onPress={() => setViewMode("detail")}
          style={[styles.cancelButton, { borderColor: theme.divider }]}
        >
          <ThemedText type="bodyMedium">Cancel</ThemedText>
        </Pressable>
        <Button onPress={handleSaveEdit} style={styles.saveButton}>
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            {viewMode === "edit" ? (
              <ThemedText type="h3">Edit Item</ThemedText>
            ) : (
              <View />
            )}
            <Pressable onPress={onClose} style={styles.closeButton} testID="button-close-modal">
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {viewMode === "detail" ? renderDetailView() : renderEditView()}
        </View>
      </KeyboardAvoidingView>

      {showDestructiveConfirm ? (
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={styles.confirmTitle}>
              {destructiveAction === "threwAway" ? "Throw Away Item?" : "Mark as Fully Used?"}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              {destructiveAction === "threwAway"
                ? `Are you sure you want to throw away "${item.name}"? This will remove it from your pantry.`
                : `Are you sure you want to mark "${item.name}" as fully used? This will remove it from your pantry.`}
            </ThemedText>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={cancelDestructiveAction}
                style={[styles.confirmButton, { borderColor: theme.divider }]}
              >
                <ThemedText type="bodyMedium">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={confirmDestructiveAction}
                style={[
                  styles.confirmButton, 
                  { 
                    backgroundColor: destructiveAction === "threwAway" ? "#E53935" : theme.text,
                    borderColor: destructiveAction === "threwAway" ? "#E53935" : theme.text,
                  }
                ]}
              >
                <ThemedText type="bodyMedium" style={{ color: "#FFF" }}>
                  {destructiveAction === "threwAway" ? "Throw Away" : "Confirm"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D1D1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  itemInfo: {
    marginBottom: Spacing.xl,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemName: {
    flex: 1,
    marginRight: Spacing.md,
  },
  iconActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  expirationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  expirationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  section: {
    borderTopWidth: 1,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  consumptionActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  logButton: {
    backgroundColor: Colors.light.text,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 80,
    textAlign: "center",
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  saveButton: {
    flex: 1,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  confirmModal: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
  },
  confirmTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  confirmActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
});
