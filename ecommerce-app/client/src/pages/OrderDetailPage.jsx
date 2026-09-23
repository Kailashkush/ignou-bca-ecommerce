/**
 * Full order record with its status timeline and a cancellation action.
 * Cancellation is offered only while the server would accept it, so the
 * button is never shown for an order that has already shipped.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { formatCurrency, formatDateTime, statusTone, paymentTone } from '../utils/format';

const CANCELLABLE = ['PENDING', 'CONFIRMED'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    orderApi.get(id).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  const cancelOrder = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Cancel this order? The items will be returned to the catalogue.')) return;

    setCancelling(true);
    try {
      const updated = await orderApi.cancel(id, 'Cancelled by the customer.');
      setOrder(updated);
      toast.success('Your order has been cancelled.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (error && !order) return <div className="container"><Alert message={error} /></div>;
  if (!order) return <div className="container"><Loader label="Loading order…" /></div>;

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <Link to="/orders" className="small">← Back to my orders</Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Order {order.invoiceNo}</h1>
          <p className="muted small" style={{ margin: 0 }}>Placed on {formatDateTime(order.placedAt)}</p>
        </div>
        <div className="row">
          <span className={`badge ${statusTone(order.status)}`}>{order.status}</span>
          <span className={`badge ${paymentTone(order.payment.status)}`}>
            Payment: {order.payment.status}
          </span>
        </div>
      </div>

      <Alert message={error} onDismiss={() => setError(null)} />

      <div className="cart-layout">
        <div className="stack">
          <section className="panel">
            <h3 className="panel-title">Items</h3>
            {order.items.map((item) => (
              <div className="row-between" key={String(item.product)}
                style={{ padding: '10px 0', borderBottom: '1px solid var(--ink-100)' }}>
                <div>
                  <div className="strong small">{item.title}</div>
                  <div className="small muted">{formatCurrency(item.unitPrice)} × {item.quantity}</div>
                </div>
                <div className="strong small">{formatCurrency(item.lineTotal)}</div>
              </div>
            ))}

            <div style={{ paddingTop: 12 }}>
              <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(order.itemsTotal)}</span></div>
              <div className="summary-row"><span>Delivery</span><span>{order.shippingFee === 0 ? 'Free' : formatCurrency(order.shippingFee)}</span></div>
              <div className="summary-row"><span>GST</span><span>{formatCurrency(order.taxAmount)}</span></div>
              <div className="summary-row total"><span>Total</span><span>{formatCurrency(order.totalPrice)}</span></div>
            </div>
          </section>

          <section className="panel">
            <h3 className="panel-title">Status history</h3>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {order.statusHistory.map((entry, index) => (
                <li key={index} className="row" style={{ alignItems: 'flex-start', gap: 12, paddingBottom: 14 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                    background: index === order.statusHistory.length - 1 ? 'var(--brand-600)' : 'var(--ink-200)',
                  }} aria-hidden="true" />
                  <div>
                    <div className="strong small">{entry.status}</div>
                    <div className="small muted">{formatDateTime(entry.changedAt)}</div>
                    {entry.note && <div className="small">{entry.note}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="summary-panel stack">
          <section className="panel">
            <h3 className="panel-title">Delivery address</h3>
            <address className="small" style={{ fontStyle: 'normal', lineHeight: 1.75, margin: 0 }}>
              <strong>{order.shippingAddress.fullName}</strong><br />
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
              {order.shippingAddress.city}, {order.shippingAddress.state}<br />
              {order.shippingAddress.pincode}<br />
              Phone: {order.shippingAddress.phone}
            </address>
          </section>

          <section className="panel">
            <h3 className="panel-title">Payment</h3>
            <dl className="spec-list" style={{ margin: 0 }}>
              <div className="spec-row"><dt>Method</dt>
                <dd>{order.payment.method === 'COD' ? 'Cash on delivery' : 'Card'}</dd></div>
              {order.payment.cardLast4 && (
                <div className="spec-row"><dt>Card</dt><dd>•••• {order.payment.cardLast4}</dd></div>
              )}
              {order.payment.transactionId && (
                <div className="spec-row"><dt>Reference</dt>
                  <dd style={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                    {order.payment.transactionId}
                  </dd></div>
              )}
              <div className="spec-row"><dt>Status</dt><dd>{order.payment.status}</dd></div>
            </dl>
          </section>

          {CANCELLABLE.includes(order.status) && (
            <button type="button" className="btn btn-danger btn-block"
              onClick={cancelOrder} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel this order'}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
