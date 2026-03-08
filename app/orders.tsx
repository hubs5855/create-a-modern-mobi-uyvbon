
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@/utils/i18n';

interface Order {
  id: string;
  order_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_address: string | null;
  delivery_address: string;
  delivery_status: string;
  created_at: string;
  updated_at: string;
}

type DeliveryStatus = 'pending' | 'on_the_way' | 'delivered' | 'cancelled';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    console.log('OrdersScreen: Component mounted');
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('OrdersScreen: Fetching orders from Supabase');
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('OrdersScreen: No user logged in');
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log('OrdersScreen: User ID:', user.id);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('OrdersScreen: Error fetching orders:', error);
        throw error;
      }

      console.log('OrdersScreen: Fetched orders:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('OrdersScreen: Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('OrdersScreen: User triggered refresh');
    setRefreshing(true);
    fetchOrders();
  };

  const handleDeleteOrder = (order: Order) => {
    console.log('OrdersScreen: User tapped delete for order:', order.order_id);
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) {
      console.log('OrdersScreen: No order selected for deletion');
      return;
    }

    try {
      console.log('OrdersScreen: Deleting order:', selectedOrder.order_id);
      setDeleteLoading(true);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', selectedOrder.id);

      if (error) {
        console.error('OrdersScreen: Error deleting order:', error);
        throw error;
      }

      console.log('OrdersScreen: Order deleted successfully');
      setOrders(orders.filter(o => o.id !== selectedOrder.id));
      setShowDeleteModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('OrdersScreen: Failed to delete order:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: colors.warning,
      on_the_way: colors.primary,
      delivered: colors.success,
      cancelled: colors.error,
    };
    return statusMap[status] || colors.text;
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: t('pending'),
      on_the_way: t('onTheWay'),
      delivered: t('delivered'),
      cancelled: t('cancelled'),
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('justNow');
    }
    if (diffMins < 60) {
      const minsText = diffMins === 1 ? t('minute') : t('minutes');
      return `${diffMins} ${minsText} ${t('ago')}`;
    }
    if (diffHours < 24) {
      const hoursText = diffHours === 1 ? t('hour') : t('hours');
      return `${diffHours} ${hoursText} ${t('ago')}`;
    }
    if (diffDays < 7) {
      const daysText = diffDays === 1 ? t('day') : t('days');
      return `${diffDays} ${daysText} ${t('ago')}`;
    }
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.background, colors.backgroundSecondary]} style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: t('orders'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary]} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('orders'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="shippingbox"
                android_material_icon_name="inventory"
                size={80}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>{t('noOrders')}</Text>
              <Text style={styles.emptySubtitle}>{t('noOrdersDescription')}</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  console.log('OrdersScreen: User tapped create order button');
                  router.push('/delivery-mode');
                }}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={24}
                  color={colors.background}
                />
                <Text style={styles.createButtonText}>{t('createOrder')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('myOrders')}</Text>
                <Text style={styles.headerSubtitle}>
                  {orders.length} {orders.length === 1 ? t('order') : t('orders')}
                </Text>
              </View>

              {orders.map((order, index) => {
                const statusColor = getStatusColor(order.delivery_status);
                const statusText = getStatusText(order.delivery_status);
                const formattedDate = formatDate(order.created_at);

                return (
                  <View key={index} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View style={styles.orderIdContainer}>
                        <IconSymbol
                          ios_icon_name="number"
                          android_material_icon_name="tag"
                          size={20}
                          color={colors.primary}
                        />
                        <Text style={styles.orderId}>{order.order_id}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                      </View>
                    </View>

                    {order.customer_name && (
                      <View style={styles.orderRow}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={18}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.orderLabel}>{t('customer')}:</Text>
                        <Text style={styles.orderValue}>{order.customer_name}</Text>
                      </View>
                    )}

                    {order.customer_phone && (
                      <View style={styles.orderRow}>
                        <IconSymbol
                          ios_icon_name="phone.fill"
                          android_material_icon_name="phone"
                          size={18}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.orderLabel}>{t('phone')}:</Text>
                        <Text style={styles.orderValue}>{order.customer_phone}</Text>
                      </View>
                    )}

                    {order.pickup_address && (
                      <View style={styles.orderRow}>
                        <IconSymbol
                          ios_icon_name="location.fill"
                          android_material_icon_name="location-on"
                          size={18}
                          color={colors.success}
                        />
                        <Text style={styles.orderLabel}>{t('pickup')}:</Text>
                        <Text style={styles.orderValue} numberOfLines={2}>
                          {order.pickup_address}
                        </Text>
                      </View>
                    )}

                    <View style={styles.orderRow}>
                      <IconSymbol
                        ios_icon_name="location.fill"
                        android_material_icon_name="location-on"
                        size={18}
                        color={colors.error}
                      />
                      <Text style={styles.orderLabel}>{t('delivery')}:</Text>
                      <Text style={styles.orderValue} numberOfLines={2}>
                        {order.delivery_address}
                      </Text>
                    </View>

                    <View style={styles.orderRow}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={18}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.orderLabel}>{t('created')}:</Text>
                      <Text style={styles.orderValue}>{formattedDate}</Text>
                    </View>

                    <View style={styles.orderActions}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteOrder(order)}
                      >
                        <IconSymbol
                          ios_icon_name="trash.fill"
                          android_material_icon_name="delete"
                          size={20}
                          color={colors.error}
                        />
                        <Text style={styles.deleteButtonText}>{t('delete')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('deleteOrder')}</Text>
            <Text style={styles.modalMessage}>
              {t('deleteOrderConfirm')} {selectedOrder?.order_id}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  console.log('OrdersScreen: User cancelled delete');
                  setShowDeleteModal(false);
                  setSelectedOrder(null);
                }}
                disabled={deleteLoading}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.confirmButtonText}>{t('delete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  orderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  orderValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.error + '20',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
