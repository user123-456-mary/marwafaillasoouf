import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { ArrowLeft, DollarSign, ShoppingCart, TrendingUp, Store, RefreshCw } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(1) : '0';

  const revenueByRestaurant = {
    'Face Burger': orders.filter(o => o.restaurant_id === 'face-burger').reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
    'Tacos de Nice': orders.filter(o => o.restaurant_id === 'tacos-de-nice').reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
    'Maya Sushi': orders.filter(o => o.restaurant_id === 'maya-sushi').reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', color: '#64748b' }}>
          <ArrowLeft size={18} /> Retour
        </button>
        <button onClick={fetchAdminData} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>Tableau de Bord Administrateur</h1>

      {/* Cartes KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Chiffre d'Affaires</span>
            <DollarSign size={20} />
          </div>
          <strong style={{ fontSize: '24px', color: '#15803d' }}>{totalRevenue} DH</strong>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Total Commandes</span>
            <ShoppingCart size={20} />
          </div>
          <strong style={{ fontSize: '24px', color: '#1e40af' }}>{totalOrders}</strong>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Panier Moyen</span>
            <TrendingUp size={20} />
          </div>
          <strong style={{ fontSize: '24px', color: '#b45309' }}>{avgTicket} DH</strong>
        </div>
      </div>

      {/* Ventes par restaurant */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={18} /> Performances par Restaurant
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {Object.entries(revenueByRestaurant).map(([name, amount]) => (
            <div key={name} style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{name}</p>
              <strong style={{ fontSize: '18px', color: '#0f172a' }}>{amount} DH</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}