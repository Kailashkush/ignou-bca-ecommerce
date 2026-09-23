/**
 * Catalogue listing with search, category, price and availability filters.
 *
 * Every filter lives in the URL query string rather than in component state.
 * That single decision gives shareable links, working back/forward navigation
 * and a correct page after a refresh, none of which would survive if the
 * filters were held only in memory.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { ProductGridSkeleton } from '../components/Loader';

const SORT_CHOICES = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Customer rating' },
  { value: 'name', label: 'Name (A–Z)' },
];

const PRICE_BANDS = [
  { label: 'Under ₹500', min: undefined, max: 500 },
  { label: '₹500 – ₹2,000', min: 500, max: 2000 },
  { label: '₹2,000 – ₹10,000', min: 2000, max: 10000 },
  { label: 'Above ₹10,000', min: 10000, max: undefined },
];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addItem } = useCart();
  const toast = useToast();

  // The query object sent to the API, derived from the URL.
  const query = useMemo(() => {
    const entries = {};
    for (const [key, value] of searchParams.entries()) {
      if (value) entries[key] = value;
    }
    return { limit: 12, ...entries };
  }, [searchParams]);

  useEffect(() => {
    catalogApi.listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    catalogApi.listProducts(query)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query]);

  /**
   * Writes a set of changes into the query string. Any key set to `undefined`
   * is removed, and the page resets to 1 whenever a filter changes so the
   * visitor is not stranded on a page that no longer exists.
   */
  const applyFilters = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === null || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams(new URLSearchParams());

  const handleAdd = (product) => {
    addItem(product, 1);
    toast.success(`${product.title} added to your cart.`);
  };

  const activeCategory = searchParams.get('category');
  const activeSort = searchParams.get('sort') || 'newest';
  const keyword = searchParams.get('q');
  const activeMin = searchParams.get('minPrice');
  const activeMax = searchParams.get('maxPrice');
  const hasFilters = [...searchParams.keys()].some((k) => k !== 'page');

  return (
    <div className="container">
      <div className="catalog-layout">
        {/* --- Filters ---------------------------------------------------- */}
        <aside className="filter-sidebar">
          <div className="panel" style={{ padding: 16 }}>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Filters</h3>
              {hasFilters && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>
                  Clear
                </button>
              )}
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              <button
                type="button"
                className={`filter-option ${!activeCategory ? 'active' : ''}`}
                onClick={() => applyFilters({ category: undefined })}
              >
                <span>All categories</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  className={`filter-option ${activeCategory === category._id ? 'active' : ''}`}
                  onClick={() => applyFilters({ category: category._id })}
                >
                  <span>{category.name}</span>
                  <span className="count">{category.productCount}</span>
                </button>
              ))}
            </div>

            <div className="filter-group">
              <h4>Price</h4>
              {PRICE_BANDS.map((band) => {
                const isActive = String(activeMin || '') === String(band.min ?? '')
                  && String(activeMax || '') === String(band.max ?? '');
                return (
                  <button
                    key={band.label}
                    type="button"
                    className={`filter-option ${isActive ? 'active' : ''}`}
                    onClick={() => applyFilters(
                      isActive
                        ? { minPrice: undefined, maxPrice: undefined }
                        : { minPrice: band.min, maxPrice: band.max }
                    )}
                  >
                    <span>{band.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="filter-group">
              <h4>Availability</h4>
              <label className="checkbox-row" style={{ padding: '7px 9px' }}>
                <input
                  type="checkbox"
                  checked={searchParams.get('inStock') === 'true'}
                  onChange={(e) => applyFilters({ inStock: e.target.checked ? 'true' : undefined })}
                />
                <span className="small">In stock only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* --- Results ---------------------------------------------------- */}
        <section>
          <div className="toolbar">
            <div>
              <h1 style={{ marginBottom: 2 }}>
                {keyword ? `Results for “${keyword}”` : 'All products'}
              </h1>
              <p className="muted small" style={{ margin: 0 }}>
                {loading ? 'Searching…' : `${result.pagination.total} product${result.pagination.total === 1 ? '' : 's'} found`}
              </p>
            </div>

            <div className="row">
              <label htmlFor="sort" className="small muted nowrap">Sort by</label>
              <select
                id="sort"
                className="select"
                style={{ width: 'auto', minWidth: 178 }}
                value={activeSort}
                onChange={(e) => applyFilters({ sort: e.target.value })}
              >
                {SORT_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>{choice.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Alert message={error} onDismiss={() => setError(null)} />

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : result.items.length === 0 ? (
            <EmptyState
              icon="⌕"
              title="No products matched your search"
              message="Try a different keyword, or widen the filters on the left."
              action={hasFilters && (
                <button type="button" className="btn btn-secondary" onClick={clearAll}>
                  Clear all filters
                </button>
              )}
            />
          ) : (
            <>
              <div className="product-grid">
                {result.items.map((product) => (
                  <ProductCard key={product._id} product={product} onAdd={handleAdd} />
                ))}
              </div>

              <Pagination
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
                onChange={(page) => {
                  applyFilters({ page }, { resetPage: false });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
