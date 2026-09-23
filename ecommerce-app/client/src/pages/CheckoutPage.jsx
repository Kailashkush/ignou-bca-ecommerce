/**
 * Checkout: shipping address, payment method and order placement.
 *
 * On mount the cart is sent to `/api/orders/quote`, which re-prices it from
 * the database. The figure the visitor agrees to is therefore the server's
 * figure, not one computed in the browser, and any item that sold out while
 * the cart sat idle is reported before payment details are entered.
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { formatCurrency, onImageError } from '../utils/format';

const CURRENT_YEAR = new Date().getFullYear();

export default function CheckoutPage() {
  const { items, toOrderItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState([]);

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    line1: user?.address?.line1 || '',
    line2: user?.address?.line2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
    phone: user?.address?.phone || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [card, setCard] = useState({
    number: '', holderName: '', expiryMonth: '', expiryYear: '', cvv: '',
  });

  // --- Re-price the cart on the server -------------------------------------
  useEffect(() => {
    if (items.length === 0) { setLoadingQuote(false); return undefined; }

    let cancelled = false;
    setLoadingQuote(true);

    orderApi.quote(toOrderItems())
      .then((data) => { if (!cancelled) { setQuote(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoadingQuote(false); });

    return () => { cancelled = true; };
    // `items` is the dependency: if the visitor edits the cart in another tab
    // and returns, the quote is taken again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon="🛒"
          title="There is nothing to check out"
          message="Add a product to your cart first."
          action={<Link to="/products" className="btn">Browse products</Link>}
        />
      </div>
    );
  }

  const updateAddress = (field) => (event) =>
    setAddress((current) => ({ ...current, [field]: event.target.value }));

  const updateCard = (field) => (event) =>
    setCard((current) => ({ ...current, [field]: event.target.value }));

  /**
   * Client-side pre-checks. These exist to give immediate feedback, not to
   * secure anything: the same rules are enforced again by the API.
   */
  const validate = () => {
    const problems = [];
    if (address.fullName.trim().length < 2) problems.push({ field: 'fullName', message: 'Enter the recipient’s name.' });
    if (address.line1.trim().length < 3) problems.push({ field: 'line1', message: 'Enter the street address.' });
    if (address.city.trim().length < 2) problems.push({ field: 'city', message: 'Enter the city.' });
    if (address.state.trim().length < 2) problems.push({ field: 'state', message: 'Enter the state.' });
    if (!/^\d{6}$/.test(address.pincode)) problems.push({ field: 'pincode', message: 'Pincode must be exactly 6 digits.' });
    if (!/^[6-9]\d{9}$/.test(address.phone)) problems.push({ field: 'phone', message: 'Enter a valid 10-digit mobile number.' });

    if (paymentMethod === 'CARD') {
      const digits = card.number.replace(/[\s-]/g, '');
      if (!/^\d{13,19}$/.test(digits)) problems.push({ field: 'card number', message: 'Card number must be 13 to 19 digits.' });
      if (!/^\d{3,4}$/.test(card.cvv)) problems.push({ field: 'cvv', message: 'CVV must be 3 or 4 digits.' });
      if (card.holderName.trim().length < 2) problems.push({ field: 'card holder', message: 'Enter the name printed on the card.' });
      if (!card.expiryMonth || !card.expiryYear) problems.push({ field: 'expiry', message: 'Select the card expiry date.' });
    }
    return problems;
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    const problems = validate();
    if (problems.length > 0) {
      setError('Please correct the highlighted fields.');
      setDetails(problems);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError(null);
    setDetails([]);

    try {
      const payload = {
        items: toOrderItems(),
        shippingAddress: address,
        paymentMethod,
      };

      if (paymentMethod === 'CARD') {
        payload.card = {
          number: card.number.replace(/[\s-]/g, ''),
          holderName: card.holderName.trim(),
          expiryMonth: Number(card.expiryMonth),
          expiryYear: Number(card.expiryYear),
          cvv: card.cvv,
        };
      }

      const order = await orderApi.create(payload);

      // The cart is emptied only after the server has confirmed the order.
      clearCart();
      toast.success(`Order ${order.invoiceNo} placed successfully.`);
      navigate(`/order-confirmation/${order._id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setDetails(err.details || []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="step-indicator">
        <span className="step done"><span className="step-num">✓</span> Cart</span>
        <span className="step-sep" />
        <span className="step active"><span className="step-num">2</span> Address &amp; payment</span>
        <span className="step-sep" />
        <span className="step"><span className="step-num">3</span> Confirmation</span>
      </div>

      <h1>Checkout</h1>
      <Alert message={error} details={details} onDismiss={() => { setError(null); setDetails([]); }} />

      <form onSubmit={placeOrder}>
        <div className="cart-layout">
          <div className="stack">
            {/* --- Shipping address ------------------------------------- */}
            <section className="panel">
              <h3 className="panel-title">Delivery address</h3>

              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" className="input" value={address.fullName}
                    onChange={updateAddress('fullName')} autoComplete="name" required />
                </div>

                <div className="field full">
                  <label htmlFor="line1">Address line 1</label>
                  <input id="line1" className="input" value={address.line1}
                    onChange={updateAddress('line1')} autoComplete="address-line1"
                    placeholder="House number, street" required />
                </div>

                <div className="field full">
                  <label htmlFor="line2">Address line 2 <span className="muted">(optional)</span></label>
                  <input id="line2" className="input" value={address.line2}
                    onChange={updateAddress('line2')} autoComplete="address-line2"
                    placeholder="Landmark, area" />
                </div>

                <div className="field">
                  <label htmlFor="city">City</label>
                  <input id="city" className="input" value={address.city}
                    onChange={updateAddress('city')} autoComplete="address-level2" required />
                </div>

                <div className="field">
                  <label htmlFor="state">State</label>
                  <input id="state" className="input" value={address.state}
                    onChange={updateAddress('state')} autoComplete="address-level1" required />
                </div>

                <div className="field">
                  <label htmlFor="pincode">Pincode</label>
                  <input id="pincode" className="input" value={address.pincode}
                    onChange={updateAddress('pincode')} inputMode="numeric" maxLength={6}
                    autoComplete="postal-code" required />
                  <div className="hint">6 digits</div>
                </div>

                <div className="field">
                  <label htmlFor="phone">Mobile number</label>
                  <input id="phone" className="input" value={address.phone}
                    onChange={updateAddress('phone')} inputMode="numeric" maxLength={10}
                    autoComplete="tel-national" required />
                  <div className="hint">10 digits, starting 6–9</div>
                </div>
              </div>
            </section>

            {/* --- Payment ---------------------------------------------- */}
            <section className="panel">
              <h3 className="panel-title">Payment method</h3>

              <label className={`pay-option ${paymentMethod === 'CARD' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="CARD"
                  checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} />
                <div>
                  <div className="strong">Credit or debit card</div>
                  <div className="small muted">Pay securely now. Your card number is never stored.</div>
                </div>
              </label>

              <label className={`pay-option ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="COD"
                  checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <div>
                  <div className="strong">Cash on delivery</div>
                  <div className="small muted">Pay the courier when your parcel arrives.</div>
                </div>
              </label>

              {paymentMethod === 'CARD' && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--ink-100)' }}>
                  <div className="alert alert-info small">
                    This is a simulated gateway for the purposes of the project. No real
                    payment is taken and no card number is written to the database.
                    Use <code>4539 5787 6362 1486</code> to approve, or any number ending
                    in <code>0000</code> to see a decline.
                  </div>

                  <div className="form-grid">
                    <div className="field full">
                      <label htmlFor="cardNumber">Card number</label>
                      <input id="cardNumber" className="input" value={card.number}
                        onChange={updateCard('number')} inputMode="numeric"
                        placeholder="0000 0000 0000 0000" maxLength={23}
                        autoComplete="cc-number" />
                    </div>

                    <div className="field full">
                      <label htmlFor="cardName">Name on card</label>
                      <input id="cardName" className="input" value={card.holderName}
                        onChange={updateCard('holderName')} autoComplete="cc-name" />
                    </div>

                    <div className="field">
                      <label htmlFor="expMonth">Expiry month</label>
                      <select id="expMonth" className="select" value={card.expiryMonth}
                        onChange={updateCard('expiryMonth')} autoComplete="cc-exp-month">
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="expYear">Expiry year</label>
                      <select id="expYear" className="select" value={card.expiryYear}
                        onChange={updateCard('expiryYear')} autoComplete="cc-exp-year">
                        <option value="">Year</option>
                        {Array.from({ length: 12 }, (_, i) => CURRENT_YEAR + i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="cvv">CVV</label>
                      <input id="cvv" className="input" value={card.cvv}
                        onChange={updateCard('cvv')} inputMode="numeric" maxLength={4}
                        type="password" autoComplete="cc-csc" placeholder="•••" />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* --- Order summary ------------------------------------------ */}
          <aside className="summary-panel">
            <div className="panel">
              <h3 className="panel-title">Your order</h3>

              {loadingQuote ? (
                <Loader label="Confirming prices…" />
              ) : quote ? (
                <>
                  <div className="stack" style={{ gap: 12, marginBottom: 16 }}>
                    {items.map((line) => (
                      <div className="row" key={line.productId} style={{ gap: 10 }}>
                        <img src={line.imageUrl || '/placeholder.svg'} alt="" onError={onImageError}
                          style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="small strong" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {line.title}
                          </div>
                          <div className="small muted">Qty {line.quantity}</div>
                        </div>
                        <div className="small strong nowrap">
                          {formatCurrency(line.price * line.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--ink-100)', paddingTop: 10 }}>
                    <div className="summary-row">
                      <span>Subtotal</span><span>{formatCurrency(quote.itemsTotal)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Delivery</span>
                      <span>{quote.shippingFee === 0
                        ? <em style={{ color: 'var(--success-600)' }}>Free</em>
                        : formatCurrency(quote.shippingFee)}</span>
                    </div>
                    <div className="summary-row">
                      <span>GST (18%)</span><span>{formatCurrency(quote.taxAmount)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Amount payable</span><span>{formatCurrency(quote.totalPrice)}</span>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-block" disabled={submitting}
                    style={{ marginTop: 16 }}>
                    {submitting ? (<><span className="spinner" /> Placing order…</>)
                      : `Place order · ${formatCurrency(quote.totalPrice)}`}
                  </button>
                </>
              ) : (
                <p className="muted small">The order could not be priced. Please review your cart.</p>
              )}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
