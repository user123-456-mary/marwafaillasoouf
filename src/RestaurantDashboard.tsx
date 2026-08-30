import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';

interface RestaurantDashboardProps {
  onBack: () => void;
}

const RESTAURANT_NAMES: Record<string, string> = {
  'face-burger': 'Face Burger',
  'tacos-de-nice': 'Tacos de Nice',
  'maya-sushi': 'Maya Sushi',
};

export default function RestaurantDashboard({ onBack }: RestaurantDashboardProps) {
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
        console.error('Erreur chargement commandes:', error.message);
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

  

    const notifyClientViaWhatsApp = (
    phone: string,
    orderId: string,
    restaurantName: string,
    status: string
  ) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '212' + cleanPhone.substring(1);
    }

    const messages: Record<string, string> = {
      preparing: 
        "👋 FAYLASOUF DELIVERY\n\n" +
        `Bonjour ! Voici le suivi de votre commande chez ${restaurantName} :\n\n` +
        "📍 Statut :\n" +
        "👨‍🍳 Le restaurant prépare votre commande avec soin.\n\n" +
        "✨ Merci pour votre confiance !",

      ready: 
        "👋 FAYLASOUF DELIVERY\n\n" +
        `Bonjour ! Voici le suivi de votre commande chez ${restaurantName} :\n\n` +
        "📍 Statut :\n" +
        "📦 Votre commande est prête et attend le livreur.\n\n" +
        "✨ Merci pour votre confiance !",

      delivering: 
        "👋 FAYLASOUF DELIVERY\n\n" +
        `Bonjour ! Voici le suivi de votre commande chez ${restaurantName} :\n\n` +
        "📍 Statut :\n" +
        "🛵 Votre commande est en cours de route avec notre livreur.\n\n" +
        "✨ Merci pour votre confiance !",

      delivered: 
        "👋 FAYLASOUF DELIVERY\n\n" +
        `Bonjour ! Voici le suivi de votre commande chez ${restaurantName} :\n\n` +
        "📍 Statut :\n" +
        "🎉 Votre commande a bien été livrée. Bon appétit !\n\n" +
        "✨ Merci pour votre confiance !",
    };

    const rawText = messages[status] || 
      `👋 FAYLASOUF DELIVERY\n\nBonjour ! Voici le suivi de votre commande chez ${restaurantName}.\n\n✨ Merci pour votre confiance !`;

    // Encodage strict URI pour éviter que WhatsApp ne transforme les émojis en "?"
    const text = encodeURIComponent(rawText);

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
  };

  const handleUpdateStatus = async (
    order: any,
    newStatus: 'preparing' | 'ready' | 'delivering' | 'delivered'
  ) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) {
        alert('Erreur de mise à jour: ' + error.message);
        return;
      }

      // Nom du restaurant dynamique
      const restaurantName = RESTAURANT_NAMES[order.restaurant_id] || order.restaurant_id || 'Faylasouf';

      // Notification WhatsApp
      if (order.phone && order.phone !== 'Non renseigné') {
        const displayId = order.order_number ? `${order.order_number}` : order.id.slice(0, 4).toUpperCase();
        const waUrl = notifyClientViaWhatsApp(order.phone, displayId, restaurantName, newStatus);
        window.open(waUrl, '_blank');
      }

      // Mise à jour de l'état local
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert('Erreur: ' + (err.message || 'Une erreur est survenue'));
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'preparing':
        return <span style={{ color: '#d97706', fontWeight: 700 }}>🍳 EN PRÉPARATION</span>;
      case 'ready':
        return <span style={{ color: '#059669', fontWeight: 700 }}>✅ PRÊT</span>;
      case 'delivering':
        return <span style={{ color: '#2563eb', fontWeight: 700 }}>🛵 EN LIVRAISON</span>;
      case 'delivered':
        return <span style={{ color: '#16a34a', fontWeight: 700 }}>🎉 LIVRÉ</span>;
      default:
        return <span style={{ color: '#6366f1', fontWeight: 700 }}>⏳ EN ATTENTE</span>;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
      {/* En-tête du tableau de bord */}
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

      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
        Tableau de Bord des Commandes
      </h1>

      {/* Contenu des commandes */}
      {loading ? (
        <p>Chargement des commandes en cours...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: '#64748b' }}>Aucune commande pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong style={{ fontSize: '16px' }}>
                  Commande #{order.order_number || order.id.slice(0, 4).toUpperCase()}
                </strong>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  • {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>

              <p style={{ margin: '6px 0 4px', fontSize: '14px' }}>
                🏪 Restaurant : <strong>{RESTAURANT_NAMES[order.restaurant_id] || order.restaurant_id || 'Faylasouf'}</strong>
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                📞 Téléphone client : <strong>{order.phone || 'Non renseigné'}</strong>
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                📍 Adresse : {order.delivery_address || 'Rabat / Salé'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                Statut : {getStatusBadge(order.status)}
              </p>

              {/* Boutons d'actions et de notification WhatsApp */}
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleUpdateStatus(order, 'preparing')}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  🍳 En préparation
                </button>
                <button
                  onClick={() => handleUpdateStatus(order, 'ready')}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  ✅ Prêt
                </button>
                <button
                  onClick={() => handleUpdateStatus(order, 'delivering')}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  🛵 En livraison
                </button>
                <button
                  onClick={() => handleUpdateStatus(order, 'delivered')}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: '#047857', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  🎉 Livré
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}