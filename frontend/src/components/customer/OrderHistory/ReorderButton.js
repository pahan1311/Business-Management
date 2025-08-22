import React, { useState } from 'react';
import { orderAPI } from '../../../services/api';
import Button from '../../common/Button';

const ReorderButton = ({ originalOrder, onReorderSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleReorder = async () => {
    if (!originalOrder || !originalOrder.items) {
      console.error('Invalid order data for reorder');
      return;
    }

    setLoading(true);
    try {
      // Create new order with same items
      const reorderData = {
        customerId: originalOrder.customerId,
        items: originalOrder.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        deliveryAddress: originalOrder.deliveryAddress,
        notes: `Reorder from Order #${originalOrder.id}`,
        status: 'pending'
      };

      const response = await orderAPI.create(reorderData);
      
      if (onReorderSuccess) {
        onReorderSuccess(response.data);
      }

      // Show success message
      alert(`Order placed successfully! New Order ID: #${response.data.id}`);
    } catch (error) {
      console.error('Failed to reorder:', error);
      alert('Failed to place reorder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReorder = () => {
    const itemsList = originalOrder.items.map(item => 
      `• ${item.name} (Qty: ${item.quantity})`
    ).join('\n');

    const confirmed = window.confirm(
      `Are you sure you want to reorder these items?\n\n${itemsList}\n\nTotal items: ${originalOrder.items.length}`
    );

    if (confirmed) {
      handleReorder();
    }
  };

  if (!originalOrder || originalOrder.status !== 'delivered') {
    return null;
  }

  return (
    <Button
      variant="outline-primary"
      size="sm"
      loading={loading}
      onClick={confirmReorder}
      className="w-100"
    >
      <i className="bi bi-arrow-repeat me-2"></i>
      Reorder
    </Button>
  );
};

export default ReorderButton;
