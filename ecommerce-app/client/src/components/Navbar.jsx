/**
 * Application header: brand, catalogue search, cart and account menu.
 *
 * The search box writes to the URL rather than to component state, so a search
 * result page can be bookmarked, shared and restored by the browser's back
 * button.
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [term, setTerm] = useState(searchParams.get('q') || '');
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the box in step with the URL when the visitor navigates with the
  // back button or follows a link that carries a different query.
  useEffect(() => {
    setTerm(searchParams.get('q') || '');
  }, [searchParams]);

  // Close the account menu whenever the route changes.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmed = term.trim();
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>ShopSphere</span>
        </Link>

        <form className="header-search" role="search" onSubmit={submitSearch}>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search for products, brands and more"
            aria-label="Search the catalogue"
            maxLength={100}
          />
        </form>

        <nav className="header-nav" aria-label="Main navigation">
          <NavLink to="/products" className="nav-link">
            <span aria-hidden="true">▤</span>
            <span className="label">Shop</span>
          </NavLink>

          <NavLink to="/cart" className="nav-link cart-link" aria-label={`Cart, ${itemCount} items`}>
            <span aria-hidden="true">🛒</span>
            <span className="label">Cart</span>
            {itemCount > 0 && <span className="cart-badge">{itemCount > 99 ? '99+' : itemCount}</span>}
          </NavLink>

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="nav-link"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <span aria-hidden="true">👤</span>
                <span className="label">{user.name.split(' ')[0]}</span>
              </button>

              {menuOpen && (
                <div
                  className="card"
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    minWidth: 190, padding: 6, boxShadow: 'var(--shadow-lg)', zIndex: 50,
                  }}
                >
                  <Link to="/orders" className="nav-link" style={{ display: 'flex' }}>My orders</Link>
                  <Link to="/profile" className="nav-link" style={{ display: 'flex' }}>Profile</Link>
                  {isAdmin && (
                    <Link to="/admin" className="nav-link" style={{ display: 'flex' }}>
                      Admin dashboard
                    </Link>
                  )}
                  <hr style={{ border: 'none', borderTop: '1px solid var(--ink-100)', margin: '5px 0' }} />
                  <button
                    type="button"
                    className="nav-link"
                    onClick={handleLogout}
                    style={{
                      width: '100%', border: 'none', background: 'none',
                      cursor: 'pointer', color: 'var(--danger-600)', textAlign: 'left',
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">Sign in</NavLink>
              <Link to="/register" className="btn btn-sm">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
