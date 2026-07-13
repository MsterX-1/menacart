import type { Order } from '../types/order';

export const getDisplayStatus = (order: Order): string => {
  if (order.status !== 'Confirmed') {
    return order.status;
  }

  const subStatuses = order.subOrders.map((sub) => sub.status);
  if (subStatuses.length === 0) {
    return 'Confirmed';
  }

  if (subStatuses.every((s) => s === 'Delivered')) {
    return 'Completed';
  }

  if (subStatuses.every((s) => s === 'Shipped' || s === 'Delivered')) {
    return 'Shipped';
  }

  if (subStatuses.some((s) => s === 'Shipped' || s === 'Delivered')) {
    return 'Partially Shipped';
  }

  if (subStatuses.some((s) => s === 'Processing')) {
    return 'Processing';
  }

  return 'Confirmed';
};
