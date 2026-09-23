/**
 * Landing page: hero banner, category shortcuts and a strip of new arrivals.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Loader';
import Alert from '../components/Alert';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Both requests are independent, so they are issued together rather
        // than one after the other.
        const [cats, products] = await Promise.all([
          catalogApi.listCategories(),
          catalogApi.listProducts({ limit: 8, sort: 'newest' }),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setNewArrivals(products.items);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleAdd = (product) => {
    addItem(product, 1);
    toast.success(`${product.title} added to your cart.`);
  };

  return (
    <div className="container">
      {/* --- Hero ---------------------------------------------------------- */}
      <section
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '48px 36px',
          marginBottom: 36,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: 14 }}>
            Free delivery on orders above ₹500
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#fff', marginBottom: 12 }}>
            Everything you need, delivered to your door.
          </h1>
          <p style={{ fontSize: '1.02rem', opacity: 0.92, marginBottom: 24 }}>
            Browse thousands of products across electronics, fashion, home essentials and more —
            with secure checkout and live stock availability on every item.
          </p>
          <Link to="/products" className="btn btn-secondary">Start shopping →</Link>
        </div>
      </section>

      <Alert message={error} onDismiss={() => setError(null)} />

      {/* --- Category shortcuts -------------------------------------------- */}
      {categories.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="page-header">
            <h2>Shop by category</h2>
            <Link to="/products" className="small">View all products →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 14 }}>
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
                className="card card-pad"
                style={{ textAlign: 'center', color: 'inherit' }}
              >
                <div className="strong">{category.name}</div>
                <div className="small muted">{category.productCount} item{category.productCount === 1 ? '' : 's'}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* --- New arrivals --------------------------------------------------- */}
      <section>
        <div className="page-header">
          <h2>New arrivals</h2>
          <Link to="/products?sort=newest" className="small">See more →</Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="product-grid">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
