import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { socketManager } from '../app/socket';
import { api } from '../app/api';

export const useSocket = () => {
  const dispatch = useDispatch();

  const joinRoom = useCallback((room) => {
    socketManager.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room) => {
    socketManager.leaveRoom(room);
  }, []);

  const on = useCallback((event, callback) => {
    socketManager.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    socketManager.off(event, callback);
  }, []);

  const emit = useCallback((event, data) => {
    socketManager.emit(event, data);
  }, []);

  useEffect(() => {
    // Setup global socket listeners
    const handleOrderStatusChanged = (data) => {
      dispatch(
        api.util.updateQueryData('getOrders', undefined, (draft) => {
          const order = draft.data?.find((o) => o.id === data.orderId);
          if (order) {
            order.status = data.status;
            order.updatedAt = data.updatedAt;
          }
        })
      );
    };

    const handleDeliveryStatusChanged = (data) => {
      dispatch(
        api.util.updateQueryData('getDeliveries', undefined, (draft) => {
          const delivery = draft.data?.find((d) => d.id === data.deliveryId);
          if (delivery) {
            delivery.status = data.status;
            delivery.updatedAt = data.updatedAt;
          }
        })
      );
    };

    const handleInventoryLowStock = (data) => {
      dispatch(
        api.util.updateQueryData('getProducts', undefined, (draft) => {
          const product = draft.data?.find((p) => p.id === data.productId);
          if (product) {
            product.onHand = data.onHand;
          }
        })
      );
    };

    const handleInquiryCreated = (data) => {
      dispatch(api.util.invalidateTags(['Inquiry']));
    };

    on('order.status.changed', handleOrderStatusChanged);
    on('delivery.status.changed', handleDeliveryStatusChanged);
    on('inventory.low_stock', handleInventoryLowStock);
    on('inquiry.created', handleInquiryCreated);
    on('inquiry.updated', handleInquiryCreated);

    return () => {
      off('order.status.changed', handleOrderStatusChanged);
      off('delivery.status.changed', handleDeliveryStatusChanged);
      off('inventory.low_stock', handleInventoryLowStock);
      off('inquiry.created', handleInquiryCreated);
      off('inquiry.updated', handleInquiryCreated);
    };
  }, [dispatch, on, off]);

  return {
    joinRoom,
    leaveRoom,
    on,
    off,
    emit,
  };
};
