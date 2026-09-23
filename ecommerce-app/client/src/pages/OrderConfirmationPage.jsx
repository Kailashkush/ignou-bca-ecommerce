/** Success screen shown immediately after an order is accepted. */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api/endpoints';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { formatCurrency, formatDate } from '../utils/format';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    orderApi.get(id).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="container"><Alert message={error} /></div>;
  if (!order) return <div className="container"><Loader label="Fetching your order…" /></div>;

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="step-indicator">
        <span className="step done"><span className="step-num">✓</span> Cart</span>
        <span className="step-sep" />
        <span className="step done"><span className="step-num">✓</span> Address &amp; payment</span>
        <span className="step-sep" />
        <span className="step active"><span className="step-num">3</span> Confirmation</span>
      </div>

      <div className="panel center" style={{ marginBottom: 20 }}>
        <div style={{
          width: 62, height: 62, borderRadius: '50%', margin: '0 auto 16px',
          background: 'var(--success-50)', color: 'var(--success-600)',
          display: 'grid', placeItems: 'center', fontSize: 30,
        }} aria-hidden="true">
          ✓
        </div>

        <h1 style={{ marginBottom: 6 }}>Thank you for your order</h1>
        <p className="muted">
          We have received your order and will send updates as it progresses.
        </p>

        <div className="row" style={{ justifyContent: 'center', gap: 22, flexWrap: 'wrap', marginTop: 18 }}>
          <div>
            <div className="small muted">Invoice number</div>
            <div className="strong" style={{ fontFamily: 'monospace' }}>{order.invoiceNo}</div>
          </div>
          <div>
            <div className="small muted">Order date</div>
            <div className="strong">{formatDate(order.placedAt)}</div>
          </div>
          <div>
            <div className="small muted">Amount</div>
            <div className="strong">{formatCurrency(order.totalPrice)}</div>
          </div>
          <div>
            <div className="small muted">Payment</div>
            <div className="strong">
              {order.payment.method === 'COD' ? 'Cash on delivery' : `Card ending ${order.payment.cardLast4}`}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Items in this order</h3>
        {order.items.map((item) => (
          <div className="row-between" key={String(item.product)} style={{ padding: '9px 0' }}>
            <div>
              <div className="strong small">{item.title}</div>
              <div className="small muted">{formatCurrency(item.unitPrice)} × {item.quantity}</div>
            </div>
            <div className="strong small">{formatCurrency(item.lineTotal)}</div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--ink-100)', marginTop: 10, paddingTop: 10 }}>
          <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(order.itemsTotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{order.shippingFee === 0 ? 'Free' : formatCurrency(order.shippingFee)}</span></div>
          <div className="summary-row"><span>GST</span><span>{formatCurrency(order.taxAmount)}</span></div>
          <div className="summary-row total"><span>Total paid</span><span>{formatCurrency(order.totalPrice)}</span></div>
        </div>

        <h3 className="panel-title" style={{ marginTop: 22 }}>Delivering to</h3>
        <address className="small" style={{ fontStyle: 'normal', lineHeight: 1.7 }}>
          <strong>{order.shippingAddress.fullName}</strong><br />
          {order.shippingAddress.line1}<br />
          {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
          {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}<br />
          Phone: {order.shippingAddress.phone}
        </address>
      </div>

      <div className="row" style={{ marginTop: 20, justifyContent: 'center' }}>
        <Link to={`/orders/${order._id}`} className="btn btn-secondary">View order details</Link>
        <Link to="/products" className="btn">Continue shopping</Link>
      </div>
    </div>
  );
}
