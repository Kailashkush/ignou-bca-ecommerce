/** Presentation helpers shared across screens. */

/** Formats a whole-rupee amount in the Indian numbering system: ₹1,23,456 */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

/** Maps an order status onto the badge class that colours it. */
export const statusTone = (status) => ({
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  SHIPPED: 'badge-brand',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
}[status] || 'badge');

export const paymentTone = (status) => ({
  PAID: 'badge-success',
  PENDING: 'badge-warning',
  FAILED: 'badge-danger',
  REFUNDED: 'badge-info',
}[status] || 'badge');

/** Replaces a broken remote image with the bundled placeholder. */
export const onImageError = (event) => {
  if (event.target.dataset.fallbackApplied) return; // guard against a loop
  event.target.dataset.fallbackApplied = 'true';
  event.target.src = '/placeholder.svg';
};
