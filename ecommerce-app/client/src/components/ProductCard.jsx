/**
 * Catalogue tile.
 *
 * Kept deliberately presentational: it receives a product and an `onAdd`
 * callback and owns no data fetching of its own, which is what lets the same
 * component appear on the home page, the listing page and the related-items
 * strip without modification.
 */
import { Link } from 'react-router-dom';
import { formatCurrency, onImageError } from '../utils/format';

export default function ProductCard({ product, onAdd }) {
  const outOfStock = product.stockCount <= 0;
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="thumb" tabIndex={-1} aria-hidden="true">
        <img
          src={product.imageUrl || '/placeholder.svg'}
          alt=""
          loading="lazy"
          onError={onImageError}
        />
        {discount > 0 && !outOfStock && <span className="thumb-flag">{discount}% OFF</span>}
        {outOfStock && <div className="thumb-veil">OUT OF STOCK</div>}
      </Link>

      <div className="body">
        {product.brand && <div className="eyebrow">{product.brand}</div>}

        <h3 className="title">
          <Link to={`/products/${product._id}`} style={{ color: 'inherit' }}>
            {product.title}
          </Link>
        </h3>

        {product.rating > 0 && (
          <div className="row" style={{ gap: 6 }}>
            <span className="rating-pill">{product.rating.toFixed(1)} ★</span>
            <span className="small muted">({product.ratingCount})</span>
          </div>
        )}

        <div className="price-row">
          <span className="price">{formatCurrency(product.price)}</span>
          {discount > 0 && (
            <>
              <span className="price-mrp">{formatCurrency(product.mrp)}</span>
              <span className="price-off">{discount}% off</span>
            </>
          )}
        </div>

        {onAdd && (
          <button
            type="button"
            className="btn btn-sm btn-block"
            disabled={outOfStock}
            onClick={() => onAdd(product)}
          >
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        )}
      </div>
    </article>
  );
}
