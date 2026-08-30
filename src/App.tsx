import { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Compass,
  Heart,
  Lock,
  Mail,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Trash2,
  UserRound,
  X,
  Phone,
  Store,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { restaurants as restaurantData, type Restaurant, type MenuItem } from '@/data/menu';
import { supabase } from './lib/supabase';
import { createOrder } from './services/api';
import { DELIVERY_ZONES } from './data/delivery';
import RestaurantDashboard from './RestaurantDashboard';
import DeliveryDashboard from './DeliveryDashboard';
import AdminDashboard from './AdminDashboard';
import { useAuth } from './context/AuthContext';
type Category = 'Tout' | 'Burgers' | 'Sushi' | 'Tacos';

type CartLine = MenuItem & { quantity: number; restaurantName: string; restaurantId: string };

const categoryMap: Record<string, Category> = {
  'face-burger': 'Burgers',
  'maya-sushi': 'Sushi',
  'tacos-de-nice': 'Tacos',
};

const categories: { label: Category; icon: string }[] = [
  { label: 'Tout', icon: '✦' },
  { label: 'Burgers', icon: '◉' },
  { label: 'Sushi', icon: '◌' },
  { label: 'Tacos', icon: '▰' },
];

function App() {
  const { user, profile, role, loading, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>('Tout');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<'home' | 'restaurant' | 'restaurant-dashboard' | 'delivery-dashboard' | 'admin-dashboard'>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  
  // Authentification & Formulaires
  const [loginOpen, setLoginOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');

  // Données de livraison
 const [selectedZone, setSelectedZone] = useState<string>('Agdal');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  // Récupération du prix de livraison dynamique
  const currentDeliveryFee = useMemo(() => {
    const zone = DELIVERY_ZONES.find((z) => z.name === selectedZone);
    return zone ? zone.fee : 11;
  }, [selectedZone]);
  

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        if (user.user_metadata?.phone) {
          setDeliveryPhone(user.user_metadata.phone);
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: { full_name: authName, phone: authPhone },
          },
        });
        if (error) throw error;
        alert("Compte créé avec succès !");
        if (data.user) setCurrentUser(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (data.user) setCurrentUser(data.user);
      }
      setLoginOpen(false);
      setAuthPassword('');
    } catch (err: any) {
      alert("Erreur d'authentification : " + (err.message || 'Une erreur est survenue'));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const selectedRestaurant: Restaurant | null =
    restaurantData.find((r) => r.id === selectedRestaurantId) ?? null;

  const allMenuItems: (MenuItem & { restaurantName: string; restaurantId: string })[] = useMemo(
    () =>
      restaurantData.flatMap((r) =>
        r.menu.map((item) => ({ ...item, restaurantName: r.name, restaurantId: r.id })),
      ),
    [],
  );

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();
    return restaurantData.filter((restaurant) => {
      const cat = categoryMap[restaurant.id] ?? 'Tout';
      const matchesCategory = activeCategory === 'Tout' || cat === activeCategory;
      const matchesSearch =
        !query || `${restaurant.name} ${restaurant.cuisine}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (activeCategory === 'Tout' && !query) {
      return allMenuItems.filter((item) => item.popular).slice(0, 24);
    }
    return allMenuItems.filter((item) => {
      const restaurant = restaurantData.find((r) =>
        r.menu.some((m) => m.id === item.id),
      );
      const cat = restaurant ? categoryMap[restaurant.id] ?? 'Tout' : 'Tout';
      const matchesCategory = activeCategory === 'Tout' || cat === activeCategory;
      const matchesSearch =
        !query || `${item.name} ${item.description}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    }).slice(0, 24);
  }, [activeCategory, search, allMenuItems]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const total = subtotal;

  const addToCart = (item: MenuItem, restaurantName: string, restaurantId: string) => {
    setCart((current) => {
      if (current.length > 0 && current[0].restaurantId !== restaurantId) {
        if (!confirm("Votre panier contient des articles d'un autre restaurant. Réinitialiser le panier ?")) {
          return current;
        }
        return [{ ...item, quantity: 1, restaurantName, restaurantId }];
      }

      const existing = current.find((line) => line.id === item.id);
      if (existing)
        return current.map((line) =>
          line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      return [...current, { ...item, quantity: 1, restaurantName, restaurantId }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.id !== id) return [line];
        const quantity = line.quantity + delta;
        return quantity > 0 ? [{ ...line, quantity }] : [];
      }),
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    if (!deliveryPhone.trim()) {
      alert("Veuillez renseigner votre numéro de téléphone marocain.");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeRestId = cart[0]?.restaurantId || selectedRestaurantId || 'face-burger';

      const payload = {
        restaurantId: activeRestId,
        items: cart,
        totalAmount: total,
        deliveryAddress: deliveryAddress.trim() || 'Rabat / Salé',
        phone: deliveryPhone.trim(),
      };

      await createOrder(payload);

      setOrderPlaced(true);
      setCart([]);
      setCartOpen(false);
    } catch (err: any) {
      alert("Erreur lors de la validation de la commande : " + (err.message || 'Erreur inconnue'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRestaurant = (id: string) => {
    setSelectedRestaurantId(id);
    setView('restaurant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setView('home');
    setSelectedRestaurantId(null);
  };

  const scrollToRestaurants = () =>
    document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' });

  const scrollToHowItWorks = () =>
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

  const menuSections = useMemo(() => {
    if (!selectedRestaurant) return [];
    const sections: Record<string, MenuItem[]> = {};
    for (const item of selectedRestaurant.menu) {
      if (!sections[item.section]) sections[item.section] = [];
      sections[item.section].push(item);
    }
    return Object.entries(sections);
  }, [selectedRestaurant]);

  const renderHeader = () => (
    <header className="topbar">
      <a 
        className="brand" 
        href="#top" 
        aria-label="Faylasouf accueil" 
        onClick={(e) => { e.preventDefault(); goHome(); }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
      >
        <img 
          src="/logo.jpeg" 
          alt="Logo Faylasouf" 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #eab308'
          }} 
        />
        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>faylasouf</span>
      </a>

      <button className="location-picker">
        <MapPin size={17} strokeWidth={2.4} />
        <span>Rabat, Maroc</span>
        <ChevronDown size={15} />
      </button>

      <nav className="topnav">
        <a href="#restaurants" onClick={(e) => { e.preventDefault(); goHome(); setTimeout(scrollToRestaurants, 100); }}>
          Restaurants
        </a>
        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); goHome(); setTimeout(scrollToHowItWorks, 100); }}>
          Comment ça marche
        </a>
      </nav>

      <div className="top-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Bouton Admin */}
            {role === 'admin' && (
              <button
                className="login-button"
                onClick={() => setView('admin-dashboard')}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 600 }}
              >
                👑 Admin
              </button>
            )}

            {/* Bouton Restaurant */}
            {(role === 'restaurant' || role === 'admin') && (
              <button 
                className="login-button" 
                style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600 }}
                onClick={() => setView('restaurant-dashboard')}
              >
                <Store size={16} /> Espace Restaurant
              </button>
            )}

            {/* Bouton Livreur */}
            {(role === 'courier' || role === 'admin') && (
              <button
                className="login-button"
                onClick={() => setView('delivery-dashboard')}
                style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 600 }}
              >
                🛵 Livreur
              </button>
            )}

            {/* Bouton Déconnexion */}
            <button 
              className="login-button" 
              onClick={signOut}
              style={{ cursor: 'pointer', background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        ) : (
          <button className="login-button" onClick={() => setLoginOpen(true)}>
            <UserRound size={17} /> Se connecter
          </button>
        )}

        <button className="cart-button" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={18} />
          <span>Panier</span>
          {cartCount > 0 && <b>{cartCount}</b>}
        </button>
      </div>
    </header>
  );

  const renderCart = () => (
    <>
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <aside className="cart-panel" onClick={(event) => event.stopPropagation()}>
            <div className="cart-header">
              <div>
                <p className="overline">Votre sélection</p>
                <h2>Mon panier <span>{cartCount}</span></h2>
              </div>
              <button className="drawer-close" onClick={() => setCartOpen(false)}><X size={20} /></button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag size={36} />
                <h3>Votre panier est vide</h3>
                <p>Ajoutez un plat qui vous fait envie.</p>
                <button onClick={() => setCartOpen(false)}>Découvrir le menu</button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map((line) => (
                    <div className="cart-line" key={line.id}>
                      <img src={line.image} alt="" />
                      <div className="cart-line-copy">
                        <strong>{line.name}</strong>
                        <span>{line.price} DH</span>
                        <div className="quantity">
                          <button onClick={() => updateQuantity(line.id, -1)}><Minus size={13} /></button>
                          <b>{line.quantity}</b>
                          <button onClick={() => updateQuantity(line.id, 1)}><Plus size={13} /></button>
                        </div>
                      </div>
                      <button className="remove-line" onClick={() => updateQuantity(line.id, -line.quantity)} aria-label="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* FORMULAIRE DE LIVRAISON AVEC AFFICHAGE CLAIR DU PRIX */}
                <div style={{ padding: '0 20px', marginTop: '12px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    
                    {/* SÉLECTION DU QUARTIER + PRIX EN DIRECT */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={15} color="#16a34a" /> Quartier de livraison *
                      </label>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                        +{currentDeliveryFee} DH
                      </span>
                    </div>

                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1e293b',
                        boxSizing: 'border-box',
                        marginBottom: '12px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      {DELIVERY_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.name}>
                          {zone.name} — {zone.fee} DH
                        </option>
                      ))}
                    </select>

                    {/* TÉLÉPHONE */}
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Phone size={14} color="#16a34a" /> Numéro WhatsApp (obligatoire) *
                    </label>
                    <input 
                      type="tel" 
                      placeholder="0612345678" 
                      value={deliveryPhone} 
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', marginBottom: '12px', backgroundColor: '#fff' }}
                    />

                    {/* ADRESSE PRÉCISE */}
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <MapPin size={14} color="#64748b" /> Précision d'adresse (Rue, Immeuble, Apt)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ex: Rue 14, Immeuble B..." 
                      value={deliveryAddress} 
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#fff' }}
                    />
                  </div>
                </div>

                {/* TOTAL ET FRAIS DE LIVRAISON BIEN VISIBLES */}
                <div className="cart-summary" style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '6px' }}>
                    <span>Sous-total plats</span>
                    <strong style={{ color: '#0f172a' }}>{subtotal} DH</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#15803d', marginBottom: '12px', fontWeight: 600 }}>
                    <span>Frais de livraison ({selectedZone})</span>
                    <strong style={{ fontSize: '15px' }}>+{currentDeliveryFee} DH</strong>
                  </div>

                  <div className="summary-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', marginBottom: '14px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800 }}>Total à payer</span>
                    <strong style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a' }}>{total} DH</strong>
                  </div>

                  <button className="checkout-button" disabled={isSubmitting} onClick={handleCheckout}>
                    {isSubmitting ? 'Validation...' : <>Passer la commande <ArrowRight size={17} /></>}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {orderPlaced && (
        <div className="toast" role="status">
          <span className="toast-check">✓</span>
          <div>
            <strong>Commande enregistrée</strong>
            <span>Votre repas est en préparation.</span>
          </div>
          <button onClick={() => setOrderPlaced(false)}><X size={16} /></button>
        </div>
      )}
    </>
  );
  

  const renderLogin = () => (
    <>
      {loginOpen && (
        <div className="login-overlay" onClick={() => setLoginOpen(false)}>
          <form
            className="login-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAuth}
          >
            <button type="button" className="drawer-close" onClick={() => setLoginOpen(false)} aria-label="Fermer"><X size={20} /></button>
            <p className="overline">{isSignUp ? 'Bienvenue' : 'Bon retour parmi nous'}</p>
            <h2>{isSignUp ? 'Créer un compte' : 'Connexion'}</h2>
            <p className="login-sub">Accédez à vos commandes et facilitez vos livraisons.</p>

            {isSignUp && (
              <>
                <label className="login-field">
                  <span>Nom complet</span>
                  <input type="text" required placeholder="Votre nom" value={authName} onChange={(e) => setAuthName(e.target.value)} />
                </label>
                <label className="login-field">
                  <span><Phone size={15} /> Téléphone</span>
                  <input type="tel" required placeholder="0612345678" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} />
                </label>
              </>
            )}

            <label className="login-field">
              <span><Mail size={15} /> Adresse e-mail</span>
              <input type="email" required placeholder="vous@exemple.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="login-field">
              <span><Lock size={15} /> Mot de passe</span>
              <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete="current-password" />
            </label>

            <button type="submit" className="login-submit">
              {isSignUp ? "S'inscrire" : 'Se connecter'} <ArrowRight size={17} />
            </button>
            
            <p className="login-foot">
              {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); }}>
                {isSignUp ? 'Se connecter' : 'Créer un compte'}
              </a>
            </p>
          </form>
        </div>
      )}
    </>
  );

  if (view === 'restaurant-dashboard') {
    if (role === 'restaurant' || role === 'admin') {
      return <RestaurantDashboard onBack={goHome} />;
    }
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Accès refusé : espace réservé aux restaurateurs.
      </div>
    );
  }
if (view === 'delivery-dashboard') {
    if (role === 'courier' || role === 'admin') {
      return <DeliveryDashboard onBack={goHome} />;
    }
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Accès refusé : espace réservé aux livreurs.
      </div>
    );
  }
if (view === 'admin-dashboard') {
    if (role === 'admin') {
      return <AdminDashboard onBack={goHome} />;
    }
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Accès refusé : espace réservé aux administrateurs.
      </div>
    );
  }
  if (view === 'restaurant' && selectedRestaurant) {
    return (
      <div className="app-shell">
        {renderHeader()}
        <main id="top">
          <div className="restaurant-hero" style={{ backgroundImage: `linear-gradient(180deg, #0b1e1500 30%, #0b1e1599 100%), url(${selectedRestaurant.heroImage})` }}>
            <button className="back-button" onClick={goHome}><ArrowLeft size={18} /> Retour aux restaurants</button>
            <div className="restaurant-hero-info">
              <span className="restaurant-hero-tag" style={{ backgroundColor: selectedRestaurant.tagColor }}>{selectedRestaurant.tag}</span>
              <h1>{selectedRestaurant.name}</h1>
              <p>{selectedRestaurant.description}</p>
              <div className="restaurant-hero-meta">
                <span className="hero-rating-badge"><Star size={15} fill="currentColor" /> {selectedRestaurant.rating} <small>({selectedRestaurant.reviews} avis)</small></span>
              </div>
            </div>
          </div>

          <section className="restaurant-menu-section">
            <div className="restaurant-menu-heading">
              <div><p className="overline">Le menu complet</p><h2>Tous les plats</h2></div>
              <span className="menu-count">{selectedRestaurant.menu.length} plats</span>
            </div>
            {menuSections.map(([sectionName, items]) => (
              <div key={sectionName} className="menu-section-group" style={{ marginBottom: '36px' }}>
                <h3 className="menu-section-title" style={{ fontSize: '18px', letterSpacing: '-0.5px', margin: '0 0 16px', color: 'var(--ink)', fontFamily: "'Playfair Display', serif" }}>{sectionName}</h3>
                <div className="restaurant-menu-grid">
                  {items.map((item) => (
                    <article className="menu-card" key={item.id}>
                      <div className="menu-image-wrap">
                        <img src={item.image} alt={item.name} />
                        <button className="add-button" onClick={() => addToCart(item, selectedRestaurant.name, selectedRestaurant.id)}><Plus size={19} /></button>
                      </div>
                      <div className="menu-copy">
                        <div className="menu-title-row"><h3>{item.name}</h3>{item.popular && <span className="popular-dot">Populaire</span>}</div>
                        <p>{item.description}</p>
                        <div className="menu-bottom"><span className="menu-restaurant">{selectedRestaurant.name}</span><strong>{item.price} <small>DH</small></strong></div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
        <footer className="footer">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img 
                src="/logo.jpeg" 
                alt="Logo Faylasouf" 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #eab308'
                }} 
              />
              <strong style={{ fontSize: '18px', color: '#0f172a' }}>faylasouf</strong>
            </div>
            <p>Les bonnes choses arrivent vite.</p>
          </div>

          <div className="footer-links">
            <a href="#top">Haut de page</a>
            <span className="copyright">© 2026 Faylasouf</span>
          </div>
        </footer>

        {renderCart()}
        {renderLogin()}
      </div>
    );
  };
  
return (
    <div className="app-shell">
      {renderHeader()}
      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Livraison à Rabat</div>
            <h1>Les bonnes choses<br /><em>arrivent vite.</em></h1>
            <p>Vos plats préférés, soigneusement préparés par les meilleurs restaurants de Rabat et livrés chez vous.</p>
            <div className="search-box">
              <Search size={20} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un plat ou un restaurant" aria-label="Rechercher un plat ou un restaurant" />
              <button onClick={scrollToRestaurants}>Rechercher</button>
            </div>
          </div>
          <div className="hero-art" aria-label="Suggestion du jour">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="hero-card hero-card-back"><span>Fait avec soin</span><strong>du quartier<br />à votre porte</strong></div>
            <div className="hero-food-image"><img src={restaurantData[0].heroImage} alt="Burger gourmand" /></div>
            <div className="floating-rating"><Star size={16} fill="currentColor" /><strong>4.9</strong><span>la note moyenne</span></div>
          </div>
        </section>

        <section className="category-strip" aria-label="Catégories">
          <div className="section-label">J'ai envie de...</div>
          <div className="category-list">
            {categories.map((category) => (
              <button key={category.label} className={activeCategory === category.label ? 'category-pill active' : 'category-pill'} onClick={() => setActiveCategory(category.label)}>
                <span>{category.icon}</span>{category.label}
              </button>
            ))}
          </div>
          <button className="filter-button"><SlidersHorizontal size={16} /> Filtres</button>
        </section>

        <section className="content-section" id="restaurants">
          <div className="section-heading">
            <div><p className="overline">À la une aujourd'hui</p><h2>Vos restaurants préférés</h2></div>
            <button className="see-all" onClick={() => { setActiveCategory('Tout'); setSearch(''); }}>Voir tout <ArrowRight size={16} /></button>
          </div>
          <div className="restaurant-grid">
            {filteredRestaurants.map((restaurant) => (
              <article className="restaurant-card" key={restaurant.id} onClick={() => openRestaurant(restaurant.id)}>
                <div className="restaurant-image-wrap">
                  <img src={restaurant.heroImage} alt={restaurant.name} />
                  <div className="image-shade" />
                  <span className="restaurant-tag" style={{ backgroundColor: restaurant.tagColor }}>{restaurant.tag}</span>
                  <button className="favorite-button" onClick={(event) => event.stopPropagation()} aria-label={`Ajouter ${restaurant.name} aux favoris`}><Heart size={17} /></button>
                </div>
                <div className="restaurant-info">
                  <div><h3>{restaurant.name}</h3><p>{restaurant.cuisine}</p></div>
                  <div className="restaurant-rating"><Star size={14} fill="currentColor" /> {restaurant.rating} <span>({restaurant.reviews})</span></div>
                </div>
                <div className="restaurant-meta" style={{ justifyContent: 'flex-end' }}>
                  <span className="view-menu-link">Voir le menu <ArrowRight size={12} /></span>
                </div>
              </article>
            ))}
          </div>
          {filteredRestaurants.length === 0 && <div className="empty-state">Aucun restaurant ne correspond à votre recherche.</div>}
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div><p className="overline">Les plus commandés</p><h2>Ça donne faim, non ?</h2></div>
            <button className="see-all" onClick={() => setActiveCategory('Tout')}>Tout le menu <ArrowRight size={16} /></button>
          </div>
          <div className="menu-grid">
            {filteredMenu.map((item) => {
              const restaurant = restaurantData.find((r) => r.menu.some((m) => m.id === item.id));
              return (
                <article className="menu-card" key={item.id}>
                  <div className="menu-image-wrap">
                    <img src={item.image} alt={item.name} />
                    <button className="add-button" onClick={() => addToCart(item, item.restaurantName, item.restaurantId)}><Plus size={19} /></button>
                  </div>
                  <div className="menu-copy">
                    <div className="menu-title-row"><h3>{item.name}</h3>{item.popular && <span className="popular-dot">Populaire</span>}</div>
                    <p>{item.description}</p>
                    <div className="menu-bottom">
                      <button className="menu-restaurant" onClick={() => restaurant && openRestaurant(restaurant.id)}>{item.restaurantName}</button>
                      <strong>{item.price} <small>DH</small></strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="trust-section" id="how-it-works">
          <div className="trust-intro"><p className="overline">Simple comme bonjour</p><h2>Un meilleur repas,<br /><em>en trois étapes.</em></h2></div>
          <div className="steps">
            <div className="step"><span>01</span><div><Compass size={21} /><h3>Choisissez</h3><p>Parcourez nos restaurants et trouvez votre prochaine envie.</p></div></div>
            <div className="step"><span>02</span><div><ShoppingBag size={21} /><h3>Commandez</h3><p>Ajoutez vos plats préférés et choisissez votre adresse.</p></div></div>
            <div className="step"><span>03</span><div><CheckCircle2 size={21} /><h3>Dégustez</h3><p>Suivez votre commande jusqu'à votre porte, sans stress.</p></div></div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img 
                src="/logo.jpeg" 
                alt="Logo Faylasouf" 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #eab308'
                }} 
              />
              <strong style={{ fontSize: '18px', color: '#0f172a' }}>faylasouf</strong>
            </div>
            <p>Les bonnes choses arrivent vite.</p>
          </div>
        <div className="footer-links">
          <a href="#restaurants" onClick={(e) => { e.preventDefault(); goHome(); setTimeout(scrollToRestaurants, 100); }}>Restaurants</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); }}>À propos</a>
          <a href="#top">Aide & contact</a>
        </div>
        <span className="copyright">© 2026 Faylasouf · Rabat</span>
      </footer>

      {renderCart()}
      {renderLogin()}
    </div>
  );
}

export default App;