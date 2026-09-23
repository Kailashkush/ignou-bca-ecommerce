/**
 * Shopping cart.
 *
 * The totals shown here are computed locally so the figures respond instantly
 * to a quantity change. They are clearly labelled as an estimate, because the
 * binding total is the one the server returns at checkout.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import QuantityStepper from '../components/QuantityStepper';
import EmptyState from '../components/EmptyState';
import { formatCurrency, onImageError } from '../utils/format';

const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 49;
const TAX_RATE = 0.18;

export default function CartPage() {
  const { items, setQuantity, removeItem, clearCart, estimatedTotal, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Browse the catalogue and add something you like."
          action={<Link to="/products" className="btn">Start shopping</Link>}
        />
      </div>
    );
  }

  const shippingFee = estimatedTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxAmount = Math.round(estimatedTotal * TAX_RATE);
  const payable = estimatedTotal + shippingFee + taxAmount;
  const shortfall = FREE_SHIPPING_THRESHOLD - estimatedTotal;

  const proceed = () => {
    // Unauthenticated visitors are sent to sign in and returned here
    // afterwards, so the cart they built is not lost.
    navigate(isAuthenticated ? '/checkout' : '/login', {
      state: isAuthenticated ? undefined : { from: { pathname: '/checkout' } },
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Shopping cart</h1>
        <span className="muted">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
      </div>

      <div className="cart-layout">
        <div className="panel">
          {items.map((line) => (
            <div className="cart-line" key={line.productId}>
              <Link to={`/products/${line.productId}`}>
                <img src={line.imageUrl || '/placeholder.svg'} alt="" onError={onImageError} />
              </Link>

              <div>
                <Link to={`/products/${line.productId}`} className="strong" style={{ color: 'inherit' }}>
                  {line.title}
                </Link>
                <div className="small muted" style={{ marginBottom: 8 }}>
                  {formatCurrency(line.price)} each
                </div>

                <div className="row wrap line-actions">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(q) => setQuantity(line.productId, q)}
                    max={Math.min(10, line.stockCount ?? 10)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeItem(line.productId)}
                    style={{ color: 'var(--danger-600)' }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="strong nowrap" style={{ fontSize: '1.02rem' }}>
                {formatCurrency(line.price * line.quantity)}
              </div>
            </div>
          ))}

          <div className="row-between" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ink-100)' }}>
            <Link to="/products" className="btn btn-ghost btn-sm">← Continue shopping</Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearCart}
              style={{ color: 'var(--danger-600)' }}>
              Empty cart
            </button>
          </div>
        </div>

        <aside className="summary-panel">
          <div className="panel">
            <h3 className="panel-title">Order summary</h3>

            <div className="summary-row">
              <span>Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})</span>
              <span>{formatCurrency(estimatedTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{shippingFee === 0 ? <em style={{ color: 'var(--success-600)' }}>Free</em> : formatCurrency(shippingFee)}</span>
            </div>
            <div className="summary-row">
              <span>GST (18%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="summary-row total">
              <span>Estimated total</span>
              <span>{formatCurrency(payable)}</span>
            </div>

            {shortfall > 0 && (
              <div className="alert alert-info small" style={{ marginTop: 14, marginBottom: 0 }}>
                Add {formatCurrency(shortfall)} more to qualify for free delivery.
              </div>
            )}

            <button type="button" className="btn btn-block" onClick={proceed} style={{ marginTop: 16 }}>
              Proceed to checkout
            </button>

            <p className="small muted center" style={{ marginTop: 10, marginBottom: 0 }}>
              The final amount is confirmed on the checkout page.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
