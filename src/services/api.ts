import { supabase } from '../lib/supabase';

export interface OrderPayload {
  restaurantId: string;
  items: any[];
  totalAmount: number;
  deliveryAddress: string;
  phone: string;
}

// Enregistrement de la commande dans Supabase
export async function createOrder(payload: OrderPayload) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        user_id: user ? user.id : null,
        restaurant_id: payload.restaurantId,
        items: payload.items,
        total_amount: payload.totalAmount,
        status: 'pending',
        delivery_address: payload.deliveryAddress,
        phone: payload.phone,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select();

  if (error) {
    console.error("Erreur lors de la mise à jour du statut :", error);
    throw error;
  }
  return data;
}
export async function signUpUser(
  email: string, 
  password: string, 
  fullName: string, 
  role: 'customer' | 'restaurant' = 'customer'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  });

  if (error) throw error;
  return data;
}

// Connexion
export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Déconnexion
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Mot de passe oublié
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return data;
}

// Récupérer le profil connecté
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}

// ==========================================
// 3. NOTIFICATIONS & LIENS WHATSAPP
// ==========================================

// Lien WhatsApp lors du passage de commande
export function generateWhatsAppLink(order: {
  id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  deliveryAddress: string;
  restaurantPhone: string;
}) {
  let message = `🛵 *Nouvelle Commande Faylasouf* 🛵\n`;
  message += `📄 *Réf :* ${order.id.slice(0, 8)}\n\n`;
  message += `📋 *Détail de la commande :*\n`;

  order.items.forEach((item) => {
    message += `• ${item.quantity}x ${item.name} (${item.price * item.quantity} DH)\n`;
  });

  message += `\n💰 *Total :* ${order.totalAmount} DH\n`;
  message += `📍 *Adresse :* ${order.deliveryAddress}\n`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${order.restaurantPhone}?text=${encodedMessage}`;
}

// Lien WhatsApp pour notifier le client du changement de statut
export function notifyClientViaWhatsApp(
  clientPhone: string,
  orderId: string,
  restaurantName: string,
  newStatus: 'preparing' | 'ready' | 'delivering' | 'delivered'
) {
  const statusTexts = {
    preparing: "👨‍🍳 Le restaurant prépare votre commande avec soin.",
    ready: "📦 Votre commande est prête et attend le livreur.",
    delivering: "🛵 Le livreur est en route vers votre adresse !",
    delivered: "🎉 Votre commande a été livrée avec succès. Bon appétit !",
  };

  const shortId = orderId.slice(0, 8).toUpperCase();

  const message = 
    `👋🏻FAYLASOUF DELIVERY\n` +
    `\n\n` +
    `Bonjour ! Voici le suivi de votre commande chez ${restaurantName} :\n\n` +
    `📍 Statut : \n` +
    `${statusTexts[newStatus]}\n\n` +
    `\n` +
    `✨ Merci pour votre confiance !`;

  // Nettoyage et formatage du numéro marocain (ex: 0612345678 -> 212612345678)
  const cleanPhone = clientPhone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('0') 
    ? '212' + cleanPhone.slice(1) 
    : cleanPhone.startsWith('212') 
      ? cleanPhone 
      : '212' + cleanPhone;

  return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
}