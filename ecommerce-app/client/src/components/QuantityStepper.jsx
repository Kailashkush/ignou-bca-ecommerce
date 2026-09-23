/**
 * Quantity control shared by the product page and the cart.
 * The upper bound is the lesser of the per-order cap and the stock on hand,
 * so the control cannot be used to request more than can be supplied.
 */
export default function QuantityStepper({ value, onChange, max = 10, disabled = false }) {
  const ceiling = Math.max(1, Math.min(max, 10));

  return (
    <div className="qty-stepper">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="qty-value" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= ceiling}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
