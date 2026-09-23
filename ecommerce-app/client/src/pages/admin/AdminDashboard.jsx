/**
 * Analytics dashboard.
 *
 * All aggregation happens server-side; this screen only renders the figures it
 * is given. Recharts draws the sales series inside a `ResponsiveContainer` so
 * the chart reflows with the panel rather than overflowing on a narrow screen.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { formatCurrency, statusTone } from '../../utils/format';

/** Palette reused by the status chart; index-matched to STATUS_ORDER. */
const STATUS_COLOURS = {
  PENDING: '#d97706',
  CONFIRMED: '#0284c7',
  SHIPPED: '#6366f1',
  DELIVERED: '#059669',
  CANCELLED: '#dc2626',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert message={error} />;
  if (!data) return <Loader label="Building the dashboard…" />;

  // The server sends a plain 'YYYY-MM-DD' calendar day. Passing that straight
  // to `new Date()` would parse it as UTC midnight and, west of Greenwich,
  // render the previous day. Splitting the parts and building a local date
  // keeps the label identical to the bucket the server computed.
  const chartData = data.salesSeries.map((point) => {
    const [year, month, day] = point.date.split('-').map(Number);
    return {
      ...point,
      label: new Date(year, month - 1, day)
        .toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    };
  });

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* --- Headline figures ---------------------------------------------- */}
      <div className="stat-grid" style={{ marginBottom: 0 }}>
        <div className="stat-tile">
          <div className="label">Total revenue</div>
          <div className="value">{formatCurrency(data.totalRevenue)}</div>
          <div className="sub">Confirmed, shipped and delivered orders</div>
        </div>
        <div className="stat-tile">
          <div className="label">Orders</div>
          <div className="value">{data.totalOrders}</div>
          <div className="sub">{data.totalUnitsSold} units sold</div>
        </div>
        <div className="stat-tile">
          <div className="label">Average order value</div>
          <div className="value">{formatCurrency(data.averageOrderValue)}</div>
          <div className="sub">Across all realised orders</div>
        </div>
        <div className="stat-tile">
          <div className="label">Catalogue</div>
          <div className="value">{data.activeProducts}</div>
          <div className="sub">{data.registeredCustomers} registered customers</div>
        </div>
      </div>

      <div className="dash-grid">
        {/* --- Sales trend ------------------------------------------------- */}
        <section className="panel">
          <h3 className="panel-title">Revenue, last 14 days</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip
                  formatter={(value, name) =>
                    (name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders'])}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2}
                  fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* --- Status breakdown -------------------------------------------- */}
        <section className="panel">
          <h3 className="panel-title">Orders by status</h3>
          {data.statusBreakdown.length === 0 ? (
            <p className="muted small">No orders yet.</p>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={data.statusBreakdown} layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="_id" width={86}
                    tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={18}>
                    {data.statusBreakdown.map((entry) => (
                      <Cell key={entry._id} fill={STATUS_COLOURS[entry._id] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="dash-grid">
        {/* --- Best sellers ------------------------------------------------ */}
        <section className="panel">
          <h3 className="panel-title">Best selling products</h3>
          {data.topProducts.length === 0 ? (
            <p className="muted small">No sales recorded yet.</p>
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data" style={{ minWidth: 0 }}>
                <thead>
                  <tr><th>Product</th><th className="nowrap">Units</th><th className="nowrap">Revenue</th></tr>
                </thead>
                <tbody>
                  {data.topProducts.map((item) => (
                    <tr key={String(item._id)}>
                      <td className="cell-title">{item.title}</td>
                      <td>{item.unitsSold}</td>
                      <td className="nowrap">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* --- Low stock alert --------------------------------------------- */}
        <section className="panel">
          <h3 className="panel-title">Low stock alerts</h3>
          {data.lowStock.length === 0 ? (
            <p className="muted small">Every product is comfortably stocked.</p>
          ) : (
            <div className="stack" style={{ gap: 9 }}>
              {data.lowStock.map((item) => (
                <div className="row-between" key={String(item._id)}>
                  <span className="small" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  <span className={`badge ${item.stockCount === 0 ? 'badge-danger' : 'badge-warning'}`}>
                    {item.stockCount === 0 ? 'Out of stock' : `${item.stockCount} left`}
                  </span>
                </div>
              ))}
              <Link to="/admin/products" className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}>
                Manage stock →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
