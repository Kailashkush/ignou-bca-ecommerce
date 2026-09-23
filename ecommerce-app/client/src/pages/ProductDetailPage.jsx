/**
 * Single product page: gallery, specification, add-to-cart and related items.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { catalogApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import QuantityStepper from '../components/QuantityStepper';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { formatCurrency, onImageError } from '../utils/format';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addItem, isInCart } = useCart();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setQuantity(1);
    window.scrollTo({ top: 0 });

    catalogApi.getProduct(id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        // Related items are a nice-to-have: a failure here must not blank the
        // page, so the rejection is swallowed.
        catalogApi.getRelated(id).then(setRelated).catch(() => setRelated([]));
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="container"><Loader label="Loading product…" /></div>;

  if (error || !product) {
    return (
      <div className="container">
        <Alert message={error || 'This product is no longer available.'} />
        <Link to="/products" className="btn btn-secondary">← Back to the catalogue</Link>
      </div>
    );
  }

  const outOfStock = product.stockCount <= 0;
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const lowStock = !outOfStock && product.stockCount <= 5;

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success(`${quantity} × ${product.title} added to your cart.`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate('/cart');
  };

  return (
    <div className="container">
      <nav className="small muted" style={{ marginBottom: 18 }} aria-label="Breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">/</span>{' '}
        <Link to="/products">Products</Link>{' '}
        {product.category && (
          <>
            <span aria-hidden="true">/</span>{' '}
            <Link to={`/products?category=${product.category._id}`}>{product.category.name}</Link>{' '}
          </>
        )}
        <span aria-hidden="true">/</span> <span>{product.title}</span>
      </nav>

      <div className="detail-layout">
        <div className="detail-gallery">
          <img
            src={product.imageUrl || '/placeholder.svg'}
            alt={product.title}
            onError={onImageError}
          />
        </div>

        <div>
          {product.brand && <div className="eyebrow muted small strong">{product.brand}</div>}
          <h1>{product.title}</h1>

          <div className="row wrap" style={{ marginBottom: 14 }}>
            {product.rating > 0 && (
              <>
                <span className="rating-pill">{product.rating.toFixed(1)} ★</span>
                <span className="small muted">{product.ratingCount} ratings</span>
              </>
            )}
            {product.category && <span className="badge badge-brand">{product.category.name}</span>}
          </div>

          <div className="row wrap" style={{ alignItems: 'baseline', marginBottom: 6 }}>
            <span className="detail-price">{formatCurrency(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="price-mrp" style={{ fontSize: '1rem' }}>{formatCurrency(product.mrp)}</span>
                <span className="price-off" style={{ fontSize: '0.95rem' }}>{discount}% off</span>
              </>
            )}
          </div>
          <p className="small muted">Inclusive of all taxes. Free delivery on orders above ₹500.</p>

          <div style={{ margin: '18px 0' }}>
            {outOfStock ? (
              <span className="badge badge-danger">Out of stock</span>
            ) : lowStock ? (
              <span className="badge badge-warning">Only {product.stockCount} left in stock</span>
            ) : (
              <span className="badge badge-success">In stock — {product.stockCount} available</span>
            )}
          </div>

          {!outOfStock && (
            <div className="row wrap" style={{ marginBottom: 18 }}>
              <span className="small strong">Quantity</span>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={Math.min(10, product.stockCount)}
              />
            </div>
          )}

          <div className="row wrap" style={{ marginBottom: 26 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAdd}
              disabled={outOfStock}
              style={{ minWidth: 160 }}
            >
              {isInCart(product._id) ? 'Add more to cart' : 'Add to cart'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleBuyNow}
              disabled={outOfStock}
              style={{ minWidth: 160 }}
            >
              Buy now
            </button>
          </div>

          <section className="panel">
            <h3 className="panel-title">Product description</h3>
            <p style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>{product.description}</p>

            <dl className="spec-list" style={{ marginTop: 20, marginBottom: 0 }}>
              <div className="spec-row"><dt>Brand</dt><dd>{product.brand || '—'}</dd></div>
              <div className="spec-row"><dt>Category</dt><dd>{product.category?.name || '—'}</dd></div>
              <div className="spec-row"><dt>Availability</dt><dd>{outOfStock ? 'Out of stock' : `${product.stockCount} units`}</dd></div>
              <div className="spec-row"><dt>Item code</dt><dd style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>{product._id}</dd></div>
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2>You may also like</h2>
          <div className="product-grid">
            {related.map((item) => <ProductCard key={item._id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
