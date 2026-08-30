import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Bike, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from './lib/supabase';

interface DeliveryDashboardProps {
  onBack: () => void;
}

const RESTAURANT_NAMES: Record<string, string> = {
  'face-burger': 'Face Burger',
  'tacos-de-nice': 'Tacos de Nice',
  'maya-sushi': 'Maya Sushi',
};

export default function DeliveryDashboard({ onBack }: DeliveryDashboardProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement commandes livreur:', error.message);
      } else {
        setOrders(data || []);
      }
    } catch (err: any) {
      console.error('Erreur inattendue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // 👉 TON CODE SE PLACE EXACTEMENT ICI (AVANT LE RETURN) :
  const readyOrders = orders.filter(
    (o) => o.status === 'ready' || o.status === 'delivering'
  );

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
        >
          <ArrowLeft size={18} /> Retour à l'accueil
        </button>
        <button
          onClick={fetchOrders}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7' }}>
          <Bike size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Espace Livreur</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            Commandes prêtes pour récupération et livraison
          </p>
        </div>
      </div>

      {/* Liste des commandes filtrées */}
      {loading ? (
        <p>Chargement des courses...</p>
      ) : readyOrders.length === 0 ? (
        <div style={{ background: '#fff', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <Bike size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p>Aucune commande en attente de livraison pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {readyOrders.map((order) => (
            <div
              key={order.id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>
                    Commande #{order.order_number || order.id.slice(0, 4).toUpperCase()}
                  </strong>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    🏪 Restaurant : <b>{RESTAURANT_NAMES[order.restaurant_id] || order.restaurant_id || 'Faylasouf'}</b>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: order.status === 'delivering' ? '#dbeafe' : '#dcfce7',
                    color: order.status === 'delivering' ? '#1d4ed8' : '#15803d',
                  }}
                >
                  {order.status === 'delivering' ? '🛵 EN COURS DE ROUTE' : '📦 PRÊTE EN CUISINE'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '14px' }}>
                <p style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#ef4444" />
                  <span>Adresse : <strong>{order.delivery_address || 'Rabat / Salé'}</strong></span>
                </p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={16} color="#16a34a" />
                  <span>Téléphone : <strong>{order.phone || 'Non renseigné'}</strong></span>
                  {order.phone && (
                    <a
                      href={`tel:${order.phone}`}
                      style={{ marginLeft: '8px', color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '12px' }}
                    >
                      (Appeler)
                    </a>
                  )}
                </p>
              </div>

              {/* Actions du livreur */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivering')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Bike size={16} /> Prendre en charge la course
                  </button>
                )}

                {order.status === 'delivering' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={16} /> Confirmer la livraison effectuée
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}