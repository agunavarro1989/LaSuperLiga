import React, { useState, useEffect, useRef, Component } from 'react';
import { Trophy, Users, CalendarDays, ShieldCheck, Phone, Plus, CheckCircle2, Image as ImageIcon, Settings, LayoutList, Medal, Trash2, Camera, Bell, FileText, AlertTriangle, X, Download, LogOut, Shield, ChevronRight, ChevronDown, Search, Share2, Edit3, Lock, MessageCircle, TrendingUp, ToggleRight, ToggleLeft, MapPin, Palette } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyC8oNa-55C0DnxsdFAndPkIZ06gROeCOnQ",
  authDomain: "la-super-liga.firebaseapp.com",
  projectId: "la-super-liga",
  storageBucket: "la-super-liga.firebasestorage.app",
  messagingSenderId: "561955297080",
  appId: "1:561955297080:web:eaff1dda169c74929913cd",
  measurementId: "G-ZEWBD48N70"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const getCollectionPath = (colName) => colName;

// --- UTILS: COMPRESOR Y COLORES ---
const resizeImage = (file, callback, maxWidth = 300, maxHeight = 400, quality = 0.6) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width; let height = img.height;
      if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } 
      else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
      const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      callback(canvas.toDataURL(format, format === 'image/png' ? undefined : quality)); 
    }; img.src = e.target.result;
  }; reader.readAsDataURL(file);
};

const hexToRgb = (hex) => {
  let r = 0, g = 0, b = 0;
  if (!hex) return "15, 23, 42"; 
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) { r = parseInt(cleanHex[0] + cleanHex[0], 16); g = parseInt(cleanHex[1] + cleanHex[1], 16); b = parseInt(cleanHex[2] + cleanHex[2], 16); }
  else if (cleanHex.length === 6) { r = parseInt(cleanHex[0] + cleanHex[1], 16); g = parseInt(cleanHex[2] + cleanHex[3], 16); b = parseInt(cleanHex[4] + cleanHex[5], 16); }
  return `${r}, ${g}, ${b}`;
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Error capturado:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || (this.state.error ? this.state.error.toString() : "Error desconocido");
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
          <AlertTriangle size={64} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-black mb-2">Algo salió mal</h1>
          <p className="text-slate-400 text-center mb-6 max-w-lg">Ocurrió un error al cargar la interfaz.</p>
          <pre className="bg-black/50 p-4 rounded-xl text-xs text-red-400 overflow-auto max-w-2xl w-full border border-red-500/20">{errorMessage}</pre>
          <button onClick={() => window.location.reload()} className="mt-6 bg-lime-500 text-black font-black px-6 py-3 rounded-xl hover:bg-lime-400">Recargar Aplicación</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- COMPONENTES UI Y MODALES ---
function NavButton({ icon, label, active, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all font-bold text-sm md:text-base ${active ? 'theme-primary-bg text-black shadow-lg scale-105' : `opacity-70 hover:opacity-100 hover:bg-white/10 ${className}`}`}>
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function TeamDetailModal({ team, players, teams, matches, tournaments, onClose, onPlayerClick, config }) {
  if (!team) return null;
  const p1 = players.find(p => p.id === team.player1Id);
  const p2 = players.find(p => p.id === team.player2Id);
  const p3 = players.find(p => p.id === team.player3Id);
  const teamMatches = matches.filter(m => m.team1Id === team.id || m.team2Id === team.id).sort((a,b) => b.createdAt - a.createdAt);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="theme-bg-card border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full hover:bg-white/20 text-white transition-colors"><X size={20}/></button>
        <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/10 relative overflow-hidden">
           {team.photoUrl && <div className="absolute inset-0 opacity-20 bg-cover bg-center blur-sm" style={{backgroundImage: `url(${team.photoUrl})`}}></div>}
           <div className="w-20 h-20 rounded-full bg-black/50 border border-white/20 flex items-center justify-center z-10 overflow-hidden shrink-0">
              {team.photoUrl ? <img src={team.photoUrl} className="w-full h-full object-cover" alt="logo"/> : <Shield size={32} className="text-white"/>}
           </div>
           <div className="z-10 flex-1 min-w-0">
              <h2 className="text-3xl font-black theme-font-secondary text-white truncate">{team.name}</h2>
              {team.phone && (
                 <a href={`https://wa.me/${team.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center mt-2 text-xs font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-full transition-colors shadow-lg">
                    <Phone size={12} className="mr-1.5"/> Contactar Delegado
                 </a>
              )}
           </div>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-white">
           <div>
              <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 flex items-center"><Users className="mr-2 theme-primary-text" size={20}/> Jugadores Registrados</h3>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                 <PlayerCardVertical player={p1} onClick={() => onPlayerClick(p1?.id)} config={config} size="lg" />
                 <PlayerCardVertical player={p2} onClick={() => onPlayerClick(p2?.id)} config={config} size="lg" />
                 {p3 && <PlayerCardVertical player={p3} title="Suplente" onClick={() => onPlayerClick(p3?.id)} config={config} size="lg" />}
              </div>
           </div>
           <div>
              <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 flex items-center"><CalendarDays className="mr-2 theme-primary-text" size={20}/> Historial de Partidos</h3>
              {teamMatches.length === 0 ? (
                 <p className="opacity-60 text-sm italic">Este equipo aún no ha jugado partidos oficiales.</p>
              ) : (
                 <div className="space-y-3">
                    {teamMatches.map(m => {
                       const isT1 = m.team1Id === team.id;
                       const oppId = isT1 ? m.team2Id : m.team1Id;
                       const opp = teams.find(t => t.id === oppId);
                       const won = m.winnerId === team.id;
                       const isPending = m.status === 'pending';
                       return (
                          <div key={m.id} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/5 p-3 rounded-xl border border-white/5 ${won ? 'border-l-4 theme-accent-border' : isPending ? 'opacity-70' : 'border-l-4 border-white/10'}`}>
                             <div className="mb-2 sm:mb-0">
                                <span className="text-[10px] uppercase font-black opacity-50 flex items-center">
                                   {m.tournamentName && <span className="mr-1 truncate max-w-[100px]">{String(m.tournamentName)} -</span>} {String(m.round || 'Partido Oficial')}
                                </span>
                                <span className="font-bold text-sm">vs {opp ? opp.name : 'Desconocido'}</span>
                             </div>
                             <div className="flex items-center gap-3 self-end sm:self-auto bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                {isPending ? <span className="text-xs font-bold opacity-60">PENDIENTE</span> : (
                                   <><span className={`font-black text-sm tracking-widest ${won ? 'theme-accent-text' : 'opacity-60'}`}>{[m.s1, m.s2, m.s3].filter(Boolean).join(' ')}</span>{won && <Medal size={16} className="theme-accent-text" />}</>
                                )}
                             </div>
                          </div>
                       )
                    })}
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}

function PlayerDetailModal({ player, matches, teams, onClose, config }) {
  if (!player) return null;
  const playerTeams = teams.filter(t => t.player1Id === player.id || t.player2Id === player.id || t.player3Id === player.id);
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="theme-bg-card border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
         <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full hover:bg-white/20 text-white transition-colors"><X size={20}/></button>
         <div className="p-8 flex flex-col items-center text-center border-b border-white/10 bg-black/20 text-white relative">
            <div className="w-28 h-40 rounded-xl bg-black/50 border-2 border-white/20 flex items-center justify-center overflow-hidden mb-4 shadow-xl">
               {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" alt="player"/> : <Users size={40} className="opacity-20"/>}
            </div>
            <h2 className="text-2xl font-black theme-font-secondary leading-tight">{player.name}</h2>
            {player.nickname && <p className="theme-primary-text font-black text-sm mt-1">"{player.nickname}"</p>}
            <div className="flex gap-2 mt-4">
               <span className="theme-primary-bg text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">{player.category}</span>
               {player.position && <span className="bg-white/10 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">{player.position}</span>}
            </div>
         </div>
         <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-white">
            {player.achievements && player.achievements.length > 0 && (
               <div>
                  <h3 className="text-xs font-black opacity-50 uppercase tracking-widest mb-3 text-center">Medallas / Logros</h3>
                  <div className="space-y-2">
                     {player.achievements.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                           <Medal size={24} className={a.type === 'oro' ? 'text-yellow-400 drop-shadow-md' : a.type === 'plata' ? 'text-slate-300' : 'text-amber-700'} />
                           <span className="text-sm font-bold opacity-90">{a.text}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
            <div>
               <h3 className="text-xs font-black opacity-50 uppercase tracking-widest mb-3 text-center">Equipos Actuales</h3>
               {playerTeams.length === 0 ? <p className="opacity-60 text-xs text-center italic">No pertenece a ningún equipo.</p> : (
                  <div className="flex flex-wrap gap-2 justify-center">
                     {playerTeams.map(t => (
                        <div key={t.id} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center">
                           {t.photoUrl ? <img src={t.photoUrl} className="w-4 h-4 rounded-full mr-2 object-cover" alt="team"/> : <Shield size={12} className="mr-2 opacity-50"/>}
                           {t.name}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )
}

function SearchableTeamSelect({ value, options, onChange, placeholder, className }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedName = options.find(o => o.id === value)?.name || '';

  useEffect(() => { if (!isOpen) setSearch(selectedName); }, [isOpen, selectedName]);
  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input type="text" value={isOpen ? search : selectedName}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(''); }}
          placeholder={placeholder} className={`${className} pr-8 truncate`}
        />
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>
      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 max-h-48 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-2xl">
          {filtered.map(o => (
            <div key={o.id} className="px-3 py-2 text-xs md:text-sm text-white font-bold hover:bg-lime-500 hover:text-slate-900 cursor-pointer border-b border-white/5 last:border-0 truncate"
              onClick={() => { onChange(o.id); setIsOpen(false); }}>
              {o.name}
            </div>
          ))}
          {filtered.length === 0 && <div className="px-3 py-2 text-xs text-slate-400 italic">No se encontraron equipos...</div>}
        </div>
      )}
    </div>
  );
}

// --- EXPORTACIÓN DE IMÁGENES (CANVAS) ---
const drawCanvasFrame = (ctx, canvas, config) => {
   if (!config.exportFrameStyle || config.exportFrameStyle === 'none') return;
   const fw = parseInt(config.exportFrameWidth) || 10;
   ctx.lineWidth = fw;
   ctx.strokeStyle = config.exportFrameColor || config.primaryColor || '#a3e635';

   const inset = fw / 2;
   if (config.exportFrameStyle === 'solid') {
       ctx.strokeRect(inset, inset, canvas.width - fw, canvas.height - fw);
   } else if (config.exportFrameStyle === 'double') {
       ctx.lineWidth = Math.max(1, fw / 3);
       ctx.strokeRect(inset, inset, canvas.width - fw, canvas.height - fw);
       const innerInset = inset + fw;
       ctx.strokeRect(innerInset, innerInset, canvas.width - innerInset*2, canvas.height - innerInset*2);
   }
};

const drawExportFooter = async (ctx, canvas, config, clubs) => {
    if (!config.exportShowSponsors || !clubs) return;
    const sponsors = clubs.filter(c => c.type === 'sponsor' && c.photoUrl);
    if (sponsors.length === 0) return;

    const iconSize = 70;
    const gap = 25;
    const totalWidth = sponsors.length * iconSize + (sponsors.length - 1) * gap;
    let startX = (canvas.width - totalWidth) / 2;
    
    const fw = parseInt(config.exportFrameWidth) || 0;
    const paddingBottom = config.exportFrameStyle !== 'none' ? fw + 40 : 50; // Aumento del padding inferior
    const y = canvas.height - iconSize - paddingBottom; 

    ctx.textAlign = 'center';
    ctx.fillStyle = config.textColor || '#ffffff';
    ctx.font = `bold 16px "${config.fontPrimary || 'sans-serif'}"`;
    ctx.fillText("SPONSORS OFICIALES", canvas.width / 2, y - 20);

    for (const sponsor of sponsors) {
        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = sponsor.photoUrl;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.roundRect(startX, y, iconSize, iconSize, 12);
            ctx.fill();

            const scale = Math.min(iconSize / img.width, iconSize / img.height) * 0.8;
            const dw = img.width * scale;
            const dh = img.height * scale;
            const dx = startX + (iconSize - dw) / 2;
            const dy = y + (iconSize - dh) / 2;

            ctx.drawImage(img, dx, dy, dw, dh);
        } catch(e) {}
        startX += iconSize + gap;
    }
};

const drawCanvasHeader = async (ctx, canvas, config) => {
   let startYText = 100;
   const fontSecondary = config.fontSecondary || 'sans-serif';
   if (config.exportWithBg !== false && config.logoUrl) {
       try {
           const logo = new Image();
           logo.crossOrigin = "Anonymous";
           logo.src = config.logoUrl;
           await new Promise((resolve, reject) => { logo.onload = resolve; logo.onerror = reject; });
           ctx.drawImage(logo, canvas.width / 2 - 60, 40, 120, 120);
           startYText = 210;
       } catch(e) {}
   }
   ctx.textAlign = 'center'; 
   ctx.fillStyle = config.titleColor || config.primaryColor || '#ffffff'; 
   ctx.font = `bold 50px "${fontSecondary}"`; 
   ctx.fillText(config.pageName ? config.pageName.toUpperCase() : 'LA SUPER LIGA', canvas.width / 2, startYText);
   return startYText;
};

const drawCanvasBg = async (ctx, canvas, config, isExport = true) => {
   const useExportBgUrl = isExport && config.exportBgUrl !== undefined && config.exportBgUrl !== '';
   const finalBgUrl = useExportBgUrl ? config.exportBgUrl : (config.exportWithBg !== false ? config.bgUrl : null);
   
   const overlayColor = isExport ? (config.exportOverlayColor || config.bgColor || '#020617') : (config.bgColor || '#020617');
   const overlayOpacity = isExport ? ((config.exportOverlayOpacity !== undefined) ? config.exportOverlayOpacity / 100 : 0.8) : ((config.bgOpacity !== undefined) ? config.bgOpacity / 100 : 0.85);
   const rgb = hexToRgb(overlayColor);

   if (finalBgUrl) {
      try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = finalBgUrl;
          await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
          
          const canvasRatio = canvas.width / canvas.height;
          const imgRatio = img.width / img.height;
          let drawWidth, drawHeight, offsetX, offsetY;

          if (imgRatio > canvasRatio) {
              drawHeight = canvas.height;
              drawWidth = img.width * (canvas.height / img.height);
              offsetX = (canvas.width - drawWidth) / 2;
              offsetY = 0;
          } else {
              drawWidth = canvas.width;
              drawHeight = img.height * (canvas.width / img.width);
              offsetX = 0;
              offsetY = (canvas.height - drawHeight) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          ctx.fillStyle = `rgba(${rgb}, ${overlayOpacity})`; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      } catch(e) {
          ctx.fillStyle = `rgba(${rgb}, 1)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
  } else {
      ctx.fillStyle = `rgba(${rgb}, 1)`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// --- APLICACIÓN PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [torneosTab, setTorneosTab] = useState('activos'); 
  const [userRole, setUserRole] = useState('user'); 
  const [adminPin, setAdminPin] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [viewingTeam, setViewingTeam] = useState(null);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [news, setNews] = useState([]);
  const [clubs, setClubs] = useState([]);
  
  const [config, setConfig] = useState({
    pageName: 'La Super Liga', showPageName: true, pageNameSize: 'text-2xl', titleColor: '#a3e635', logoSize: 'h-12 w-12 md:h-14 md:w-14',
    primaryColor: '#a3e635', accentColor: '#fbbf24', bgColor: '#020617', bgOpacity: 85, cardColor: '#0f172a', textColor: '#f8fafc',
    logoUrl: '', bgUrl: 'https://images.unsplash.com/photo-1622204554308-5925bb0902fb?q=80&w=2000&auto=format&fit=crop', 
    exportWithBg: true, exportBgUrl: '', exportOverlayColor: '#020617', exportOverlayOpacity: 85, exportFrameStyle: 'none', exportFrameColor: '#a3e635', exportFrameWidth: 10, exportShowSponsors: false,
    adminPin: 'padel2026', superAdminPin: 'super2026', 
    showWelcomeMessage: true, welcomeTitle: '¡Bienvenido a la web oficial de La Super Liga!', welcomeSubtitle: 'La mejor liga de General Roca',
    welcomeTitleColor: '#ffffff', welcomeSubtitleColor: '#a3e635', welcomeTitleSize: 'text-4xl md:text-5xl', welcomeSubtitleSize: 'text-lg md:text-xl',
    fontPrimary: 'system-ui, sans-serif', fontSecondary: 'system-ui, sans-serif', resultCardSize: 'md',
    feature_background: true, feature_welcome: true, feature_identity: true, feature_colors: true,
    feature_stats: true, feature_medals: true, feature_news: true, feature_cardSize: true, feature_fonts: true, feature_clubs: true
  });

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (error) { console.error("Error:", error); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubPlayers = onSnapshot(collection(db, getCollectionPath('players')), (snapshot) => setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubTeams = onSnapshot(collection(db, getCollectionPath('teams')), (snapshot) => setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMatches = onSnapshot(collection(db, getCollectionPath('matches')), (snapshot) => setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubTournaments = onSnapshot(collection(db, getCollectionPath('tournaments')), (snapshot) => setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubNews = onSnapshot(collection(db, getCollectionPath('news')), (snapshot) => setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubClubs = onSnapshot(collection(db, getCollectionPath('clubs')), (snapshot) => setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubConfig = onSnapshot(doc(db, getCollectionPath('settings'), 'main'), (docSnap) => { 
       if (docSnap.exists()) { setConfig(prev => ({ ...prev, ...docSnap.data() })); }
    });

    return () => { unsubPlayers(); unsubTeams(); unsubMatches(); unsubTournaments(); unsubNews(); unsubClubs(); unsubConfig(); };
  }, [user]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === config.superAdminPin) { setUserRole('superadmin'); setAdminPin(''); setLoginError(''); } 
    else if (adminPin === config.adminPin) { setUserRole('admin'); setAdminPin(''); setLoginError(''); } 
    else { setLoginError("PIN incorrecto."); }
  };
  const handleAdminLogout = () => { setUserRole('user'); setActiveTab('inicio'); }

  const openTeamDetails = (teamId) => { if(!teamId) return; const team = teams.find(t => t.id === teamId); if(team) setViewingTeam(team); }
  const openPlayerDetails = (playerId) => { if(!playerId) return; const player = players.find(p => p.id === playerId); if(player) setViewingPlayer(player); }

  const getTeam = (teamId) => teams.find(t => t.id === teamId) || { name: 'Equipo Desconocido', player1Id: '', player2Id: '', player3Id: '', photoUrl: '', phone: '' };
  const getTeamPhone = (team) => { return team?.phone || null; };

  const handleClearAllResults = async () => {
    const completed = matches.filter(m => m.status === 'completed');
    for (const match of completed) { await deleteDoc(doc(db, getCollectionPath('matches'), match.id)); }
    setConfirmClearAll(false);
  };

  const handleShareCanvas = async (canvas, filename, action) => {
    const dataUrl = canvas.toDataURL('image/png');
    if (action === 'download') {
        const link = document.createElement('a'); link.download = filename; link.href = dataUrl; link.click(); return;
    }
    if (action === 'whatsapp') {
        try {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ title: 'Resultados Oficiales', files: [file] });
            } else {
                alert('Tu navegador no soporta compartir imágenes directo a WhatsApp. Se descargará la imagen para que la envíes manualmente.');
                const link = document.createElement('a'); link.download = filename; link.href = dataUrl; link.click();
            }
        } catch (error) {
            console.error("Error sharing:", error);
            const link = document.createElement('a'); link.download = filename; link.href = dataUrl; link.click();
        }
    }
  };

  const shareResultAsImage = async (match, team1, team2, action) => {
    const canvas = document.createElement('canvas'); canvas.width = 1080; 
    canvas.height = 1080 + (config.exportShowSponsors ? 180 : 0); 
    const ctx = canvas.getContext('2d');
    
    await drawCanvasBg(ctx, canvas, config, true);
    const headerY = await drawCanvasHeader(ctx, canvas, config);

    const fontSecondary = config.fontSecondary || 'sans-serif';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = config.textColor || '#94a3b8'; ctx.font = `bold 35px "${fontSecondary}"`; 
    ctx.fillText(match.round || 'Partido Oficial', canvas.width / 2, headerY + 80);

    const yCenter = headerY + 300;
    
    const drawTeamHorizontal = async (team, isWinner, xPos) => {
       ctx.font = isWinner ? `bold 45px "${fontSecondary}"` : `bold 35px "${fontSecondary}"`;
       let text = team.name;
       if (isWinner) text += ' 🏆';
       
       const textWidth = ctx.measureText(text).width;
       const logoSize = 80;
       const gap = 20;
       const totalWidth = team.photoUrl ? (logoSize + gap + textWidth) : textWidth;
       let startX = xPos - totalWidth / 2;
       
       if (team.photoUrl) {
           try {
               const img = new Image(); img.crossOrigin = "Anonymous"; img.src = team.photoUrl;
               await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
               
               ctx.save(); ctx.beginPath(); ctx.arc(startX + logoSize/2, yCenter, logoSize/2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
               ctx.fillStyle = config.cardColor || '#1e293b'; ctx.fill();
               const size = Math.max(img.width, img.height); const scale = logoSize / size;
               const dx = (logoSize - img.width * scale) / 2; const dy = (logoSize - img.height * scale) / 2;
               ctx.drawImage(img, startX + dx, yCenter - logoSize/2 + dy, img.width * scale, img.height * scale);
               ctx.restore();
               ctx.beginPath(); ctx.arc(startX + logoSize/2, yCenter, logoSize/2, 0, Math.PI * 2);
               ctx.lineWidth = 4; ctx.strokeStyle = isWinner ? (config.accentColor || '#fbbf24') : 'rgba(255,255,255,0.2)'; ctx.stroke();
               startX += logoSize + gap;
           } catch(e) {}
       }
       ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
       ctx.fillStyle = isWinner ? (config.accentColor || '#fbbf24') : 'rgba(255,255,255,0.75)';
       ctx.fillText(text, startX, yCenter);
    };

    const isW1 = match.winnerId === team1.id; const isW2 = match.winnerId === team2.id;
    await drawTeamHorizontal(team1, isW1, 270);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = config.primaryColor || '#a3e635'; ctx.font = `italic bold 45px "${fontSecondary}"`; 
    ctx.fillText('VS', 540, yCenter);
    await drawTeamHorizontal(team2, isW2, 810);

    const scoreText = [match.s1, match.s2, match.s3].filter(Boolean).join(' ') || (typeof match.score === 'string' ? match.score : '');
    const boxY = headerY + 480;
    
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 20;
    const rgbaCard = `rgba(${hexToRgb(config.cardColor || '#0f172a')}, 0.9)`;
    ctx.fillStyle = rgbaCard; 
    ctx.beginPath(); ctx.roundRect(canvas.width/2 - 350, boxY, 700, 180, 25); ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = config.primaryColor || '#a3e635'; ctx.lineWidth = 5; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = config.primaryColor || '#a3e635'; ctx.font = `bold 25px "${fontSecondary}"`; 
    ctx.fillText('RESULTADO FINAL', canvas.width / 2, boxY + 50);
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 85px "${fontSecondary}"`; 
    ctx.fillText(scoreText, canvas.width / 2, boxY + 130);

    await drawExportFooter(ctx, canvas, config, clubs); 
    drawCanvasFrame(ctx, canvas, config); 
    await handleShareCanvas(canvas, `resultado-${match.round || 'liga'}.png`, action);
  };

  const exportZonesAsImage = async (tournament, allTeams, config, clubs) => {
    if (!tournament.zones || tournament.zones.length === 0) return null;

    const canvas = document.createElement('canvas');
    const rowHeight = 40;
    const zoneHeaderHeight = 60;
    let totalRows = 0;
    tournament.zones.forEach(z => totalRows += z.teams.length);
    
    const sponsorHeight = (config.exportShowSponsors && clubs && clubs.some(c=>c.type==='sponsor')) ? 180 : 0;
    
    canvas.width = 1100;
    const baseHeight = 350 + (tournament.zones.length * zoneHeaderHeight) + (totalRows * rowHeight) + (tournament.zones.length * 40);
    canvas.height = baseHeight + 120 + sponsorHeight;
    const ctx = canvas.getContext('2d');

    await drawCanvasBg(ctx, canvas, config, true);
    
    const headerY = await drawCanvasHeader(ctx, canvas, config);
    const fontSecondary = config.fontSecondary || 'sans-serif';
    const fontPrimary = config.fontPrimary || 'sans-serif';

    ctx.fillStyle = config.primaryColor || '#a3e635'; ctx.font = `bold 30px "${fontSecondary}"`; 
    ctx.fillText(String(tournament.name).toUpperCase() + ' - POSICIONES', canvas.width / 2, headerY + 60);

    let currentY = headerY + 120;
    const cardRgb = hexToRgb(config.cardColor || '#1e293b');

    tournament.zones.forEach(zone => {
      const sortedTeams = [...zone.teams].sort((a,b) => {
         if (b.pts !== a.pts) return b.pts - a.pts;
         const diffB = (b.sf || 0) - (b.sc || 0); const diffA = (a.sf || 0) - (a.sc || 0);
         if (diffB !== diffA) return diffB - diffA;
         return (b.sf || 0) - (a.sf || 0);
      });

      ctx.fillStyle = `rgba(${cardRgb}, 0.8)`; ctx.beginPath(); ctx.roundRect(40, currentY, canvas.width - 80, 40, 8); ctx.fill();
      ctx.textAlign = 'left'; ctx.fillStyle = config.textColor || '#ffffff'; ctx.font = `bold 20px "${fontSecondary}"`;
      ctx.fillText(String(zone.name), 60, currentY + 28);
      currentY += 60;

      ctx.fillStyle = config.textColor || '#94a3b8'; ctx.font = `bold 14px "${fontPrimary}"`;
      ctx.fillText('EQUIPO', 60, currentY);
      ctx.textAlign = 'center';
      ctx.fillStyle = config.primaryColor || '#a3e635'; ctx.fillText('PTS', 650, currentY);
      ctx.fillStyle = config.textColor || '#94a3b8';
      ctx.fillText('PJ', 750, currentY); ctx.fillText('PG', 830, currentY); ctx.fillText('SF', 910, currentY); ctx.fillText('SC', 990, currentY);
      currentY += 25;

      sortedTeams.forEach((t, i) => {
         const tName = allTeams.find(tm => tm.id === t.teamId)?.name || t.name || 'Desconocido';
         ctx.textAlign = 'left'; ctx.fillStyle = config.textColor || '#ffffff'; ctx.font = `bold 18px "${fontPrimary}"`;
         ctx.fillText(`${i+1}. ${tName}`, 60, currentY + 25);
         ctx.textAlign = 'center';
         ctx.fillStyle = config.primaryColor || '#a3e635'; ctx.fillText(String(t.pts), 650, currentY + 25);
         ctx.fillStyle = config.textColor || '#e2e8f0';
         ctx.fillText(String(t.pj), 750, currentY + 25); ctx.fillText(String(t.pg), 830, currentY + 25); ctx.fillText(String(t.sf || 0), 910, currentY + 25); ctx.fillText(String(t.sc || 0), 990, currentY + 25);
         
         ctx.strokeStyle = `rgba(${cardRgb}, 0.5)`; ctx.lineWidth = 1;
         ctx.beginPath(); ctx.moveTo(50, currentY + 40); ctx.lineTo(canvas.width - 50, currentY + 40); ctx.stroke();
         currentY += rowHeight + 5;
      });
      currentY += 40; 
    });
    
    await drawExportFooter(ctx, canvas, config, clubs);
    drawCanvasFrame(ctx, canvas, config); 
    return canvas;
  }

  const exportBracketAsImage = async (tournament, allTeams, config, clubs) => {
    const validBrackets = tournament.brackets || [];
    if (validBrackets.length === 0) return null;

    const finalRound = validBrackets.find(b => b.matches.length === 1);
    const regularRounds = validBrackets.filter(b => b.matches.length > 1);

    const boxW = 280; const boxH = 90; const colW = 340; 
    const maxDepth = regularRounds.length;
    const requiredWidth = 50 * 2 + (maxDepth * 2) * colW + boxW + 200; 
    const maxMatches = regularRounds[0]?.matches.length || 1;
    
    const sponsorHeight = (config.exportShowSponsors && clubs && clubs.some(c=>c.type==='sponsor')) ? 180 : 0;
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1600, requiredWidth); 
    canvas.height = Math.max(1080, 400 + (maxMatches / 2) * 140 + 150) + sponsorHeight; 
    const ctx = canvas.getContext('2d');
    
    const fontSecondary = config.fontSecondary || 'sans-serif';
    const fontPrimary = config.fontPrimary || 'sans-serif';

    await drawCanvasBg(ctx, canvas, config, true);

    const headerY = await drawCanvasHeader(ctx, canvas, config);
    ctx.textAlign = 'center'; 
    ctx.fillStyle = config.primaryColor || '#a3e635'; ctx.font = `bold 40px "${fontSecondary}"`; 
    ctx.fillText(String(tournament.name).toUpperCase() + ' - FASE ELIMINATORIA', canvas.width / 2, headerY + 60);

    const getTName = (id) => { if (!id) return 'Por definir'; const t = allTeams.find(tm => tm.id === id); return t ? t.name : 'Por definir'; };
    const cardRgb = hexToRgb(config.cardColor || '#1e293b');

    const drawMatchBox = (m, x, y, roundName, isLeft, isFinal=false) => {
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 5;
      ctx.fillStyle = `rgba(${cardRgb}, 0.9)`; ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 10); ctx.fill(); ctx.shadowBlur = 0; 
      ctx.strokeStyle = isFinal ? (config.accentColor || '#fbbf24') : 'rgba(255,255,255,0.1)'; ctx.lineWidth = isFinal ? 3 : 2; ctx.stroke();
      
      ctx.textAlign = 'center'; ctx.fillStyle = isFinal ? (config.accentColor || '#fbbf24') : (config.primaryColor || '#a3e635'); ctx.font = `bold 12px "${fontPrimary}"`; 
      ctx.fillText(String(roundName).toUpperCase(), x + boxW/2, y - 10);

      const t1Name = getTName(m.team1Id); const t2Name = getTName(m.team2Id); const wId = m.winnerId;
      const txtColor = config.textColor || '#ffffff';

      ctx.font = (wId === m.team1Id) ? `bold 18px "${fontPrimary}"` : `18px "${fontPrimary}"`; ctx.fillStyle = (wId === m.team1Id) ? txtColor : 'rgba(255,255,255,0.5)'; ctx.textAlign = 'left'; ctx.fillText(t1Name, x + 15, y + 35);
      ctx.font = (wId === m.team2Id) ? `bold 18px "${fontPrimary}"` : `18px "${fontPrimary}"`; ctx.fillStyle = (wId === m.team2Id) ? txtColor : 'rgba(255,255,255,0.5)'; ctx.fillText(t2Name, x + 15, y + 70);

      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 10, y + 50); ctx.lineTo(x + boxW - 10, y + 50); ctx.stroke();

      const scoreText = [m.s1, m.s2, m.s3].filter(Boolean).join(' ') || (typeof m.score === 'string' ? m.score : '');
      if (scoreText) { ctx.textAlign = 'right'; ctx.fillStyle = isFinal ? (config.accentColor || '#fbbf24') : (config.primaryColor || '#a3e635'); ctx.font = `bold 16px "${fontSecondary}"`; ctx.fillText(scoreText, x + boxW - 15, y + 52); }
    };

    const startYBase = headerY + 160;
    const calcY = (rIdx, mIdx) => {
       const spacing = 140 * Math.pow(2, rIdx);
       const startY = startYBase + (spacing - 140) / 2;
       return startY + mIdx * spacing;
    }
    
    regularRounds.forEach((r, rIdx) => {
      const matchesLeft = r.matches.slice(0, Math.ceil(r.matches.length / 2));
      const xPos = 50 + (rIdx * colW); 
      matchesLeft.forEach((m, mIdx) => { drawMatchBox(m, xPos, calcY(rIdx, mIdx), r.round, true); });
    });
    regularRounds.forEach((r, rIdx) => {
      const matchesRight = r.matches.slice(Math.ceil(r.matches.length / 2));
      const xPos = canvas.width - 50 - boxW - (rIdx * colW); 
      matchesRight.forEach((m, mIdx) => { drawMatchBox(m, xPos, calcY(rIdx, mIdx), r.round, false); });
    });

    if (finalRound && finalRound.matches[0]) {
       const finalY = calcY(regularRounds.length > 0 ? regularRounds.length - 1 : 0, 0);
       drawMatchBox(finalRound.matches[0], (canvas.width / 2) - (boxW/2), finalY, finalRound.round, false, true);
       ctx.textAlign = 'center'; ctx.fillStyle = config.accentColor || '#fbbf24'; ctx.font = `bold 40px "${fontSecondary}"`; ctx.fillText('🏆 GANADOR', canvas.width / 2, finalY - 40);
    }
    
    await drawExportFooter(ctx, canvas, config, clubs);
    drawCanvasFrame(ctx, canvas, config); 
    return canvas;
  };

  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';
  const cardSizeClasses = {
     sm: { pad: 'p-4 pt-6', text: 'text-base md:text-lg', icon: 'w-5 h-5', resultText: 'text-xl' },
     md: { pad: 'p-6 pt-8', text: 'text-lg md:text-xl', icon: 'w-6 h-6', resultText: 'text-2xl' },
     lg: { pad: 'p-8 pt-10', text: 'text-xl md:text-2xl', icon: 'w-8 h-8', resultText: 'text-3xl' }
  }[config.resultCardSize || 'md'];

  const themeBgColor = config.bgColor || '#020617';
  const themeBgOpacity = config.bgOpacity !== undefined ? config.bgOpacity / 100 : 0.85;

  return (
    <ErrorBoundary>
    <div className="min-h-screen font-sans selection:bg-black selection:text-white relative overflow-x-hidden theme-text theme-font-primary">
      <style>{`
        .theme-font-primary { font-family: ${config.fontPrimary || 'system-ui, sans-serif'}; }
        h1, h2, h3, h4, h5, h6, .font-black, .theme-font-secondary { font-family: ${config.fontSecondary || config.fontPrimary || 'system-ui, sans-serif'}; }
        .theme-text { color: ${config.textColor || '#f8fafc'}; }
        .theme-title-text { color: ${config.titleColor || config.primaryColor || '#a3e635'}; }
        .theme-bg-base { background-color: rgba(${hexToRgb(themeBgColor)}, ${themeBgOpacity}); }
        .theme-bg-card { background-color: rgba(${hexToRgb(config.cardColor || '#0f172a')}, 0.8); }
        .theme-primary-text { color: ${config.primaryColor || '#a3e635'}; }
        .theme-primary-bg { background-color: ${config.primaryColor || '#a3e635'}; color: #000; }
        .theme-primary-border { border-color: ${config.primaryColor || '#a3e635'}; }
        .theme-accent-text { color: ${config.accentColor || '#fbbf24'}; }
        .theme-accent-bg { background-color: ${config.accentColor || '#fbbf24'}; color: #000; }
        .theme-accent-border { border-color: ${config.accentColor || '#fbbf24'}; }
      `}</style>

      <div className="fixed inset-0 z-0">
         <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${config.bgUrl})` }} />
         <div className="absolute inset-0 backdrop-blur-sm theme-bg-base" />
      </div>

      <div className="relative z-10">
        <nav className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-2 md:px-4">
            <div className="flex justify-between items-center h-16 md:h-18 py-2">
              <div className="flex items-center space-x-3 cursor-pointer shrink-0 mr-2 md:mr-4" onClick={() => setActiveTab('inicio')}>
                {config.logoUrl ? 
                   <img src={config.logoUrl} alt="Logo" className={`${config.logoSize || 'h-12 w-12 md:h-14 md:w-14'} object-contain drop-shadow-lg`} /> : 
                   <div className={`${config.logoSize || 'h-12 w-12 md:h-14 md:w-14'} rounded-full theme-primary-bg flex items-center justify-center shrink-0`}><Trophy className="w-1/2 h-1/2" /></div>
                }
                {config.showPageName && (
                   <span className={`font-black ${config.pageNameSize || 'text-2xl'} tracking-tight uppercase italic drop-shadow-md hidden sm:inline theme-title-text theme-font-secondary`}>{config.pageName || 'La Super Liga'}</span>
                )}
              </div>
              
              <div className="hidden md:flex space-x-1 items-center">
                <NavButton icon={<Trophy />} label="Inicio" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
                <NavButton icon={<CalendarDays />} label="Grilla VS" active={activeTab === 'grilla'} onClick={() => setActiveTab('grilla')} />
                <NavButton icon={<LayoutList />} label="Torneos" active={activeTab === 'torneos'} onClick={() => setActiveTab('torneos')} />
                <NavButton icon={<Users />} label="Jugadores" active={activeTab === 'jugadores'} onClick={() => setActiveTab('jugadores')} />
                {config.feature_clubs !== false && <NavButton icon={<MapPin />} label="Clubes" active={activeTab === 'clubes'} onClick={() => setActiveTab('clubes')} />}
                {isAdminOrSuper ? (
                  <div className="flex items-center">
                    <NavButton icon={<Settings />} label="Panel" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} className="theme-primary-text ml-4" />
                    <button onClick={handleAdminLogout} className="flex items-center space-x-2 px-3 py-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors ml-2 rounded-lg border border-red-500/30">
                      <LogOut size={16} /> <span>Salir</span>
                    </button>
                  </div>
                ) : (
                  <NavButton icon={<ShieldCheck />} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
                )}
              </div>

              {/* FIX: BARRA NAVEGACIÓN MÓVIL DESLIZABLE */}
              <div className="md:hidden flex-1 flex justify-end overflow-hidden">
                <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1 pl-2 pr-1 w-full justify-end flex-nowrap">
                   <button onClick={() => setActiveTab('inicio')} className={`p-2 shrink-0 rounded-lg ${activeTab === 'inicio' ? 'bg-white/10 theme-primary-text' : 'opacity-60'}`}><Trophy size={20} /></button>
                   <button onClick={() => setActiveTab('grilla')} className={`p-2 shrink-0 rounded-lg ${activeTab === 'grilla' ? 'bg-white/10 theme-primary-text' : 'opacity-60'}`}><CalendarDays size={20} /></button>
                   <button onClick={() => setActiveTab('torneos')} className={`p-2 shrink-0 rounded-lg ${activeTab === 'torneos' ? 'bg-white/10 theme-primary-text' : 'opacity-60'}`}><LayoutList size={20} /></button>
                   <button onClick={() => setActiveTab('jugadores')} className={`p-2 shrink-0 rounded-lg ${activeTab === 'jugadores' ? 'bg-white/10 theme-primary-text' : 'opacity-60'}`}><Users size={20} /></button>
                   {config.feature_clubs !== false && <button onClick={() => setActiveTab('clubes')} className={`p-2 shrink-0 rounded-lg ${activeTab === 'clubes' ? 'bg-white/10 theme-primary-text' : 'opacity-60'}`}><MapPin size={20} /></button>}
                   <button onClick={() => setActiveTab('admin')} className={`p-2 shrink-0 rounded-lg ${activeTab === 'admin' ? 'bg-white/10 theme-primary-text' : 'opacity-60'}`}>
                     {isAdminOrSuper ? <Settings size={20} /> : <ShieldCheck size={20} />}
                   </button>
                   {isAdminOrSuper && <button onClick={handleAdminLogout} className="p-2 shrink-0 rounded-lg text-red-400 bg-red-500/10"><LogOut size={20} /></button>}
                </div>
              </div>
              
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {activeTab === 'inicio' && (
            <div className="animate-in fade-in duration-500">
              {config.feature_welcome !== false && config.showWelcomeMessage !== false && (
                 <div className="text-center mb-12 animate-in slide-in-from-top-4 duration-700">
                    <h1 className={`font-black tracking-tight drop-shadow-lg mb-2 theme-font-secondary ${config.welcomeTitleSize || 'text-4xl md:text-5xl'}`} style={{ color: config.welcomeTitleColor || '#ffffff' }}>{config.welcomeTitle || '¡Bienvenido a La Super Liga!'}</h1>
                    <p className={`font-bold drop-shadow-md opacity-90 ${config.welcomeSubtitleSize || 'text-lg md:text-xl'}`} style={{ color: config.welcomeSubtitleColor || config.primaryColor || '#a3e635' }}>{config.welcomeSubtitle || 'La mejor liga de General Roca'}</p>
                 </div>
              )}

              {config.feature_clubs !== false && clubs.length > 0 && (
                 <div className="mb-12 bg-black/20 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-60 text-center mb-6">Sedes y Sponsors Oficiales</h3>
                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 items-center">
                       {clubs.map(c => (
                          <div key={c.id} className={`flex flex-col items-center group ${c.type !== 'sponsor' ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={() => { if(c.type !== 'sponsor') setActiveTab('clubes'); }}>
                             <div className={`w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full p-2 mb-2 border border-white/10 transition-colors ${c.type !== 'sponsor' ? 'group-hover:theme-primary-border' : ''}`}>
                               {c.photoUrl ? <img src={c.photoUrl} alt={c.name} className="w-full h-full object-contain drop-shadow-lg" /> : <MapPin className="w-full h-full opacity-30 p-4" />}
                             </div>
                             <span className={`text-[10px] md:text-xs font-bold opacity-50 uppercase tracking-wider transition-colors ${c.type !== 'sponsor' ? 'group-hover:theme-primary-text' : ''}`}>{c.name}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {config.feature_news !== false && news.length > 0 && (
                <div className="mb-12 space-y-4">
                  <h2 className="text-2xl font-black uppercase tracking-wider flex items-center theme-font-secondary"><Bell className="mr-3 theme-accent-text" /> Novedades Importantes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {news.sort((a,b)=>b.createdAt - a.createdAt).map(n => (
                      <div key={n.id} className={`p-6 rounded-2xl border backdrop-blur-md shadow-lg ${n.type === 'alert' ? 'bg-red-500/10 border-red-500/30' : 'theme-bg-card border-white/10'}`}>
                        <div className="flex items-start gap-3">
                          {n.type === 'alert' ? <AlertTriangle className="text-red-400 mt-1 flex-shrink-0" /> : <FileText className="theme-primary-text mt-1 flex-shrink-0" />}
                          <div><h3 className={`font-bold text-lg mb-2 ${n.type === 'alert' ? 'text-red-300' : ''}`}>{n.title}</h3><p className="opacity-80 text-sm whitespace-pre-wrap leading-relaxed">{n.content}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-black uppercase tracking-wider flex items-center theme-font-secondary"><CheckCircle2 className="mr-3 theme-primary-text" /> Últimos Resultados</h2>
                {isAdminOrSuper && matches.filter(m => m.status === 'completed').length > 0 && (
                  confirmClearAll ? (
                     <div className="flex items-center gap-2 bg-red-500/20 p-2 rounded-xl border border-red-500/50">
                       <span className="text-xs text-red-400 font-bold">¿Borrar TODOS?</span>
                       <button onClick={handleClearAllResults} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-lg">Sí</button>
                       <button onClick={() => setConfirmClearAll(false)} className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold">No</button>
                     </div>
                  ) : (
                     <button onClick={() => setConfirmClearAll(true)} className="flex items-center gap-2 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-xl border border-red-500/20 transition-colors shadow-sm shrink-0"><Trash2 size={16} /> Limpiar Tablero</button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.filter(m => m.status === 'completed').length === 0 && <p className="opacity-60 italic">No hay resultados cargados.</p>}
                {matches.filter(m => m.status === 'completed').sort((a,b) => b.createdAt - a.createdAt).map(match => {
                  const t1 = getTeam(match.team1Id); const t2 = getTeam(match.team2Id);
                  return (
                    <div key={match.id} className={`theme-bg-card backdrop-blur-md rounded-2xl ${cardSizeClasses.pad} border border-white/10 shadow-xl relative overflow-hidden group hover:theme-primary-border transition-colors`}>
                      {isAdminOrSuper && (
                        <div className="absolute top-2 left-2 z-20">
                          {confirmDeleteMatchId === match.id ? (
                             <div className="flex items-center gap-1 bg-black/80 p-1 rounded-lg border border-red-500 shadow-xl">
                               <button onClick={() => { deleteDoc(doc(db, getCollectionPath('matches'), match.id)); setConfirmDeleteMatchId(null); }} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">Sí</button>
                               <button onClick={() => setConfirmDeleteMatchId(null)} className="bg-white/20 text-white px-2 py-0.5 rounded text-xs font-bold">No</button>
                             </div>
                          ) : (
                             <button onClick={() => setConfirmDeleteMatchId(match.id)} className="p-1.5 bg-black/40 hover:bg-red-500/80 text-white/50 hover:text-white rounded-lg transition-colors border border-white/10 shadow"><X size={14} /></button>
                          )}
                        </div>
                      )}
                      <div className="absolute top-0 right-0 theme-primary-bg font-bold px-4 py-1.5 rounded-bl-xl shadow-lg text-xs uppercase text-black text-right">
                         {match.tournamentName && <div className="text-[9px] opacity-80 leading-none mb-0.5">{String(match.tournamentName)}</div>}
                         <div>{String(match.round || 'Amistoso')}</div>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div className={`flex justify-between items-center ${match.winnerId === t1.id ? 'font-black opacity-100' : 'font-semibold opacity-60'}`}>
                          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-colors flex-1" onClick={() => openTeamDetails(t1.id)}>
                             {t1.photoUrl ? <img src={t1.photoUrl} className={`${cardSizeClasses.icon} rounded-full object-cover border border-white/10 shrink-0`} alt="logo" /> : <Shield className={`${cardSizeClasses.icon} shrink-0`} />}
                             <span className={`${cardSizeClasses.text} truncate`}>{t1.name}</span>
                          </div>
                          {match.winnerId === t1.id && <Medal className={`${cardSizeClasses.icon} theme-primary-text shrink-0 ml-2`} />}
                        </div>
                        <div className={`flex justify-between items-center ${match.winnerId === t2.id ? 'font-black opacity-100' : 'font-semibold opacity-60'}`}>
                           <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-colors flex-1" onClick={() => openTeamDetails(t2.id)}>
                             {t2.photoUrl ? <img src={t2.photoUrl} className={`${cardSizeClasses.icon} rounded-full object-cover border border-white/10 shrink-0`} alt="logo" /> : <Shield className={`${cardSizeClasses.icon} shrink-0`} />}
                             <span className={`${cardSizeClasses.text} truncate`}>{t2.name}</span>
                          </div>
                          {match.winnerId === t2.id && <Medal className={`${cardSizeClasses.icon} theme-primary-text shrink-0 ml-2`} />}
                        </div>
                      </div>
                      <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center">
                        <span className={`${cardSizeClasses.resultText} font-black tracking-widest theme-accent-text theme-font-secondary`}>{[match.s1, match.s2, match.s3].filter(Boolean).join(' ') || (typeof match.score === 'string' ? match.score : '')}</span>
                        <div className="flex gap-2 shrink-0">
                           <button onClick={() => shareResultAsImage(match, t1, t2, 'download')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><Download size={16} /></button>
                           <button onClick={() => shareResultAsImage(match, t1, t2, 'whatsapp')} className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl transition-colors"><MessageCircle size={16} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'grilla' && (
            <div className="animate-in fade-in duration-500">
               <h2 className="text-3xl font-black mb-2 uppercase tracking-wider flex items-center theme-font-secondary"><CalendarDays className="mr-3 theme-primary-text" /> Próximos Partidos</h2>
               <p className="opacity-60 mb-8 font-medium">Contacta a tus rivales y coordina el partido.</p>
               {matches.filter(m => m.status === 'pending').length === 0 && <div className="theme-bg-card backdrop-blur-md p-8 rounded-2xl text-center border border-white/10"><p className="text-lg opacity-80">No hay partidos en la grilla.</p></div>}
               <div className="space-y-10">
                 {(() => {
                    const pendingMatches = matches.filter(m => m.status === 'pending');
                    const sortedGrilla = [...pendingMatches].sort((a, b) => {
                        if (a.tournamentName !== b.tournamentName) return (a.tournamentName || '').localeCompare(b.tournamentName || '');
                        return a.createdAt - b.createdAt;
                    });
                    const groupedGrilla = sortedGrilla.reduce((groups, m) => {
                        const key = m.tournamentName ? `${m.tournamentName} - ${m.round}` : (m.round || 'Amistosos');
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(m);
                        return groups;
                    }, {});

                    return Object.entries(groupedGrilla).map(([groupName, groupMatches]) => (
                      <div key={groupName} className="space-y-4">
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest theme-accent-text border-b border-white/10 pb-2 mb-4 drop-shadow-md theme-font-secondary">{String(groupName)}</h3>
                        {groupMatches.map(match => {
                          const t1 = getTeam(match.team1Id); const t2 = getTeam(match.team2Id);
                          const t1Phone = getTeamPhone(t1); const t2Phone = getTeamPhone(t2);
                          return (
                            <div key={match.id} className="theme-bg-card backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden relative p-4 flex flex-col md:flex-row items-center justify-between gap-4 pt-10 md:pt-8">
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 theme-primary-bg font-black px-6 py-1.5 rounded-b-xl text-[10px] tracking-widest z-10 text-black uppercase">{String(match.zoneName || 'Partido Oficial')}</div>
                              
                              <div className="flex-1 flex flex-col items-center md:items-start w-full mt-2 md:mt-0">
                                <div className="flex items-center gap-2 mb-3 cursor-pointer hover:theme-primary-text" onClick={() => openTeamDetails(t1.id)}>
                                  {t1.photoUrl ? <img src={t1.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="logo" /> : <Shield size={24} className="opacity-50" />}
                                  <h3 className="text-xl font-black theme-font-secondary">{t1.name}</h3>
                                </div>
                                {t1Phone && <a href={`https://wa.me/${t1Phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-full"><Phone size={12} /> <span>{t1Phone}</span></a>}
                              </div>

                              <div className="text-2xl font-black italic opacity-20 px-4 my-2 md:my-0 theme-font-secondary">VS</div>

                              <div className="flex-1 flex flex-col items-center md:items-end w-full">
                                <div className="flex items-center gap-2 mb-3 cursor-pointer hover:theme-primary-text" onClick={() => openTeamDetails(t2.id)}>
                                  <h3 className="text-xl font-black theme-font-secondary">{t2.name}</h3>
                                  {t2.photoUrl ? <img src={t2.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="logo" /> : <Shield size={24} className="opacity-50" />}
                                </div>
                                {t2Phone && <a href={`https://wa.me/${t2Phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-full"><Phone size={12} /> <span>{t2Phone}</span></a>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
               </div>
            </div>
          )}

          {activeTab === 'torneos' && (
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <h2 className="text-3xl font-black uppercase tracking-wider flex items-center theme-font-secondary"><LayoutList className="mr-3 theme-primary-text" /> Torneos y Tablas</h2>
                  <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 w-full md:w-auto">
                     <button onClick={() => setTorneosTab('activos')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${torneosTab === 'activos' ? 'theme-primary-bg text-black shadow-lg' : 'opacity-60 hover:bg-white/5'}`}>Activos</button>
                     <button onClick={() => setTorneosTab('historial')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${torneosTab === 'historial' ? 'theme-primary-bg text-black shadow-lg' : 'opacity-60 hover:bg-white/5'}`}>Historial</button>
                  </div>
               </div>
               {tournaments.filter(t => torneosTab === 'activos' ? !t.isArchived : t.isArchived).map(tournament => (
                   <PublicTournamentCard key={tournament.id} tournament={tournament} config={config} allTeams={teams} clubs={clubs} onTeamClick={openTeamDetails} exportZonesAsImage={exportZonesAsImage} exportBracketAsImage={exportBracketAsImage} handleShareCanvas={handleShareCanvas} /> 
               ))}
            </div>
          )}

          {activeTab === 'clubes' && config.feature_clubs !== false && (
            <div className="animate-in fade-in duration-500">
               <h2 className="text-3xl font-black mb-8 uppercase tracking-wider flex items-center theme-font-secondary"><MapPin className="mr-3 theme-primary-text" /> Sedes y Clubes</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {clubs.filter(c => c.type !== 'sponsor').map(c => (
                    <div key={c.id} className="theme-bg-card backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col relative overflow-hidden group">
                       <div className="flex items-center gap-4 mb-4 relative z-10">
                          <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-2 shrink-0">
                             {c.photoUrl ? <img src={c.photoUrl} alt={c.name} className="w-full h-full object-contain drop-shadow-md" /> : <MapPin className="opacity-30" />}
                          </div>
                          <div><h3 className="text-xl font-black theme-font-secondary">{c.name}</h3></div>
                       </div>
                       <div className="mt-auto pt-4 relative z-10">
                          {c.phone ? (
                             <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-4 py-3 rounded-xl flex items-center justify-center"><MessageCircle size={18} className="mr-2" /> Reservar Cancha</a>
                          ) : ( <div className="w-full bg-white/5 opacity-50 text-center font-bold px-4 py-3 rounded-xl text-sm border border-white/10">Sin contacto</div> )}
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'jugadores' && (
            <div className="animate-in fade-in duration-500">
               <h2 className="text-3xl font-black mb-6 uppercase tracking-wider flex items-center theme-font-secondary"><Users className="mr-3 theme-primary-text" /> Jugadores Registrados</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {players.map(p => (
                    <div key={p.id} className="theme-bg-card backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center shadow-lg group hover:-translate-y-1 hover:theme-primary-border transition-all cursor-pointer" onClick={() => openPlayerDetails(p.id)}>
                      <div className="w-24 h-32 md:w-28 md:h-36 rounded-xl bg-black/20 mb-3 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:theme-primary-border">
                        {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <Users className="opacity-20 w-10 h-10" />}
                      </div>
                      <h3 className="font-bold leading-tight line-clamp-1">{p.name}</h3>
                      <span className="text-xs font-black theme-primary-bg px-3 py-1 rounded-full mt-3 text-black">{p.category}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="animate-in fade-in duration-500 relative z-20">
              {!isAdminOrSuper ? (
                <div className="max-w-md mx-auto theme-bg-card backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl mt-10">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 theme-primary-bg rounded-full flex items-center justify-center mx-auto mb-4 bg-opacity-20 border border-current text-black"><ShieldCheck className="w-10 h-10 opacity-80" /></div>
                    <h2 className="text-2xl font-black uppercase tracking-wider theme-font-secondary">Acceso Restringido</h2>
                  </div>
                  <form onSubmit={handleAdminLogin}>
                    <input type="password" placeholder="PIN de Acceso" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:theme-primary-border mb-2 text-center tracking-[0.5em] text-xl font-black shadow-inner theme-font-secondary" />
                    {loginError && <p className="text-red-400 text-xs font-bold text-center mb-4">{loginError}</p>}
                    <button type="submit" className="w-full theme-primary-bg font-black py-4 rounded-xl transition-all shadow-lg uppercase tracking-widest mt-2 hover:opacity-80 text-black">Ingresar al Panel</button>
                  </form>
                </div>
              ) : (
                <AdminDashboard userRole={userRole} players={players} teams={teams} matches={matches} tournaments={tournaments} news={news} clubs={clubs} config={config} db={db} getCollectionPath={getCollectionPath} handleShareCanvas={handleShareCanvas} openTeamDetails={openTeamDetails} exportZonesAsImage={exportZonesAsImage} exportBracketAsImage={exportBracketAsImage} />
              )}
            </div>
          )}

        </main>
      </div>

      {viewingTeam && <TeamDetailModal team={viewingTeam} players={players} teams={teams} matches={matches} tournaments={tournaments} onClose={() => setViewingTeam(null)} onPlayerClick={openPlayerDetails} config={config} />}
      {viewingPlayer && <PlayerDetailModal player={viewingPlayer} matches={matches} teams={teams} onClose={() => setViewingPlayer(null)} config={config} />}
    </div>
    </ErrorBoundary>
  );
}

// --- SUB-COMPONENTES PARA TORNEOS PÚBLICOS ---
function PublicTournamentCard({ tournament, config, allTeams, clubs, onTeamClick, exportZonesAsImage, exportBracketAsImage, handleShareCanvas }) {
  const [showRules, setShowRules] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!tournament.isArchived);
  const getZoneTeamInfo = (t) => { if(t.teamId) { const found = allTeams.find(tm => tm.id === t.teamId); return found ? { id: found.id, name: found.name, photoUrl: found.photoUrl } : { id: null, name: t.name, photoUrl: null }; } return { id: null, name: t.name, photoUrl: null }; }
  const champion = tournament.championId ? allTeams.find(t => t.id === tournament.championId) : null;

  return (
    <div className="theme-bg-card backdrop-blur-md border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden mb-12">
      <div className={`text-center relative z-10 flex flex-col items-center cursor-pointer group ${isExpanded ? 'mb-8 pb-6 border-b border-white/10' : ''}`} onClick={() => setIsExpanded(!isExpanded)}>
        {(tournament.rulesText || tournament.rulesPdfUrl) && isExpanded && (
          <button onClick={(e) => { e.stopPropagation(); setShowRules(!showRules); }} className="absolute left-0 top-0 mt-2 ml-2 bg-black/40 hover:bg-black/60 theme-primary-text border theme-primary-border px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold flex items-center transition-colors"><FileText size={14} className="mr-2" /> Reglas</button>
        )}
        <h3 className="text-3xl md:text-4xl font-black theme-primary-text mt-12 md:mt-0 theme-font-secondary group-hover:opacity-80 transition-opacity">{tournament.name}</h3>
        <ChampionBadge champion={champion} onClick={onTeamClick} />
        <div className="flex items-center justify-center gap-3 mt-4">
           <span className="px-4 py-1 rounded-full bg-white/10 text-xs md:text-sm font-bold tracking-widest opacity-80 uppercase">{tournament.status || 'En Juego'}</span>
           <div className="bg-black/40 p-1.5 rounded-full theme-primary-text border border-white/10 shadow-lg"><ChevronDown size={18} className={!isExpanded ? '-rotate-90' : ''} /></div>
        </div>
      </div>

      {isExpanded && (
         <div className="animate-in fade-in duration-300">
            {showRules && (
              <div className="bg-black/40 p-5 rounded-xl border border-white/10 mb-8 text-sm">
                {tournament.rulesText && <p className="whitespace-pre-wrap mb-4 opacity-90">{tournament.rulesText}</p>}
                {tournament.rulesPdfUrl && <a href={tournament.rulesPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center theme-primary-bg font-bold px-4 py-2 rounded-lg text-black"><Download size={16} className="mr-2" /> Descargar PDF</a>}
              </div>
            )}
            {(tournament.zones && tournament.zones.length > 0) && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 px-2 gap-4">
                 <h4 className="text-xl md:text-2xl font-black uppercase tracking-widest flex items-center theme-font-secondary"><LayoutList className="mr-3 theme-primary-text" /> Zonas</h4>
                 <div className="flex gap-2">
                   <button onClick={async () => { const canvas = await exportZonesAsImage(tournament, allTeams, config, clubs); if(canvas) await handleShareCanvas(canvas, `Zonas-${tournament.name}.png`, 'download'); }} className="bg-white/10 hover:bg-white/20 font-bold px-3 py-2 rounded-lg flex items-center text-xs md:text-sm shadow-lg"><Download size={14} className="mr-2" /> Descargar</button>
                   <button onClick={async () => { const canvas = await exportZonesAsImage(tournament, allTeams, config, clubs); if(canvas) await handleShareCanvas(canvas, `Zonas-${tournament.name}.png`, 'whatsapp'); }} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-3 py-2 rounded-lg flex items-center text-xs md:text-sm shadow-lg"><MessageCircle size={14} className="mr-2" /> WhatsApp</button>
                 </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10 relative z-10">
              {(tournament.zones || []).map((zone, zIdx) => {
                const sortedTeams = [...zone.teams].sort((a,b) => { if (b.pts !== a.pts) return b.pts - a.pts; return (b.sf || 0) - (a.sf || 0); });
                return (
                <div key={zIdx} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="bg-white/5 px-4 py-4"><h4 className="text-lg md:text-xl font-bold">{zone.name}</h4></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                      <thead className="bg-black/40 opacity-80 text-[9px] md:text-xs font-black uppercase tracking-wider">
                        <tr><th className="p-2 md:p-3 text-left pl-4 md:pl-6">Equipo</th><th className="p-2 md:p-3 theme-primary-text">PTS</th><th className="p-2 md:p-3">PJ</th><th className="p-2 md:p-3">PG</th><th className="p-2 md:p-3">SF</th><th className="p-2 md:p-3">SC</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedTeams.map((t, i) => {
                          const tInfo = getZoneTeamInfo(t);
                          return (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="p-2 md:p-3 pl-4 md:pl-6 text-left font-bold flex items-center">
                              <span className="w-4 md:w-5 opacity-60 text-[10px] md:text-xs mr-1">{i+1}.</span>
                              <div className="flex items-center cursor-pointer hover:theme-primary-text" onClick={()=>onTeamClick(tInfo.id)}>
                                 {tInfo.photoUrl ? <img src={tInfo.photoUrl} className="w-4 h-4 md:w-5 md:h-5 rounded-full object-cover mr-2" alt="L" /> : <Shield size={12} className="opacity-60 mr-2" />}
                                 <span className="truncate max-w-[80px] md:max-w-[150px] text-xs md:text-sm">{tInfo.name}</span>
                              </div>
                            </td>
                            <td className="p-2 md:p-3 font-black theme-primary-text bg-white/5">{t.pts}</td>
                            <td className="p-2 md:p-3 opacity-80">{t.pj}</td>
                            <td className="p-2 md:p-3 opacity-80">{t.pg}</td>
                            <td className="p-2 md:p-3 opacity-80">{t.sf || 0}</td>
                            <td className="p-2 md:p-3 opacity-80">{t.sc || 0}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )})}
            </div>
            <SymmetricBracket tournament={tournament} allTeams={allTeams} config={config} clubs={clubs} onTeamClick={onTeamClick} handleShareCanvas={handleShareCanvas} exportBracketAsImage={exportBracketAsImage} />
         </div>
      )}
    </div>
  );
}

function ChampionBadge({ champion, onClick }) {
   if (!champion) return null;
   return (
      <div className="mt-3 inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-amber-700/20 border border-amber-500/50 px-4 py-2 rounded-full cursor-pointer hover:scale-105 transition-transform shadow-lg w-max max-w-full" onClick={(e) => { e.stopPropagation(); onClick && onClick(champion.id); }}>
         <Trophy size={18} className="text-amber-400 drop-shadow-md shrink-0" />
         <div className="flex flex-col items-start leading-none text-left min-w-0">
            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-0.5">Campeón</span>
            <span className="text-white font-black text-sm drop-shadow-md truncate max-w-[150px] md:max-w-[200px]">{champion.name}</span>
         </div>
         {champion.photoUrl ? <img src={champion.photoUrl} className="w-7 h-7 rounded-full object-cover ml-1 border border-amber-500/50 shrink-0" alt="logo" /> : <Shield size={16} className="text-amber-400 ml-1 shrink-0" />}
      </div>
   )
}

function PlayerCardVertical({ player, size="sm", title="", onClick, config }) {
  if (!player) return null;
  const isLg = size === "lg";
  return (
    <div className={`flex flex-col items-center relative group ${onClick ? 'cursor-pointer hover:-translate-y-1 transition-transform' : ''}`} onClick={(e) => { if(onClick) { e.stopPropagation(); onClick(); } }}>
      {title && <span className="absolute -top-3 theme-primary-bg text-[9px] font-black px-2 py-0.5 rounded-full z-10 uppercase text-black">{title}</span>}
      <div className={`${isLg ? 'w-20 h-28 md:w-28 md:h-40 border-2' : 'w-14 h-20 md:w-20 md:h-28 border'} rounded-xl bg-black/40 overflow-hidden border-white/20 shadow-md group-hover:theme-primary-border flex shrink-0`}>
        {player.photoUrl ? <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-white/5"><Users className="opacity-20" /></div>}
      </div>
      <div className="mt-2 w-full flex flex-col items-center bg-black/40 px-2 py-1.5 rounded-md border border-white/5 group-hover:bg-black/60">
         <span className={`${isLg ? 'text-xs md:text-sm max-w-[100px]' : 'text-[10px] md:text-xs max-w-[70px] md:max-w-[80px]'} font-bold opacity-80 text-center truncate w-full`}>{player.name.split(' ')[0]}</span>
         {player.nickname && <span className="text-[9px] theme-primary-text font-black leading-none mt-0.5 truncate w-full text-center opacity-90">"{player.nickname}"</span>}
      </div>
    </div>
  )
}

function SymmetricBracket({ tournament, config, allTeams, clubs, onTeamClick, isAdmin = false, onEditMatch = null, handleShareCanvas, exportBracketAsImage }) {
  const validBrackets = tournament.brackets || [];
  if (validBrackets.length === 0) return null;

  const finalRound = validBrackets.find(b => b.matches.length === 1);
  const regularRounds = validBrackets.filter(b => b.matches.length > 1);

  const getBracketTeamInfo = (teamId, fallbackName) => {
    if(teamId) { const found = allTeams.find(tm => tm.id === teamId); return found ? { id: found.id, name: found.name, photoUrl: found.photoUrl } : { id: null, name: fallbackName || 'Por definir', photoUrl: null }; }
    return { id: null, name: fallbackName || 'Por definir', photoUrl: null };
  }

  return (
     <div className="mt-12 relative w-full border-t border-white/10 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-2 md:px-4 gap-4">
           <h4 className="text-xl md:text-2xl font-black uppercase tracking-widest flex items-center theme-font-secondary"><Trophy className="mr-3 theme-accent-text" /> {isAdmin ? 'Edición de Llaves' : 'Fase Final'}</h4>
           {(handleShareCanvas && exportBracketAsImage) && (
             <div className="flex gap-2 w-full md:w-auto">
               <button onClick={async () => { const canvas = await exportBracketAsImage(tournament, allTeams, config, clubs); if(canvas) await handleShareCanvas(canvas, `Llaves-${tournament.name}.png`, 'download'); }} className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 font-bold px-3 py-2 rounded-lg flex items-center justify-center text-xs md:text-sm shadow-lg"><Download size={14} className="mr-2" /> Descargar</button>
               <button onClick={async () => { const canvas = await exportBracketAsImage(tournament, allTeams, config, clubs); if(canvas) await handleShareCanvas(canvas, `Llaves-${tournament.name}.png`, 'whatsapp'); }} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-3 py-2 rounded-lg flex items-center justify-center text-xs md:text-sm shadow-lg"><MessageCircle size={14} className="mr-2" /> WhatsApp</button>
             </div>
           )}
        </div>
        <div className="w-full overflow-x-auto custom-scrollbar pb-8 relative z-10">
           <div className="w-max min-w-full mx-auto px-2 md:px-4 flex justify-center">
              <div className="flex items-stretch justify-center gap-3 md:gap-6 relative z-10">
                 <div className="flex flex-1 justify-end gap-3 md:gap-6 border-r border-dashed border-white/10 pr-3 md:pr-6">
                    {regularRounds.map((b, bIdx) => {
                      const originalBIdx = validBrackets.findIndex(br => br.round === b.round);
                      return (
                      <div key={`L-${originalBIdx}`} className="flex flex-col justify-around gap-2 md:gap-4 w-[130px] md:w-[170px] shrink-0">
                         {b.matches.slice(0, Math.ceil(b.matches.length / 2)).map((m, mIdx) => (
                            <MatchNode key={`L-m-${originalBIdx}-${mIdx}`} match={m} roundName={b.round} onTeamClick={onTeamClick} getTeamInfo={getBracketTeamInfo} isAdmin={isAdmin} onEdit={() => onEditMatch && onEditMatch(originalBIdx, mIdx, m)} config={config} />
                         ))}
                      </div>
                    )})}
                 </div>
                 {finalRound && (
                   <div className="flex flex-col justify-center px-4 shrink-0 relative z-10 w-[150px] md:w-[200px]">
                      <div className="text-center mb-3"><span className="theme-accent-bg font-black px-3 py-1 rounded-full text-[10px] md:text-xs uppercase tracking-widest text-black">{finalRound.round}</span></div>
                      <MatchNode match={finalRound.matches[0]} roundName="" onTeamClick={onTeamClick} getTeamInfo={getBracketTeamInfo} isFinal={true} isAdmin={isAdmin} onEdit={() => onEditMatch && onEditMatch(validBrackets.findIndex(br => br.round === finalRound.round), 0, finalRound.matches[0])} config={config} />
                   </div>
                 )}
                 <div className="flex flex-1 justify-start gap-3 md:gap-6 border-l border-dashed border-white/10 pl-3 md:pl-6">
                    {[...regularRounds].reverse().map((b, revIdx) => {
                      const originalBIdx = validBrackets.findIndex(br => br.round === b.round);
                      const halfLength = Math.ceil(b.matches.length / 2);
                      return (
                      <div key={`R-${originalBIdx}`} className="flex flex-col justify-around gap-2 md:gap-4 w-[130px] md:w-[170px] shrink-0">
                         {b.matches.slice(halfLength).map((m, relativeMIdx) => {
                            const actualMIdx = halfLength + relativeMIdx;
                            return <MatchNode key={`R-m-${originalBIdx}-${actualMIdx}`} match={m} roundName={b.round} onTeamClick={onTeamClick} getTeamInfo={getBracketTeamInfo} isAdmin={isAdmin} onEdit={() => onEditMatch && onEditMatch(originalBIdx, actualMIdx, m)} config={config} />
                         })}
                      </div>
                    )})}
                 </div>
              </div>
           </div>
        </div>
     </div>
  );
}

function MatchNode({ match, roundName, onTeamClick, getTeamInfo, isFinal = false, isAdmin = false, onEdit, config }) {
  if(!match) return null;
  const t1 = getTeamInfo(match.team1Id, match.t1);
  const t2 = getTeamInfo(match.team2Id, match.t2);
  const isW1 = match.winnerId === match.team1Id && match.team1Id;
  const isW2 = match.winnerId === match.team2Id && match.team2Id;

  const scoreDisplay = [match.s1, match.s2, match.s3].filter(Boolean).join(' | ') || (typeof match.score === 'string' ? match.score : '');

  const getStyle = (isWinner) => {
     if (!isWinner) return { backgroundColor: 'transparent', border: '1px solid transparent' };
     return { backgroundColor: `${config?.primaryColor || '#a3e635'}33`, border: `1px solid ${config?.primaryColor || '#a3e635'}66` };
  };
  const getTextColor = (isWinner) => isWinner ? (config?.primaryColor || '#a3e635') : 'inherit';

  return (
    <div className={`relative bg-black/40 rounded-lg border p-1.5 md:p-2 flex flex-col justify-center shadow-md transition-all group ${isAdmin ? 'cursor-pointer hover:theme-primary-border' : 'hover:border-white/20'} ${isFinal ? 'theme-accent-border shadow-lg scale-105' : 'border-white/10'}`} onClick={isAdmin ? onEdit : undefined}>
       {isAdmin && <div className="absolute -top-2 -right-2 theme-primary-bg rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-black"><Edit3 size={10} /></div>}
       {roundName && <div className="text-[8px] md:text-[9px] font-black theme-primary-text uppercase tracking-widest text-center mb-1.5">{String(roundName)}</div>}
       <div className="space-y-1 md:space-y-1.5">
         <div className={`flex items-center justify-between p-1 rounded-md mb-0.5 transition-colors ${!isAdmin ? 'cursor-pointer hover:bg-white/5' : ''}`} style={getStyle(isW1)} onClick={(e) => { if(!isAdmin) onTeamClick(t1.id); }}>
            <div className="flex items-center flex-1 min-w-0">
              {t1.photoUrl ? <img src={t1.photoUrl} className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full object-cover mr-1.5 shrink-0" alt=""/> : <Shield size={12} className="opacity-50 mr-1.5 shrink-0" />}
              <span className={`truncate text-[9px] md:text-[11px] ${isW1 ? 'font-black opacity-100' : 'font-semibold opacity-60 group-hover:opacity-100'}`} style={{ color: getTextColor(isW1) }}>{t1.name}</span>
            </div>
            {isW1 && <CheckCircle2 size={12} color={getTextColor(isW1)} className="ml-1 shrink-0" />}
         </div>
         <div className="h-px w-full bg-white/5 my-0.5"></div>
         <div className={`flex items-center justify-between p-1 rounded-md mt-0.5 transition-colors ${!isAdmin ? 'cursor-pointer hover:bg-white/5' : ''}`} style={getStyle(isW2)} onClick={(e) => { if(!isAdmin) onTeamClick(t2.id); }}>
            <div className="flex items-center flex-1 min-w-0">
              {t2.photoUrl ? <img src={t2.photoUrl} className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full object-cover mr-1.5 shrink-0" alt=""/> : <Shield size={12} className="opacity-50 mr-1.5 shrink-0" />}
              <span className={`truncate text-[9px] md:text-[11px] ${isW2 ? 'font-black opacity-100' : 'font-semibold opacity-60 group-hover:opacity-100'}`} style={{ color: getTextColor(isW2) }}>{t2.name}</span>
            </div>
            {isW2 && <CheckCircle2 size={12} color={getTextColor(isW2)} className="ml-1 shrink-0" />}
         </div>
       </div>
       {scoreDisplay && (
         <div className="mt-1.5 bg-black/60 rounded py-0.5 px-1 border border-white/5 flex justify-center">
            <span className={`text-[8px] md:text-[9px] font-black tracking-widest ${isFinal ? 'theme-accent-text' : 'opacity-80'}`}>{scoreDisplay}</span>
         </div>
       )}
    </div>
  )
}

// --- PANELES DE ADMINISTRACIÓN ---
function AdminDashboard({ userRole, players, teams, matches, tournaments, news, clubs, config, db, getCollectionPath, handleShareCanvas, openTeamDetails, exportZonesAsImage, exportBracketAsImage }) {
  const [adminSection, setAdminSection] = useState('config');
  const navClasses = (sec) => `px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${adminSection === sec ? 'theme-primary-bg shadow-md text-black' : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`;

  return (
    <div>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <h2 className="text-3xl font-black uppercase tracking-wider flex items-center theme-font-secondary">
           {userRole === 'superadmin' ? <><Lock className="mr-3 theme-primary-text" /> Súper Panel</> : <><Settings className="mr-3 theme-primary-text" /> Panel Admin</>}
        </h2>
        <div className="flex flex-wrap theme-bg-card backdrop-blur-md rounded-xl p-1.5 border border-white/10 gap-1 w-full xl:w-auto overflow-x-auto custom-scrollbar pb-1">
          <button onClick={() => setAdminSection('resultados')} className={navClasses('resultados')}>Resultados</button>
          <button onClick={() => setAdminSection('jugadores')} className={navClasses('jugadores')}>Jugadores</button>
          <button onClick={() => setAdminSection('equipos')} className={navClasses('equipos')}>Equipos</button>
          <button onClick={() => setAdminSection('torneos')} className={navClasses('torneos')}>Torneos</button>
          {config.feature_clubs !== false && <button onClick={() => setAdminSection('clubes')} className={navClasses('clubes')}>Sedes</button>}
          {config.feature_news !== false && <button onClick={() => setAdminSection('noticias')} className={navClasses('noticias')}>Noticias</button>}
          <button onClick={() => setAdminSection('config')} className={navClasses('config')}><Settings size={14} className="inline mr-1" /> Config / Exp</button>
          {userRole === 'superadmin' && <button onClick={() => setAdminSection('superpanel')} className={navClasses('superpanel')}><Lock size={14} className="inline mr-1" /> Maestro</button>}
        </div>
      </div>

      <div className="theme-bg-card backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        {adminSection === 'config' && <AdminConfig config={config} db={db} getCollectionPath={getCollectionPath} />}
        {adminSection === 'resultados' && <AdminResultados matches={matches} teams={teams} db={db} getCollectionPath={getCollectionPath} tournaments={tournaments} />}
        {adminSection === 'jugadores' && <AdminJugadores players={players} db={db} getCollectionPath={getCollectionPath} />}
        {adminSection === 'equipos' && <AdminEquipos teams={teams} players={players} db={db} getCollectionPath={getCollectionPath} />}
        {adminSection === 'torneos' && <AdminTorneos tournaments={tournaments} db={db} getCollectionPath={getCollectionPath} />}
        {adminSection === 'clubes' && config.feature_clubs !== false && <AdminClubes clubs={clubs} db={db} getCollectionPath={getCollectionPath} />}
        {adminSection === 'noticias' && config.feature_news !== false && <AdminNoticias news={news} db={db} getCollectionPath={getCollectionPath} />}
        {adminSection === 'superpanel' && userRole === 'superadmin' && <SuperAdminPanel config={config} db={db} getCollectionPath={getCollectionPath} />}
      </div>
    </div>
  );
}

function AdminResultados({ matches, teams, db, getCollectionPath, tournaments }) {
  const [form, setForm] = useState({ team1Id: '', team2Id: '', status: 'pending', round: '', s1: '', s2: '', s3: '', score: '', winnerId: '', tournamentName: '' });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.team1Id || !form.team2Id) return setMsg("Selecciona 2 equipos");
    try {
      const docRef = doc(collection(db, getCollectionPath('matches')));
      await setDoc(docRef, { ...form, createdAt: Date.now() });
      setMsg("Partido guardado correctamente."); 
      setForm({ team1Id: '', team2Id: '', status: 'pending', round: '', s1: '', s2: '', s3: '', score: '', winnerId: '', tournamentName: '' });
    } catch(err) { setMsg("Error al guardar"); }
    setTimeout(()=>setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black mb-4 uppercase tracking-wider">Gestión de Partidos / Resultados</h3>
      <form onSubmit={handleSubmit} className="bg-black/20 p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.team1Id} onChange={e=>setForm({...form, team1Id: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border">
             <option value="">Equipo Local...</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={form.team2Id} onChange={e=>setForm({...form, team2Id: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border">
             <option value="">Equipo Visitante...</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none">
            <option value="pending">Pendiente (A la Grilla)</option>
            <option value="completed">Completado (Historial)</option>
          </select>
          <input type="text" placeholder="Instancia (Ej: Fecha 1, Semifinal)" value={form.round} onChange={e=>setForm({...form, round: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
          <input type="text" placeholder="Nombre del Torneo (Opcional)" value={form.tournamentName} onChange={e=>setForm({...form, tournamentName: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
        </div>
        
        {form.status === 'completed' && (
          <div className="bg-white/5 p-4 rounded-xl space-y-4 border border-white/10 mt-4">
            <h4 className="font-bold text-sm theme-primary-text">Resultado Final</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <select value={form.winnerId} onChange={e=>setForm({...form, winnerId: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none">
                 <option value="">Seleccionar Ganador...</option>
                 {form.team1Id && <option value={form.team1Id}>Gana Local</option>}
                 {form.team2Id && <option value={form.team2Id}>Gana Visitante</option>}
               </select>
               <div className="flex gap-2">
                 <input type="text" placeholder="Set 1 (Ej: 6-4)" value={form.s1} onChange={e=>setForm({...form, s1: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 text-center font-bold outline-none" />
                 <input type="text" placeholder="Set 2 (Ej: 6-2)" value={form.s2} onChange={e=>setForm({...form, s2: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 text-center font-bold outline-none" />
                 <input type="text" placeholder="Set 3" value={form.s3} onChange={e=>setForm({...form, s3: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 text-center font-bold outline-none" />
               </div>
            </div>
          </div>
        )}
        <button type="submit" className="w-full theme-primary-bg text-black font-black uppercase tracking-widest py-3 rounded-xl mt-4 hover:opacity-80 transition-opacity">Añadir Partido</button>
        {msg && <p className="text-center text-sm font-bold theme-primary-text mt-2">{msg}</p>}
      </form>
      
      <div className="mt-8 space-y-2">
        <h4 className="font-bold opacity-60 text-sm uppercase tracking-wider mb-4">Historial Reciente (Últimos 10)</h4>
        {matches.sort((a,b)=>b.createdAt - a.createdAt).slice(0, 10).map(m => (
          <div key={m.id} className="bg-black/20 p-3 rounded-xl flex justify-between items-center text-sm border border-white/5">
             <span className="font-bold">
               {teams.find(t=>t.id===m.team1Id)?.name} <span className="opacity-50 italic">vs</span> {teams.find(t=>t.id===m.team2Id)?.name} 
               <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                 {m.status === 'completed' ? 'Jugado' : 'En Grilla'}
               </span>
             </span>
             <button onClick={() => deleteDoc(doc(db, getCollectionPath('matches'), m.id))} className="text-red-400 hover:text-red-300 bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminJugadores({ players, db, getCollectionPath }) {
  const [form, setForm] = useState({ name: '', category: '', position: '', nickname: '', photoUrl: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name) return;
    await setDoc(doc(collection(db, getCollectionPath('players'))), form);
    setForm({ name: '', category: '', position: '', nickname: '', photoUrl: '' });
  };
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black mb-4 uppercase tracking-wider">Gestión de Jugadores</h3>
      <form onSubmit={handleSubmit} className="bg-black/20 p-6 rounded-2xl border border-white/10 space-y-4">
        <input type="text" placeholder="Nombre completo" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input type="text" placeholder="Categoría (Ej: 6ta)" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
           <input type="text" placeholder="Posición (Drive/Revés)" value={form.position} onChange={e=>setForm({...form, position: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input type="text" placeholder="Apodo" value={form.nickname} onChange={e=>setForm({...form, nickname: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
           <input type="text" placeholder="URL Foto (Opcional)" value={form.photoUrl} onChange={e=>setForm({...form, photoUrl: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
        </div>
        <button type="submit" className="w-full theme-primary-bg text-black font-black uppercase tracking-widest py-3 rounded-xl mt-4 hover:opacity-80 transition-opacity">Añadir Jugador</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
         {players.map(p => (
           <div key={p.id} className="bg-black/40 p-3 rounded-xl flex justify-between items-center border border-white/5 text-sm">
              <div className="flex items-center gap-3">
                 {p.photoUrl ? <img src={p.photoUrl} className="w-8 h-8 rounded-full object-cover"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Users size={14}/></div>}
                 <div>
                   <span className="font-bold block">{p.name}</span>
                   <span className="text-[10px] theme-primary-text font-black uppercase">{p.category}</span>
                 </div>
              </div>
              <button onClick={() => deleteDoc(doc(db, getCollectionPath('players'), p.id))} className="text-red-400 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 size={16}/></button>
           </div>
         ))}
      </div>
    </div>
  );
}

function AdminEquipos({ teams, players, db, getCollectionPath }) {
  const [form, setForm] = useState({ name: '', player1Id: '', player2Id: '', phone: '', photoUrl: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name) return;
    await setDoc(doc(collection(db, getCollectionPath('teams'))), form);
    setForm({ name: '', player1Id: '', player2Id: '', phone: '', photoUrl: '' });
  };
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black mb-4 uppercase tracking-wider">Gestión de Equipos</h3>
      <form onSubmit={handleSubmit} className="bg-black/20 p-6 rounded-2xl border border-white/10 space-y-4">
        <input type="text" placeholder="Nombre del Equipo" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <select value={form.player1Id} onChange={e=>setForm({...form, player1Id: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border">
             <option value="">Seleccionar Jugador 1...</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
           <select value={form.player2Id} onChange={e=>setForm({...form, player2Id: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border">
             <option value="">Seleccionar Jugador 2...</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input type="text" placeholder="Teléfono del Delegado (Ej: +549...)" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
           <input type="text" placeholder="URL Escudo/Foto (Opcional)" value={form.photoUrl} onChange={e=>setForm({...form, photoUrl: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
        </div>
        <button type="submit" className="w-full theme-primary-bg text-black font-black uppercase tracking-widest py-3 rounded-xl mt-4 hover:opacity-80 transition-opacity">Añadir Equipo</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
         {teams.map(t => (
           <div key={t.id} className="bg-black/40 p-3 rounded-xl flex justify-between items-center border border-white/5 text-sm">
              <div className="flex items-center gap-3">
                 {t.photoUrl ? <img src={t.photoUrl} className="w-8 h-8 rounded-full object-cover border border-white/10"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Shield size={14}/></div>}
                 <span className="font-bold truncate max-w-[150px]">{t.name}</span>
              </div>
              <button onClick={() => deleteDoc(doc(db, getCollectionPath('teams'), t.id))} className="text-red-400 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 size={16}/></button>
           </div>
         ))}
      </div>
    </div>
  );
}

function AdminTorneos({ tournaments, db, getCollectionPath }) {
  const [form, setForm] = useState({ name: '', status: 'En Juego', rulesText: '', zones: [], brackets: [] });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name) return;
    await setDoc(doc(collection(db, getCollectionPath('tournaments'))), form);
    setForm({ name: '', status: 'En Juego', rulesText: '', zones: [], brackets: [] });
  };
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black mb-4 uppercase tracking-wider">Gestión de Torneos</h3>
      <form onSubmit={handleSubmit} className="bg-black/20 p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input type="text" placeholder="Nombre del Torneo" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" required />
           <input type="text" placeholder="Estado (Ej: Inscripciones, En Juego)" value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
        </div>
        <textarea placeholder="Reglas del Torneo (Opcional)" value={form.rulesText} onChange={e=>setForm({...form, rulesText: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 min-h-[100px] font-bold outline-none focus:theme-primary-border" />
        <button type="submit" className="w-full theme-primary-bg text-black font-black uppercase tracking-widest py-3 rounded-xl mt-4 hover:opacity-80 transition-opacity">Crear Torneo</button>
      </form>
      <div className="grid grid-cols-1 gap-3">
         {tournaments.map(t => (
           <div key={t.id} className="bg-black/40 p-4 rounded-xl flex justify-between items-center border border-white/5">
              <div>
                 <span className="font-black text-lg block">{t.name}</span>
                 <span className="opacity-60 text-xs font-bold uppercase tracking-widest">{t.status}</span>
              </div>
              <button onClick={() => deleteDoc(doc(db, getCollectionPath('tournaments'), t.id))} className="text-red-400 p-3 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"><Trash2 size={18}/></button>
           </div>
         ))}
      </div>
    </div>
  );
}

function AdminClubes({ clubs, db, getCollectionPath }) {
  const [form, setForm] = useState({ name: '', type: 'sede', photoUrl: '', phone: '' });
  const handleSubmit = async (e) => {
    e.preventDefault(); if(!form.name) return;
    await setDoc(doc(collection(db, getCollectionPath('clubs'))), form);
    setForm({ name: '', type: 'sede', photoUrl: '', phone: '' });
  };
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black mb-4 uppercase tracking-wider">Gestión de Sedes y Sponsors</h3>
      <form onSubmit={handleSubmit} className="bg-black/20 p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input type="text" placeholder="Nombre (Ej: Padel Zone)" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" required />
           <select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border">
             <option value="sede">Sede Deportiva / Cancha</option>
             <option value="sponsor">Sponsor Oficial</option>
           </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input type="text" placeholder="URL Logo" value={form.photoUrl} onChange={e=>setForm({...form, photoUrl: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
           <input type="text" placeholder="Teléfono Reservas" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" />
        </div>
        <button type="submit" className="w-full theme-primary-bg text-black font-black uppercase tracking-widest py-3 rounded-xl mt-4 hover:opacity-80 transition-opacity">Añadir Sede/Sponsor</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
         {clubs.map(c => (
           <div key={c.id} className="bg-black/40 p-3 rounded-xl flex justify-between items-center border border-white/5">
              <div className="flex items-center gap-3">
                 {c.photoUrl ? <img src={c.photoUrl} className="w-10 h-10 rounded-full object-cover bg-white/5 p-1 border border-white/10"/> : <MapPin className="opacity-50 w-8 h-8"/>}
                 <div>
                    <span className="font-bold block">{c.name}</span>
                    <span className="text-[10px] opacity-60 uppercase font-black tracking-widest">{c.type}</span>
                 </div>
              </div>
              <button onClick={() => deleteDoc(doc(db, getCollectionPath('clubs'), c.id))} className="text-red-400 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 size={16}/></button>
           </div>
         ))}
      </div>
    </div>
  );
}

function AdminNoticias({ news, db, getCollectionPath }) {
  const [form, setForm] = useState({ title: '', content: '', type: 'info' });
  const handleSubmit = async (e) => {
    e.preventDefault(); if(!form.title) return;
    await setDoc(doc(collection(db, getCollectionPath('news'))), { ...form, createdAt: Date.now() });
    setForm({ title: '', content: '', type: 'info' });
  };
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black mb-4 uppercase tracking-wider">Gestión de Noticias</h3>
      <form onSubmit={handleSubmit} className="bg-black/20 p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <input type="text" placeholder="Título de la noticia" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="md:col-span-3 bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border" required />
           <select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="bg-black/60 p-3 rounded-lg border border-white/10 font-bold outline-none focus:theme-primary-border">
             <option value="info">Información General</option>
             <option value="alert">Alerta Urgente</option>
           </select>
        </div>
        <textarea placeholder="Contenido de la noticia..." value={form.content} onChange={e=>setForm({...form, content: e.target.value})} className="w-full bg-black/60 p-3 rounded-lg border border-white/10 min-h-[120px] font-bold outline-none focus:theme-primary-border" />
        <button type="submit" className="w-full theme-primary-bg text-black font-black uppercase tracking-widest py-3 rounded-xl mt-4 hover:opacity-80 transition-opacity">Publicar Noticia</button>
      </form>
      <div className="space-y-3">
         {news.map(n => (
           <div key={n.id} className="bg-black/40 p-4 rounded-xl flex justify-between items-center border border-white/5">
              <div className="flex items-center gap-3">
                 {n.type === 'alert' ? <AlertTriangle className="text-red-400"/> : <FileText className="theme-primary-text"/>}
                 <span className="font-bold">{n.title}</span>
              </div>
              <button onClick={() => deleteDoc(doc(db, getCollectionPath('news'), n.id))} className="text-red-400 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 size={16}/></button>
           </div>
         ))}
      </div>
    </div>
  );
}

function SuperAdminPanel({ config, db, getCollectionPath }) {
  return (
    <div className="p-8 text-center bg-red-500/10 border border-red-500/30 rounded-3xl mt-8">
      <Lock size={48} className="mx-auto text-red-500 mb-4" />
      <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">Zona de Súper Administrador</h3>
      <p className="text-red-200 opacity-80 mb-6 max-w-lg mx-auto font-medium">Esta área está reservada para acciones destructivas masivas. Usa con extrema precaución.</p>
      <button className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl shadow-lg transition-colors uppercase tracking-widest text-sm">Borrar Base de Datos (Seguridad Activada)</button>
    </div>
  );
}

function AdminConfig({ config, db, getCollectionPath }) {
  const [form, setForm] = useState(config);
  const [msg, setMsg] = useState('');
  const [loadingBg, setLoadingBg] = useState(false);
  const [loadingExportBg, setLoadingExportBg] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await setDoc(doc(db, getCollectionPath('settings'), 'main'), form);
    setMsg("Configuración guardada exitosamente."); setTimeout(()=>setMsg(''), 3000);
  };

  const handleBgUpload = (e) => {
     const file = e.target.files[0];
     if (file) { setLoadingBg(true); resizeImage(file, (data) => { setForm({...form, bgUrl: data}); setLoadingBg(false); }, 1920, 1080, 0.8); }
  };

  const handleExportBgUpload = (e) => {
     const file = e.target.files[0];
     if (file) { setLoadingExportBg(true); resizeImage(file, (data) => { setForm({...form, exportBgUrl: data}); setLoadingExportBg(false); }, 1920, 1080, 0.9); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4">
      
      {/* SECCIÓN COLORES Y OVERLAY WEB */}
      {config.feature_colors !== false && (
      <div className="bg-black/20 p-8 rounded-3xl border border-white/10">
         <h3 className="text-xl font-black mb-6 uppercase tracking-wider flex items-center theme-font-secondary"><Palette className="mr-2 theme-primary-text" /> Paleta de Colores y Overlay Web</h3>
         
         <div className="mb-6 space-y-3">
            <label className="block text-sm font-bold opacity-60">Color de Overlay y Transparencia (Fondo Web)</label>
            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
               <input type="color" value={form.bgColor || '#020617'} onChange={e=>setForm({...form, bgColor: e.target.value})} className="w-12 h-12 bg-transparent border-none cursor-pointer rounded shrink-0" title="Elegir Color Base" />
               <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-60 mb-1">
                     <span>Transparente</span>
                     <span>Sólido ({form.bgOpacity ?? 85}%)</span>
                  </div>
                  <input type="range" min="0" max="100" value={form.bgOpacity ?? 85} onChange={e=>setForm({...form, bgOpacity: Number(e.target.value)})} className="w-full accent-lime-500" />
               </div>
            </div>
            <p className="text-[10px] opacity-60">Este color se pinta por encima de la imagen de fondo web para asegurar que el texto sea legible.</p>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-white/10">
            <div className="space-y-3 text-center">
               <label className="block text-xs font-bold opacity-60 h-8">Color Principal (Acentos)</label>
               <input type="color" value={form.primaryColor || '#a3e635'} onChange={e=>setForm({...form, primaryColor: e.target.value})} className="w-full h-14 bg-transparent border-none cursor-pointer rounded-xl" />
            </div>
            <div className="space-y-3 text-center">
               <label className="block text-xs font-bold opacity-60 h-8">Color Secundario (Botones, detalles)</label>
               <input type="color" value={form.accentColor || '#fbbf24'} onChange={e=>setForm({...form, accentColor: e.target.value})} className="w-full h-14 bg-transparent border-none cursor-pointer rounded-xl" />
            </div>
            <div className="space-y-3 text-center">
               <label className="block text-xs font-bold opacity-60 h-8">Color Base de Tarjetas (Fondo oscuro)</label>
               <input type="color" value={form.cardColor || '#0f172a'} onChange={e=>setForm({...form, cardColor: e.target.value})} className="w-full h-14 bg-transparent border-none cursor-pointer rounded-xl" />
            </div>
            <div className="space-y-3 text-center">
               <label className="block text-xs font-bold opacity-60 h-8">Color de Textos</label>
               <input type="color" value={form.textColor || '#f8fafc'} onChange={e=>setForm({...form, textColor: e.target.value})} className="w-full h-14 bg-transparent border-none cursor-pointer rounded-xl" />
            </div>
         </div>
      </div>
      )}

      {/* SECCIÓN FONDOS Y EXPORTACIONES AGRUPADA */}
      {config.feature_background !== false && (
      <div className="bg-black/20 p-8 rounded-3xl border border-white/10 mt-8">
         <h3 className="text-xl font-black mb-6 uppercase tracking-wider flex items-center theme-font-secondary"><ImageIcon className="mr-2 theme-primary-text" /> Fondos y Exportación de Carteles</h3>
         
         <div className="space-y-8">
            {/* PARTE 1: FONDO GLOBAL */}
            <div>
               <label className="block text-sm font-bold opacity-60 mb-3">1. Imagen de Fondo Global (Web y Carteles)</label>
               <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-48 h-28 bg-black/40 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative shrink-0">
                     {loadingBg ? <span className="text-[10px] theme-primary-text animate-pulse">Cargando...</span> : form.bgUrl ? <img src={form.bgUrl} alt="Bg" className="w-full h-full object-cover"/> : <Camera className="opacity-50" />}
                     <input type="file" accept="image/*" onChange={handleBgUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                     <p className="text-xs opacity-60">Sube una imagen o pega una URL para el fondo de tu sitio y de los carteles generados.</p>
                     <input type="text" value={form.bgUrl || ''} onChange={e=>setForm({...form, bgUrl: e.target.value})} placeholder="URL de la imagen de fondo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs outline-none focus:theme-primary-border font-bold" />
                  </div>
               </div>
            </div>

            {/* PARTE 2: CONFIGURACIÓN EXCLUSIVA DE CARTELES (AGRUPADA) */}
            <div className="pt-6 border-t border-white/10">
               <h4 className="text-lg font-black theme-primary-text mb-4 uppercase tracking-wider">2. Personalización de Carteles Exportados</h4>
               
               <div className="space-y-8 bg-black/40 p-5 md:p-8 rounded-xl border border-white/5">
                  
                  {/* OVERLAY RGBA */}
                  <div>
                     <label className="text-sm font-bold opacity-80 mb-2 block">Color de Oscurecimiento (Overlay) y Transparencia</label>
                     <p className="text-xs opacity-60 mb-3">Ajusta qué tan oscuro se verá el fondo en las imágenes descargadas para asegurar que los resultados resalten. Si lo dejas transparente (0%), se verá solo la imagen limpia.</p>
                     <div className="flex flex-col md:flex-row items-center gap-6">
                        <input type="color" value={form.exportOverlayColor || form.bgColor || '#020617'} onChange={e=>setForm({...form, exportOverlayColor: e.target.value})} className="w-16 h-16 bg-transparent border-none cursor-pointer rounded shrink-0" title="Color Base Exportación" />
                        <div className="flex-1 w-full">
                           <div className="flex justify-between text-[10px] font-black uppercase opacity-60 mb-2">
                              <span>Transparente (0%)</span>
                              <span>Sólido Oscuro ({form.exportOverlayOpacity ?? 85}%)</span>
                           </div>
                           <input type="range" min="0" max="100" value={form.exportOverlayOpacity ?? 85} onChange={e=>setForm({...form, exportOverlayOpacity: Number(e.target.value)})} className="w-full accent-lime-500" />
                        </div>
                     </div>
                  </div>

                  {/* MARCOS */}
                  <div className="pt-6 border-t border-white/10">
                     <label className="text-sm font-bold opacity-80 mb-3 block">Estilo del Marco (Bordes del Cartel)</label>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs font-bold opacity-60">Tipo de Marco</label>
                           <select value={form.exportFrameStyle || 'none'} onChange={e=>setForm({...form, exportFrameStyle: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-lg p-3 outline-none font-bold">
                              <option value="none">Sin Marco (Liso)</option>
                              <option value="solid">Línea Sólida Simple</option>
                              <option value="double">Doble Línea Elegante</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold opacity-60">Color del Marco</label>
                           <div className="flex items-center gap-2">
                              <input type="color" value={form.exportFrameColor || form.primaryColor || '#a3e635'} onChange={e=>setForm({...form, exportFrameColor: e.target.value})} className="w-12 h-12 bg-transparent border-none cursor-pointer rounded shrink-0" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold opacity-60">Grosor de Línea ({form.exportFrameWidth || 10}px)</label>
                           <input type="range" min="2" max="30" value={form.exportFrameWidth || 10} onChange={e=>setForm({...form, exportFrameWidth: Number(e.target.value)})} className="w-full accent-lime-500 mt-3" />
                        </div>
                     </div>
                  </div>

                  {/* SPONSORS Y FONDO ALTERNATIVO */}
                  <div className="pt-6 border-t border-white/10">
                     <label className="text-sm font-bold opacity-80 mb-3 block">Sponsors y Fondo Alternativo Exclusivo</label>
                     <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                        <input type="checkbox" checked={form.exportShowSponsors || false} onChange={e=>setForm({...form, exportShowSponsors: e.target.checked})} className="w-5 h-5 accent-emerald-500 cursor-pointer shrink-0" />
                        <span className="text-sm font-bold text-emerald-400">Mostrar Logos de Sponsors Oficiales en la parte inferior de los carteles.</span>
                     </div>
                     <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-48 h-28 bg-black/40 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative shrink-0">
                           {loadingExportBg ? <span className="text-[10px] theme-primary-text animate-pulse">Cargando...</span> : form.exportBgUrl ? <img src={form.exportBgUrl} alt="ExportBg" className="w-full h-full object-cover"/> : <Camera className="opacity-50" />}
                           <input type="file" accept="image/*" onChange={handleExportBgUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                        </div>
                        <div className="flex-1 space-y-3 w-full">
                           <p className="text-xs opacity-60">Opcional: Si no quieres usar la imagen global y prefieres un fondo TOTALMENTE distinto solo para las exportaciones, súbelo aquí.</p>
                           <input type="text" value={form.exportBgUrl || ''} onChange={e=>setForm({...form, exportBgUrl: e.target.value})} placeholder="URL del fondo alternativo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs outline-none font-bold focus:theme-primary-border" />
                        </div>
                     </div>
                  </div>

               </div>
            </div>

         </div>
      </div>
      )}

      <button onClick={handleSave} className="w-full theme-primary-bg text-black font-black rounded-xl p-4 uppercase tracking-widest transition-colors shadow-lg hover:opacity-80 mt-8 mb-2">Guardar Toda la Configuración</button>
      <p className="text-xs opacity-50 text-center uppercase tracking-widest mb-4">Recuerda: Debes guardar la configuración antes de probar exportar una imagen para ver los cambios aplicados.</p>
      {msg && <p className="theme-primary-text text-center font-bold text-sm bg-black/20 py-3 rounded-lg border theme-primary-border">{msg}</p>}
    </div>
  )
}