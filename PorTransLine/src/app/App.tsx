import { useState, useRef, useEffect } from "react";
import FleetTrackingMap from "./components/FleetTrackingMap";
import { fetchTrucks, fetchRouteMarkers, fetchRoutesList } from "./api";
import {
  Truck, MapPin, Users, BarChart3, Bell, ChevronRight,
  TrendingUp, AlertTriangle, Clock, Fuel, Wrench,
  Globe, Navigation, DollarSign,
  Search, Zap, RefreshCw, Phone, Star,
  ArrowRight, Menu, Plus, X, Camera, Upload, CheckCircle,
  FileText, Package, Calendar, Send, Stamp, Map,
  ScanLine, Shield, Layers, LogOut, UserCheck, Check, Filter
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

/* ── Types ── */
type AppView = "login" | "admin" | "driver" | "client";
type AdminSection = "dashboard" | "fleet" | "routes" | "drivers" | "expenses" | "marketing" | "demandes" | "carte" | "suivi";
type ClientPage = "home" | "newrequest" | "myrequests";
type DriverPage = "mission" | "depenses" | "tickets" | "pointage";

const APP = "PorTransLine";

/* ── City lists ── */
const moroccanCities = [
  "Agadir","Béni Mellal","Berrechid","Casablanca","Dakhla","El Jadida",
  "Errachidia","Fès","Guelmim","Kénitra","Khémisset","Khouribga","Laâyoune",
  "Marrakech","Meknès","Mohammedia","Nador","Oujda","Ouarzazate","Rabat",
  "Safi","Settat","Sidi Kacem","Tanger","Tétouan","Tiznit",
];
const europeanCities = [
  "Algésiras (Espagne)","Barcelone (Espagne)","Bilbao (Espagne)","Madrid (Espagne)","Valence (Espagne)",
  "Bordeaux (France)","Lyon (France)","Marseille (France)","Paris (France)","Toulouse (France)",
  "Bruxelles (Belgique)","Liège (Belgique)",
  "Francfort (Allemagne)","Hambourg (Allemagne)","Munich (Allemagne)",
  "Rome (Italie)","Milan (Italie)","Gênes (Italie)",
  "Rotterdam (Pays-Bas)","Amsterdam (Pays-Bas)",
  "Lisbonne (Portugal)","Porto (Portugal)",
  "Genève (Suisse)","Zurich (Suisse)",
];
const africanCities = [
  "Alger (Algérie)","Oran (Algérie)",
  "Tunis (Tunisie)","Sfax (Tunisie)",
  "Tripoli (Libye)",
  "Le Caire (Égypte)","Alexandrie (Égypte)",
  "Dakar (Sénégal)",
  "Nouakchott (Mauritanie)",
  "Bamako (Mali)",
];
const productTypes = [
  "Produits agroalimentaires","Matériaux de construction","Produits chimiques",
  "Textiles / Prêt-à-porter","Équipements industriels","Produits pharmaceutiques",
  "Pièces automobiles","Produits pétroliers","Matières premières","Autre",
] as const;

const productClassificationMeta: Record<(typeof productTypes)[number], { color: string; bg: string; short: string }> = {
  "Produits agroalimentaires": { color: "#10B981", bg: "#ECFDF5", short: "Agro" },
  "Matériaux de construction": { color: "#78716C", bg: "#F5F5F4", short: "BTP" },
  "Produits chimiques": { color: "#DC2626", bg: "#FEF2F2", short: "Chimie" },
  "Textiles / Prêt-à-porter": { color: "#8B5CF6", bg: "#F5F3FF", short: "Textile" },
  "Équipements industriels": { color: "#1B3A6B", bg: "#E8EEF6", short: "Indus." },
  "Produits pharmaceutiques": { color: "#0891B2", bg: "#ECFEFF", short: "Pharma" },
  "Pièces automobiles": { color: "#F97316", bg: "#FEF3E8", short: "Auto" },
  "Produits pétroliers": { color: "#D97706", bg: "#FFFBEB", short: "Pétrole" },
  "Matières premières": { color: "#059669", bg: "#D1FAE5", short: "Matières" },
  "Autre": { color: "#5A6882", bg: "#EFF2F8", short: "Autre" },
};

type ProductFilter = "all" | (typeof productTypes)[number];

const activeDeliveryStatuses = new Set(["en_route", "livraison", "alerte"]);

/* ── Mock data ── */
const fleetDataInit = [
  { id:"TRK-001", plate:"12345-A-7", driverId:"DRV-001", driver:"Hassan Benali",  status:"en_route",   route:"Casablanca → Tanger",   fuel:72, load:"Produits alimentaires", productType:"Produits agroalimentaires" as const, km:312, wx:18.5, wy:47.5, lat:34.52, lng:-6.71, routeFrom:[33.5731,-7.5898] as [number,number], routeTo:[35.7595,-5.8340] as [number,number] },
  { id:"TRK-002", plate:"67890-B-3", driverId:"DRV-002", driver:"Mohamed Oulad",  status:"livraison",  route:"Rabat → Fès",           fuel:45, load:"Matériaux construction", productType:"Matériaux de construction" as const, km:187, wx:19.0, wy:47.0, lat:34.15, lng:-5.55, routeFrom:[34.0209,-6.8416] as [number,number], routeTo:[34.0181,-5.0078] as [number,number] },
  { id:"TRK-003", plate:"11223-C-9", driverId:null,       driver:"—",             status:"disponible", route:"—",                     fuel:91, load:"—", productType:null, km:0,   wx:17.5, wy:48.5, lat:33.5731, lng:-7.5898 },
  { id:"TRK-004", plate:"44556-D-2", driverId:null,       driver:"—",             status:"maintenance",route:"—",                     fuel:28, load:"—", productType:null, km:0,   wx:20.0, wy:49.0, lat:33.5731, lng:-7.5898 },
  { id:"TRK-005", plate:"77889-E-5", driverId:"DRV-005", driver:"Karim Tazi",     status:"en_route",   route:"Agadir → Marrakech",    fuel:63, load:"Textiles export", productType:"Textiles / Prêt-à-porter" as const, km:244, wx:17.0, wy:50.5, lat:31.2, lng:-8.5, routeFrom:[30.4278,-9.5981] as [number,number], routeTo:[31.6295,-7.9811] as [number,number] },
  { id:"TRK-006", plate:"99001-F-1", driverId:"DRV-006", driver:"Omar Fassi",     status:"alerte",     route:"Oujda → Nador",         fuel:12, load:"Pièces automobiles", productType:"Pièces automobiles" as const, km:91,  wx:22.0, wy:46.0, lat:35.0, lng:-2.5, routeFrom:[34.6814,-1.9086] as [number,number], routeTo:[35.1681,-2.9337] as [number,number] },
  { id:"TRK-007", plate:"33445-G-8", driverId:"DRV-003", driver:"Youssef Darif",  status:"en_route",   route:"Casablanca → Paris",    fuel:55, load:"Textiles export", productType:"Textiles / Prêt-à-porter" as const, km:890, wx:47.0, wy:28.0, lat:43.5, lng:-1.2, routeFrom:[33.5731,-7.5898] as [number,number], routeTo:[48.8566,2.3522] as [number,number] },
  { id:"TRK-008", plate:"55667-H-4", driverId:"DRV-007", driver:"Ibrahim Chaoui", status:"livraison",  route:"Tanger → Barcelone",    fuel:38, load:"Agro-alimentaire", productType:"Produits agroalimentaires" as const, km:620, wx:44.5, wy:31.0, lat:40.5, lng:0.5, routeFrom:[35.7595,-5.8340] as [number,number], routeTo:[41.3874,2.1686] as [number,number] },
  { id:"TRK-009", plate:"88112-I-6", driverId:"DRV-004", driver:"Rachid Amrani",  status:"en_route",   route:"Casablanca → Safi",     fuel:68, load:"Produits chimiques", productType:"Produits chimiques" as const, km:156, wx:18.8, wy:49.2, lat:33.0, lng:-8.5, routeFrom:[33.5731,-7.5898] as [number,number], routeTo:[32.2994,-9.2372] as [number,number] },
  { id:"TRK-010", plate:"99334-J-0", driverId:"DRV-008", driver:"Salim Bouazza",  status:"livraison",  route:"Tanger → Rotterdam",    fuel:41, load:"Matières premières", productType:"Matières premières" as const, km:740, wx:49.5, wy:22.0, lat:47.0, lng:3.5, routeFrom:[35.7595,-5.8340] as [number,number], routeTo:[51.9244,4.4777] as [number,number] },
];

const driversData = [
  { id:"DRV-001", name:"Hassan Benali",  phone:"+212 6 12 34 56 78", status:"actif",  type:"national",      hoursLeft:2.5, truckId:"TRK-001", compliance:98, rating:4.8, trips:312 },
  { id:"DRV-002", name:"Mohamed Oulad",  phone:"+212 6 23 45 67 89", status:"actif",  type:"national",      hoursLeft:6.0, truckId:"TRK-002", compliance:94, rating:4.6, trips:208 },
  { id:"DRV-003", name:"Youssef Darif",  phone:"+212 6 34 56 78 90", status:"actif",  type:"international", hoursLeft:3.5, truckId:"TRK-007", compliance:99, rating:4.9, trips:445 },
  { id:"DRV-004", name:"Rachid Amrani",  phone:"+212 6 45 67 89 01", status:"repos",  type:"national",      hoursLeft:8.0, truckId:null,      compliance:87, rating:4.3, trips:178 },
  { id:"DRV-005", name:"Karim Tazi",     phone:"+212 6 56 78 90 12", status:"actif",  type:"international", hoursLeft:4.5, truckId:"TRK-005", compliance:96, rating:4.7, trips:389 },
  { id:"DRV-006", name:"Omar Fassi",     phone:"+212 6 67 89 01 23", status:"alerte", type:"national",      hoursLeft:0.5, truckId:"TRK-006", compliance:79, rating:4.1, trips:134 },
  { id:"DRV-007", name:"Ibrahim Chaoui", phone:"+212 6 78 90 12 34", status:"actif",  type:"international", hoursLeft:5.0, truckId:"TRK-008", compliance:93, rating:4.5, trips:267 },
  { id:"DRV-008", name:"Salim Bouazza",  phone:"+212 6 89 01 23 45", status:"repos",  type:"national",      hoursLeft:8.0, truckId:null,      compliance:91, rating:4.4, trips:195 },
];

/* relay points: national + international */
const relayNational = [
  { id:"RP-MA-01", city:"Rabat",       country:"Maroc",  wx:18.2, wy:47.2, drivers:2, address:"Zone Industrielle Ain Atiq, Km 12" },
  { id:"RP-MA-02", city:"Kénitra",     country:"Maroc",  wx:17.8, wy:46.5, drivers:1, address:"Aire de repos N1, Route Nationale" },
  { id:"RP-MA-03", city:"Sidi Kacem",  country:"Maroc",  wx:18.6, wy:46.0, drivers:2, address:"Station Afriquia, Bd Hassan II" },
  { id:"RP-MA-04", city:"Settat",      country:"Maroc",  wx:19.5, wy:48.5, drivers:1, address:"Parking routier central" },
  { id:"RP-MA-05", city:"Béni Mellal", country:"Maroc",  wx:20.2, wy:49.5, drivers:3, address:"Aire de service A8" },
];
const relayIntl = [
  { id:"RP-ES-01", city:"Algésiras",   country:"Espagne",  wx:43.5, wy:31.5, drivers:1, address:"Puerto de Algeciras, Terminal TIR" },
  { id:"RP-ES-02", city:"Barcelone",   country:"Espagne",  wx:46.2, wy:29.5, drivers:2, address:"Zona Franca, Carrer del Foc" },
  { id:"RP-FR-01", city:"Marseille",   country:"France",   wx:47.3, wy:27.5, drivers:1, address:"Zone Industrielle Les Aygalades" },
  { id:"RP-FR-02", city:"Paris",       country:"France",   wx:47.8, wy:24.5, drivers:2, address:"Rungis, Avenue Maréchal de Lattre" },
  { id:"RP-BE-01", city:"Bruxelles",   country:"Belgique", wx:49.0, wy:23.0, drivers:1, address:"Port de Bruxelles, Quai Industrie" },
  { id:"RP-SN-01", city:"Dakar",       country:"Sénégal",  wx:13.5, wy:57.0, drivers:1, address:"Zone Industrielle de Dakar, Rue A" },
  { id:"RP-DZ-01", city:"Alger",       country:"Algérie",  wx:24.5, wy:42.0, drivers:1, address:"Port d'Alger, Terminal marchandises" },
  { id:"RP-IT-01", city:"Gênes",       country:"Italie",   wx:49.0, wy:28.5, drivers:1, address:"Porto di Genova, Gate 7" },
];

const expenseChartData = [
  { month:"Jan", carburant:42000, maintenance:18000 },
  { month:"Fév", carburant:38000, maintenance:22000 },
  { month:"Mar", carburant:51000, maintenance:14000 },
  { month:"Avr", carburant:46000, maintenance:19000 },
  { month:"Mai", carburant:55000, maintenance:16000 },
  { month:"Jun", carburant:49000, maintenance:21000 },
];
const routeActivityData = [
  { day:"Lun", national:18, international:4 },
  { day:"Mar", national:22, international:6 },
  { day:"Mer", national:15, international:8 },
  { day:"Jeu", national:26, international:5 },
  { day:"Ven", national:20, international:9 },
  { day:"Sam", national:12, international:3 },
  { day:"Dim", national:8,  international:2 },
];
const statusPieData = [
  { name:"En route",    value:12, color:"#1B3A6B" },
  { name:"Livraison",   value:5,  color:"#F97316" },
  { name:"Disponible",  value:8,  color:"#10B981" },
  { name:"Maintenance", value:3,  color:"#F59E0B" },
  { name:"Alerte",      value:2,  color:"#EF4444" },
];
const adminRequestsInit = [
  { id:"REQ-2401", client:"Groupe Marjane Logistics", rc:"RC 45123", type:"Produits agroalimentaires", weight:"18 t", trucks:2, from:"Casablanca",  to:"Tanger",            date:"25 Jul 2026", scope:"national",      status:"approuvé",   submitted:"18 Jul" },
  { id:"REQ-2389", client:"ATLAS Transport SARL",     rc:"RC 78905", type:"Textiles export",           weight:"12 t", trucks:1, from:"Fès",          to:"Marseille (France)",date:"30 Jul 2026", scope:"international", status:"en_attente",  submitted:"15 Jul" },
  { id:"REQ-2375", client:"BTP Maghreb SA",           rc:"RC 22341", type:"Matériaux construction",    weight:"24 t", trucks:3, from:"Oujda",         to:"Rabat",             date:"22 Jul 2026", scope:"national",      status:"en_attente",  submitted:"12 Jul" },
  { id:"REQ-2360", client:"Souss Agri-Export",        rc:"RC 55210", type:"Produits agroalimentaires", weight:"8 t",  trucks:1, from:"Agadir",        to:"Barcelone (Espagne)",date:"28 Jul 2026",scope:"international", status:"rejeté",      submitted:"10 Jul" },
];
const clientRequestsData = [
  { id:"REQ-2401", type:"Produits agroalimentaires", weight:"18 t", trucks:2, date:"25 Jul 2026", from:"Casablanca", to:"Tanger",             scope:"national",      status:"approuvé",  submitted:"18 Jul" },
  { id:"REQ-2389", type:"Textiles export",           weight:"12 t", trucks:1, date:"30 Jul 2026", from:"Fès",        to:"Marseille (France)", scope:"international", status:"en_attente", submitted:"15 Jul" },
];
const driverExpenses = [
  { id:"DEP-1", type:"Carburant", amount:350, desc:"Plein Shell Rabat",     date:"18 Jul · 08:14", status:"validé" },
  { id:"DEP-2", type:"Péage",    amount:80,  desc:"A1 péage Kénitra",       date:"17 Jul · 14:30", status:"validé" },
  { id:"DEP-3", type:"Repas",    amount:120, desc:"Déjeuner Sidi Kacem",    date:"17 Jul · 13:00", status:"en_attente" },
];
const driverTickets = [
  { id:"TKT-1", amount:700, reason:"Excès vitesse A1", location:"Km 45 Tanger", date:"15 Jul · 10:22", status:"en_attente" },
];
const driverPointageInit = [
  { id:"PTG-83241", type:"Prise en charge", lieu:"Casablanca — Dépôt central",   heure:"06:30", date:"18 Jul", relay:"—" },
  { id:"PTG-71902", type:"Relais",          lieu:"Kénitra — Aire de repos N1",   heure:"09:15", date:"17 Jul", relay:"→ Salim Bouazza" },
  { id:"PTG-60518", type:"Fin de service",  lieu:"Rabat — Zone Ain Atiq",        heure:"18:45", date:"16 Jul", relay:"—" },
];

/* ── Status config ── */
const statusConfig: Record<string,{label:string;color:string;bg:string}> = {
  en_route:    {label:"En route",    color:"#1B3A6B", bg:"#E8EEF6"},
  livraison:   {label:"Livraison",   color:"#F97316", bg:"#FEF3E8"},
  disponible:  {label:"Disponible",  color:"#10B981", bg:"#ECFDF5"},
  maintenance: {label:"Maintenance", color:"#D97706", bg:"#FFFBEB"},
  alerte:      {label:"Alerte",      color:"#DC2626", bg:"#FEF2F2"},
  actif:       {label:"Actif",       color:"#10B981", bg:"#ECFDF5"},
  repos:       {label:"Repos",       color:"#5A6882", bg:"#EFF2F8"},
  approuvé:    {label:"Approuvée",   color:"#10B981", bg:"#ECFDF5"},
  en_attente:  {label:"En attente",  color:"#D97706", bg:"#FFFBEB"},
  rejeté:      {label:"Rejetée",     color:"#DC2626", bg:"#FEF2F2"},
};

/* ── Shared components ── */
function StatusBadge({status}:{status:string}) {
  const c = statusConfig[status] || {label:status,color:"#5A6882",bg:"#EFF2F8"};
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{color:c.color,backgroundColor:c.bg}}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor:c.color}}/>
      {c.label}
    </span>
  );
}
function FuelBar({value}:{value:number}) {
  const col = value<20?"#DC2626":value<40?"#F97316":"#10B981";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{width:`${value}%`,backgroundColor:col}}/>
      </div>
      <span className="text-xs font-mono" style={{color:col}}>{value}%</span>
    </div>
  );
}
function KpiCard({label,value,sub,icon:Icon,accent=false,alert=false}:{label:string;value:string;sub:string;icon:React.ComponentType<{size?:number}>;accent?:boolean;alert?:boolean}) {
  const ibg=alert?"#FEF2F2":accent?"#FEF3E8":"#E8EEF6";
  const ic=alert?"#DC2626":accent?"#F97316":"#1B3A6B";
  return (
    <div className="bg-card rounded-xl p-5 border border-border flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="rounded-lg p-2.5 shrink-0" style={{backgroundColor:ibg}}><Icon size={20} style={{color:ic}}/></div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
function Modal({title,onClose,children,wide}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.5)"}}>
      <div className={`bg-card rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide?"max-w-2xl":"max-w-lg"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Lbl({children}:{children:string}) {
  return <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{children}</label>;
}
const fi = "w-full px-3 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

/* ══════════════════════════════════════════
   UNIFIED LOGIN
══════════════════════════════════════════ */
function LoginPage({onLogin}:{onLogin:(v:AppView)=>void}) {
  const [role, setRole] = useState<"admin"|"driver"|"client">("admin");
  const [regStep, setRegStep] = useState(1);
  const [showReg, setShowReg] = useState(false);

  const roles = {
    admin:  {label:"Administrateur", icon:Shield,  color:"#1B3A6B", desc:"Gestion complète de la flotte et des opérations"},
    driver: {label:"Conducteur",     icon:Truck,   color:"#F97316", desc:"Mission, dépenses, tickets et pointage"},
    client: {label:"Client",         icon:Package, color:"#10B981", desc:"Créer et suivre vos demandes de transport"},
  };

  if (showReg && role==="client") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <button onClick={()=>setShowReg(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover:text-foreground">
          <ArrowRight size={13} className="rotate-180"/> Retour
        </button>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:"#1B3A6B"}}><Truck size={17} className="text-white"/></div>
          <span className="text-lg font-bold" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{APP}</span>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="font-bold text-foreground mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Créer un compte client</h2>
          <p className="text-xs text-muted-foreground mb-4">Étape {regStep} / 2</p>
          <div className="flex gap-1 mb-5">{[1,2].map(s=><div key={s} className="flex-1 h-1 rounded-full" style={{backgroundColor:regStep>=s?"#1B3A6B":"#DDE3ED"}}/>)}</div>
          {regStep===1 ? (
            <div className="space-y-4">
              <div><Lbl>Raison sociale</Lbl><input type="text" placeholder="Ex : Marjane Logistics SARL" className={fi}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>RC</Lbl><input type="text" placeholder="RC 45123" className={fi}/></div>
                <div><Lbl>ICE</Lbl><input type="text" placeholder="ICE 001234" className={fi}/></div>
              </div>
              <div><Lbl>Adresse du siège</Lbl><input type="text" placeholder="Rue, ville" className={fi}/></div>
              <div><Lbl>Téléphone</Lbl><input type="tel" placeholder="+212 5 XX XX XX XX" className={fi}/></div>
              <button onClick={()=>setRegStep(2)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{backgroundColor:"#1B3A6B"}}>Suivant →</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div><Lbl>Email professionnel</Lbl><input type="email" placeholder="contact@entreprise.ma" className={fi}/></div>
              <div><Lbl>Mot de passe</Lbl><input type="password" placeholder="••••••••" className={fi}/></div>
              <div><Lbl>Patente (PDF)</Lbl>
                <div className="border-2 border-dashed border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-primary/40 text-xs text-muted-foreground">
                  <Upload size={15}/> Uploader la patente
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setRegStep(1)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Retour</button>
                <button onClick={()=>{setShowReg(false);onLogin("client");}} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{backgroundColor:"#1B3A6B"}}>Créer le compte</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const RoleIcon = roles[role].icon as React.ComponentType<{size?:number;className?:string}>;
  return (
    <div className="min-h-screen flex" style={{backgroundColor:"#F0F4F8"}}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 p-10" style={{backgroundColor:"#0D1B2A"}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor:"#F97316"}}><Truck size={20} className="text-white"/></div>
          <span className="text-xl font-bold text-white" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{APP}</span>
        </div>
        <div>
          <p className="text-3xl font-bold text-white leading-snug mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            La logistique de transport, pensée pour le Maroc et au-delà.
          </p>
          <p className="text-sm" style={{color:"rgba(255,255,255,0.4)"}}>Gestion de flotte · Suivi itinéraires · Gestion conducteurs · Transport international</p>
          <div className="mt-8 space-y-3">
            {[{n:"30+",l:"Camions gérés"},{n:"12",l:"Pays desservis"},{n:"99.2%",l:"Uptime plateforme"}].map(s=>(
              <div key={s.l} className="flex items-center gap-3">
                <span className="text-lg font-bold" style={{color:"#F97316",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{s.n}</span>
                <span className="text-sm" style={{color:"rgba(255,255,255,0.45)"}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{color:"rgba(255,255,255,0.2)"}}>© 2026 {APP}. Tous droits réservés.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:"#1B3A6B"}}><Truck size={17} className="text-white"/></div>
            <span className="text-lg font-bold" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{APP}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Connexion</h1>
          <p className="text-sm text-muted-foreground mb-6">Sélectionnez votre profil et connectez-vous.</p>

          {/* Role picker */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(Object.entries(roles) as [typeof role, typeof roles[typeof role]][]).map(([k,cfg])=>{
              const Ic=cfg.icon as React.ComponentType<{size?:number}>;
              const active=role===k;
              return (
                <button key={k} onClick={()=>setRole(k)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all"
                  style={active?{borderColor:cfg.color,backgroundColor:cfg.color+"12",color:cfg.color}:{borderColor:"var(--border)",color:"#5A6882"}}>
                  <Ic size={20}/>{cfg.label}
                </button>
              );
            })}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{backgroundColor:roles[role].color+"10"}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:roles[role].color}}>
                <RoleIcon size={16} className="text-white"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{roles[role].label}</p>
                <p className="text-xs text-muted-foreground">{roles[role].desc}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div><Lbl>Email / Identifiant</Lbl>
                <input type="email" placeholder={role==="driver"?"driver@portransline.ma":"vous@exemple.ma"} className={fi}/>
              </div>
              <div><Lbl>Mot de passe</Lbl><input type="password" placeholder="••••••••" className={fi}/></div>
              <button onClick={()=>onLogin(role)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{backgroundColor:roles[role].color}}>
                Connexion — {roles[role].label}
              </button>
            </div>
            {role==="client" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Pas encore de compte ?{" "}
                <button onClick={()=>setShowReg(true)} className="font-semibold text-primary hover:underline">Créer un compte</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DRIVER PORTAL
══════════════════════════════════════════ */
function AddExpenseModal({onClose}:{onClose:()=>void}) {
  const [type,setType]=useState("carburant");
  const [amount,setAmount]=useState("");
  const [desc,setDesc]=useState("");
  const [done,setDone]=useState(false);
  if(done) return <Modal title="Dépense enregistrée" onClose={onClose}>
    <SuccessScreen msg="Dépense soumise" sub="En attente de validation administrateur." onClose={onClose}/>
  </Modal>;
  return (
    <Modal title="Ajouter une dépense" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Lbl>Type</Lbl>
          <div className="grid grid-cols-2 gap-2">
            {[{v:"carburant",l:"Carburant",I:Fuel},{v:"peage",l:"Péage",I:Globe},{v:"repas",l:"Repas",I:Package},{v:"autre",l:"Autre",I:FileText}].map(t=>(
              <button key={t.v} onClick={()=>setType(t.v)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={type===t.v?{borderColor:"#1B3A6B",backgroundColor:"#E8EEF6",color:"#1B3A6B"}:{borderColor:"var(--border)",color:"#5A6882"}}>
                <t.I size={14}/>{t.l}
              </button>
            ))}
          </div>
        </div>
        <div><Lbl>Montant (MAD)</Lbl><input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} className={fi}/></div>
        <div><Lbl>Description</Lbl><textarea rows={2} placeholder="Détails..." value={desc} onChange={e=>setDesc(e.target.value)} className={fi+" resize-none"}/></div>
        <div><Lbl>Justificatif (optionnel)</Lbl>
          <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/40">
            <Upload size={18}/><span className="text-xs">Glisser ou cliquer</span>
          </div>
        </div>
        <button onClick={()=>setDone(true)} disabled={!amount} className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{backgroundColor:"#1B3A6B"}}>Soumettre</button>
      </div>
    </Modal>
  );
}

function AddTicketModal({onClose}:{onClose:()=>void}) {
  const [photo,setPhoto]=useState<string|null>(null);
  const [amount,setAmount]=useState("");
  const [reason,setReason]=useState("");
  const [loc,setLoc]=useState("");
  const [done,setDone]=useState(false);
  const ref=useRef<HTMLInputElement>(null);
  if(done) return <Modal title="Ticket enregistré" onClose={onClose}>
    <SuccessScreen msg="Ticket transmis" sub="Photo et détails envoyés à l'administration." onClose={onClose} color="#DC2626"/>
  </Modal>;
  return (
    <Modal title="Déclarer un ticket / amende" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Lbl>Photo du ticket *</Lbl>
          <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setPhoto(URL.createObjectURL(f));}}/>
          {photo?(
            <div className="relative rounded-xl overflow-hidden" style={{height:180}}>
              <img src={photo} alt="Ticket" className="w-full h-full object-cover"/>
              <button onClick={()=>setPhoto(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"><X size={13}/></button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1 text-white text-xs"><CheckCircle size={11}/> Photo ajoutée</div>
            </div>
          ):(
            <button onClick={()=>ref.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/40">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor:"#E8EEF6"}}><Camera size={22} style={{color:"#1B3A6B"}}/></div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Prendre ou choisir une photo</p>
                <p className="text-xs text-muted-foreground">Obligatoire</p>
              </div>
            </button>
          )}
        </div>
        <div><Lbl>Montant (MAD)</Lbl><input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} className={fi}/></div>
        <div><Lbl>Motif</Lbl><input type="text" placeholder="Ex : Excès de vitesse..." value={reason} onChange={e=>setReason(e.target.value)} className={fi}/></div>
        <div><Lbl>Lieu</Lbl><input type="text" placeholder="Ex : A1 Km 45, Rabat" value={loc} onChange={e=>setLoc(e.target.value)} className={fi}/></div>
        <button onClick={()=>setDone(true)} disabled={!photo||!amount} className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{backgroundColor:"#DC2626"}}>Soumettre le ticket</button>
        {!photo && <p className="text-center text-xs text-destructive">La photo est requise</p>}
      </div>
    </Modal>
  );
}

function PointageModal({onClose}:{onClose:()=>void}) {
  const [step,setStep]=useState<"form"|"confirm"|"done">("form");
  const [type,setType]=useState<"prise_en_charge"|"fin_service"|"relais">("relais");
  const [scope,setScope]=useState<"national"|"international">("national");
  const [relay,setRelay]=useState("");
  const [relayDriver,setRelayDriver]=useState("");
  const now=new Date();
  const time=now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  const date=now.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
  const ref=Math.floor(Math.random()*90000+10000);
  const typeLabel={prise_en_charge:"Prise en charge",fin_service:"Fin de service",relais:"Relais conducteur"};
  const points=scope==="national"?relayNational:relayIntl;

  if(step==="done") return (
    <Modal title="Pointage validé" onClose={onClose}>
      <div className="flex flex-col items-center py-4 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor:"#ECFDF5"}}><Stamp size={28} style={{color:"#10B981"}}/></div>
        <p className="font-bold text-foreground text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Pointage enregistré</p>
        <div className="w-full bg-secondary rounded-xl p-4 space-y-2 text-sm">
          {[["Type",typeLabel[type]],["Heure",time],["Date",date],["Lieu",relay||"—"],...(type==="relais"&&relayDriver?[["Relais →",relayDriver]]:[]),["Réf.",`PTG-${ref}`]].map(([k,v])=>(
            <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-foreground font-mono text-sm">{v}</span></div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Horodaté et géolocalisé. Transmis à l'administration.</p>
        <button onClick={onClose} className="px-6 py-2.5 text-white rounded-lg text-sm font-semibold" style={{backgroundColor:"#10B981"}}>Fermer</button>
      </div>
    </Modal>
  );

  if(step==="confirm") return (
    <Modal title="Confirmer le pointage" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-4 space-y-3 text-sm">
          {[["Type",typeLabel[type]],["Heure",time],["Date",date],["Lieu",relay||"—"],...(type==="relais"&&relayDriver?[["Conducteur",relayDriver]]:[])].map(([k,v])=>(
            <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-foreground">{v}</span></div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={()=>setStep("form")} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Modifier</button>
          <button onClick={()=>setStep("done")} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{backgroundColor:"#1B3A6B"}}>Valider & Signer</button>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Nouveau pointage" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Lbl>Type de pointage</Lbl>
          <div className="space-y-2">
            {(["prise_en_charge","relais","fin_service"] as const).map(t=>(
              <button key={t} onClick={()=>setType(t)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all"
                style={type===t?{borderColor:"#1B3A6B",backgroundColor:"#E8EEF6",color:"#1B3A6B"}:{borderColor:"var(--border)",color:"#5A6882"}}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{borderColor:type===t?"#1B3A6B":"#B0BCCF"}}>
                  {type===t&&<div className="w-2 h-2 rounded-full bg-primary"/>}
                </div>
                {typeLabel[t]}
              </button>
            ))}
          </div>
        </div>
        {type==="relais"&&(
          <div>
            <Lbl>Portée du relais</Lbl>
            <div className="flex gap-2">
              {(["national","international"] as const).map(s=>(
                <button key={s} onClick={()=>{setScope(s);setRelay("");setRelayDriver("");}}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border transition-all"
                  style={scope===s?{borderColor:"#1B3A6B",backgroundColor:"#E8EEF6",color:"#1B3A6B"}:{borderColor:"var(--border)",color:"#5A6882"}}>
                  {s==="national"?"🇲🇦 National":"🌍 International"}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <Lbl>{type==="relais"?"Point de relais":"Lieu"}</Lbl>
          <select value={relay} onChange={e=>setRelay(e.target.value)} className={fi}>
            <option value="">Sélectionner...</option>
            {(type==="relais"?points:relayNational).map(p=>(
              <option key={p.id} value={`${p.city} (${p.country}) — ${p.address}`}>{p.city} ({p.country})</option>
            ))}
          </select>
        </div>
        {type==="relais"&&(
          <div>
            <Lbl>Conducteur qui prend le relais</Lbl>
            <select value={relayDriver} onChange={e=>setRelayDriver(e.target.value)} className={fi}>
              <option value="">Sélectionner...</option>
              {driversData.filter(d=>d.status==="repos").map(d=>(
                <option key={d.id} value={d.name}>{d.name} ({d.type})</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={()=>setStep("confirm")} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{backgroundColor:"#1B3A6B"}}>Continuer →</button>
      </div>
    </Modal>
  );
}

function SuccessScreen({msg,sub,onClose,color="#10B981",children}:{msg:string;sub:string;onClose:()=>void;color?:string;children?:React.ReactNode}) {
  return (
    <div className="flex flex-col items-center py-4 gap-3">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{backgroundColor:color+"18"}}><CheckCircle size={28} style={{color}}/></div>
      <p className="font-semibold text-foreground text-center">{msg}</p>
      <p className="text-sm text-muted-foreground text-center">{sub}</p>
      {children}
      <button onClick={onClose} className="px-6 py-2.5 text-white rounded-lg text-sm font-semibold" style={{backgroundColor:color}}>Fermer</button>
    </div>
  );
}

function DriverPortal({onLogout}:{onLogout:()=>void}) {
  const [page,setPage]=useState<DriverPage>("mission");
  const [showExp,setShowExp]=useState(false);
  const [showTkt,setShowTkt]=useState(false);
  const [showPtg,setShowPtg]=useState(false);
  const driver=driversData[0];
  const tabs=[
    {id:"mission"  as DriverPage,label:"Mission",  icon:Navigation},
    {id:"depenses" as DriverPage,label:"Dépenses", icon:DollarSign},
    {id:"tickets"  as DriverPage,label:"Tickets",  icon:AlertTriangle},
    {id:"pointage" as DriverPage,label:"Pointage", icon:ScanLine},
  ];
  const relayPts=[
    {city:"Rabat",     address:"Zone Industrielle Ain Atiq", dist:"48 km", eta:"35 min", dispo:2},
    {city:"Kénitra",   address:"Aire de repos N1",           dist:"78 km", eta:"55 min", dispo:1},
    {city:"Sidi Kacem",address:"Station Afriquia",           dist:"124 km",eta:"1h 22",  dispo:2},
  ];
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {showExp&&<AddExpenseModal onClose={()=>setShowExp(false)}/>}
      {showTkt&&<AddTicketModal  onClose={()=>setShowTkt(false)}/>}
      {showPtg&&<PointageModal   onClose={()=>setShowPtg(false)}/>}

      <header className="shrink-0 px-4 py-3 flex items-center justify-between" style={{backgroundColor:"#0D1B2A"}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{backgroundColor:"#F97316"}}>HB</div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{driver.name}</p>
            <p className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>TRK-001 · Casablanca → Tanger</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-mono font-semibold"
            style={{backgroundColor:driver.hoursLeft<2?"#FEF2F2":"#E8EEF6",color:driver.hoursLeft<2?"#DC2626":"#1B3A6B"}}>
            <Clock size={11}/>{driver.hoursLeft}h
          </div>
          <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40"><LogOut size={15}/></button>
        </div>
      </header>

      <div className="shrink-0 flex border-b border-border bg-card">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setPage(t.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-semibold border-b-2"
            style={page===t.id?{borderColor:"#1B3A6B",color:"#1B3A6B"}:{borderColor:"transparent",color:"#5A6882"}}>
            <t.icon size={16}/>{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" style={{scrollbarWidth:"thin"}}>
        {/* MISSION */}
        {page==="mission"&&(
          <div className="p-4 space-y-4 max-w-xl mx-auto">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Mission en cours</h2>
                <StatusBadge status="en_route"/>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1"><p className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Casablanca</p><p className="text-xs text-muted-foreground">Départ 06:30</p></div>
                <Truck size={18} style={{color:"#1B3A6B"}}/>
                <div className="text-center flex-1"><p className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Tanger</p><p className="text-xs text-muted-foreground">ETA 10:15</p></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progression</span><span className="font-mono font-semibold text-primary">72% — 312 km</span></div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{width:"72%"}}/></div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <FuelBar value={72}/><span>·</span><span>Produits alimentaires</span>
              </div>
            </div>
            {driver.hoursLeft<=3&&(
              <div className="rounded-xl border p-4 flex gap-3" style={{backgroundColor:"#FFF7ED",borderColor:"#FED7AA"}}>
                <AlertTriangle size={18} style={{color:"#F97316"}} className="shrink-0 mt-0.5"/>
                <div>
                  <p className="text-sm font-semibold" style={{color:"#C2410C"}}>Limite d'heures proche</p>
                  <p className="text-xs mt-0.5" style={{color:"#9A3412"}}>Il vous reste {driver.hoursLeft}h. Utilisez l'onglet Pointage pour enregistrer un relais.</p>
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Points de relais à proximité</h3>
              <div className="space-y-2">
                {relayPts.map((r,i)=>(
                  <div key={r.city} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold shrink-0">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{r.city}</p>
                      <p className="text-xs text-muted-foreground">{r.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">{r.dist}</p>
                      <p className="text-xs text-muted-foreground">{r.dispo} dispo.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold text-foreground">Dispatcher</p><p className="text-xs text-muted-foreground">Urgences et coordination</p></div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{backgroundColor:"#10B981"}}><Phone size={13}/> Appeler</button>
            </div>
          </div>
        )}

        {/* DEPENSES */}
        {page==="depenses"&&(
          <div className="p-4 space-y-4 max-w-xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Mes dépenses</h2>
              <button onClick={()=>setShowExp(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-lg" style={{backgroundColor:"#1B3A6B"}}><Plus size={14}/> Ajouter</button>
            </div>
            <div className="space-y-2">
              {driverExpenses.map(e=>(
                <div key={e.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:e.type==="Carburant"?"#E8EEF6":e.type==="Péage"?"#ECFDF5":"#FEF3E8"}}>
                    {e.type==="Carburant"?<Fuel size={17} style={{color:"#1B3A6B"}}/>:e.type==="Péage"?<Globe size={17} style={{color:"#10B981"}}/>:<Package size={17} style={{color:"#F97316"}}/>}
                  </div>
                  <div className="flex-1"><p className="text-sm font-semibold text-foreground">{e.desc}</p><p className="text-xs text-muted-foreground">{e.date}</p></div>
                  <div className="text-right"><p className="text-sm font-bold font-mono text-foreground">{e.amount} MAD</p><StatusBadge status={e.status}/></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TICKETS */}
        {page==="tickets"&&(
          <div className="p-4 space-y-4 max-w-xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Tickets / Amendes</h2>
              <button onClick={()=>setShowTkt(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-lg" style={{backgroundColor:"#DC2626"}}><Plus size={14}/> Déclarer</button>
            </div>
            <div className="rounded-xl border p-3 flex gap-2 text-xs" style={{backgroundColor:"#FFF7ED",borderColor:"#FED7AA"}}>
              <AlertTriangle size={14} style={{color:"#F97316"}} className="shrink-0 mt-0.5"/>
              <p style={{color:"#9A3412"}}>Tout ticket doit être déclaré sous 48h avec photo obligatoire.</p>
            </div>
            {driverTickets.map(t=>(
              <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div><p className="text-sm font-semibold text-foreground">{t.reason}</p><p className="text-xs text-muted-foreground">{t.location} · {t.date}</p></div>
                  <StatusBadge status={t.status}/>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-base font-bold font-mono" style={{color:"#DC2626"}}>{t.amount} MAD</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full"><Camera size={11}/> Photo jointe</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* POINTAGE */}
        {page==="pointage"&&(
          <div className="p-4 space-y-4 max-w-xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Pointage</h2>
              <button onClick={()=>setShowPtg(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-lg" style={{backgroundColor:"#1B3A6B"}}><ScanLine size={14}/> Pointer</button>
            </div>
            <div className="space-y-3">
              {driverPointageInit.map(p=>(
                <div key={p.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{backgroundColor:p.type==="Relais"?"#FEF3E8":p.type==="Fin de service"?"#FEF2F2":"#ECFDF5"}}>
                        <Stamp size={16} style={{color:p.type==="Relais"?"#F97316":p.type==="Fin de service"?"#DC2626":"#10B981"}}/>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.type}</p>
                        <p className="text-xs text-muted-foreground">{p.lieu}</p>
                        {p.relay!=="—"&&<p className="text-xs mt-0.5" style={{color:"#F97316"}}>{p.relay}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold text-foreground">{p.heure}</p>
                      <p className="text-xs text-muted-foreground">{p.date}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border"><span className="text-xs font-mono text-muted-foreground">Réf. {p.id}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CLIENT PORTAL
══════════════════════════════════════════ */
function ClientPortal({onLogout}:{onLogout:()=>void}) {
  const [page,setPage]=useState<ClientPage>("home");
  if(page==="newrequest") return <ClientNewRequest onBack={()=>setPage("home")} onSubmit={()=>setPage("myrequests")}/>;
  if(page==="myrequests") return <ClientMyRequests onBack={()=>setPage("home")} onNew={()=>setPage("newrequest")}/>;
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor:"#1B3A6B"}}><Truck size={15} className="text-white"/></div>
          <span className="font-bold text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{APP}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground">Groupe Marjane Logistics</p>
            <p className="text-xs text-muted-foreground">RC 45123 · Casablanca</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{backgroundColor:"#10B981"}}>ML</div>
          <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><LogOut size={15}/></button>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-primary rounded-2xl p-5 text-white">
          <p className="text-sm opacity-60">Bienvenue,</p>
          <h1 className="text-xl font-bold mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Groupe Marjane Logistics</h1>
          <button onClick={()=>setPage("newrequest")} className="mt-4 flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-primary bg-white hover:bg-white/90">
            <Plus size={15}/> Nouvelle demande
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{label:"Total",value:"7",color:"#1B3A6B"},{label:"En cours",value:"2",color:"#F97316"},{label:"Approuvées",value:"5",color:"#10B981"}].map(k=>(
            <div key={k.label} className="bg-card rounded-xl border border-border p-3 text-center">
              <p className="text-xl font-bold" style={{color:k.color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Demandes récentes</h2>
            <button onClick={()=>setPage("myrequests")} className="text-xs text-primary font-semibold hover:underline">Voir tout</button>
          </div>
          <div className="space-y-2">
            {clientRequestsData.map(r=>(
              <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.type}</p>
                    <p className="text-xs text-muted-foreground">{r.from} → {r.to} · {r.date}</p>
                  </div>
                  <StatusBadge status={r.status}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientNewRequest({onBack,onSubmit}:{onBack:()=>void;onSubmit:()=>void}) {
  const [scope,setScope]=useState<"national"|"international">("national");
  const [prodType,setProdType]=useState("");
  const [customProd,setCustomProd]=useState("");
  const [fromCity,setFromCity]=useState("");
  const [toCity,setToCity]=useState("");
  const [done,setDone]=useState(false);
  function submit(){setDone(true);setTimeout(onSubmit,1600);}
  if(done) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{backgroundColor:"#ECFDF5"}}><CheckCircle size={30} style={{color:"#10B981"}}/></div>
        <h2 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Demande envoyée !</h2>
        <p className="text-sm text-muted-foreground">Votre demande a été transmise. Vous serez notifié dès qu'elle sera traitée.</p>
      </div>
    </div>
  );
  const natCities=moroccanCities;
  const intlCities=[...europeanCities,...africanCities];
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3.5 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={onBack} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"><X size={16}/></button>
        <h1 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Nouvelle demande de transport</h1>
      </header>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Scope */}
        <div>
          <Lbl>Type de transport</Lbl>
          <div className="grid grid-cols-2 gap-3">
            {(["national","international"] as const).map(s=>(
              <button key={s} onClick={()=>{setScope(s);setFromCity("");setToCity("");}}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all"
                style={scope===s?{borderColor:"#1B3A6B",backgroundColor:"#E8EEF6",color:"#1B3A6B"}:{borderColor:"var(--border)",color:"#5A6882"}}>
                {s==="national"?<Truck size={16}/>:<Globe size={16}/>}
                {s==="national"?"National 🇲🇦":"International 🌍"}
              </button>
            ))}
          </div>
        </div>

        {/* Product */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h3 className="text-sm font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Marchandise</h3>
          <div>
            <Lbl>Type de produit</Lbl>
            <select value={prodType} onChange={e=>setProdType(e.target.value)} className={fi}>
              <option value="">Sélectionner...</option>
              {productTypes.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {prodType==="Autre"&&(
            <div>
              <Lbl>Précisez le type de produit</Lbl>
              <input type="text" placeholder="Décrivez votre marchandise..." value={customProd} onChange={e=>setCustomProd(e.target.value)} className={fi}/>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Poids (tonnes)</Lbl><input type="number" placeholder="Ex : 18" className={fi}/></div>
            <div><Lbl>Nombre de camions</Lbl><input type="number" placeholder="Ex : 2" min="1" className={fi}/></div>
          </div>
        </div>

        {/* Route */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h3 className="text-sm font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Itinéraire</h3>
          <div>
            <Lbl>Ville de départ</Lbl>
            <select value={fromCity} onChange={e=>setFromCity(e.target.value)} className={fi}>
              <option value="">Sélectionner une ville...</option>
              <optgroup label="Villes marocaines">{natCities.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <Lbl>Ville de destination</Lbl>
            <select value={toCity} onChange={e=>setToCity(e.target.value)} className={fi}>
              <option value="">Sélectionner une ville...</option>
              {scope==="national"?(
                <optgroup label="Villes marocaines">{natCities.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
              ):(
                <>
                  <optgroup label="Europe">{europeanCities.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
                  <optgroup label="Afrique">{africanCities.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
                </>
              )}
            </select>
          </div>
          <div><Lbl>Date souhaitée</Lbl><input type="date" className={fi}/></div>
          {scope==="international"&&(
            <div className="rounded-lg p-3 flex gap-2 text-xs" style={{backgroundColor:"#E8EEF6"}}>
              <Globe size={13} style={{color:"#1B3A6B"}} className="shrink-0 mt-0.5"/>
              <p style={{color:"#1B3A6B"}}>Transport international : un conducteur habilité transfrontalier sera assigné.</p>
            </div>
          )}
        </div>

        {/* Company */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h3 className="text-sm font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Données entreprise</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>RC</Lbl><input type="text" placeholder="RC 45123" className={fi}/></div>
            <div><Lbl>ICE</Lbl><input type="text" placeholder="001234..." className={fi}/></div>
          </div>
          <div><Lbl>Instructions spéciales</Lbl><textarea rows={3} placeholder="Contraintes, horaires de réception..." className={fi+" resize-none"}/></div>
        </div>

        <button onClick={submit} className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90" style={{backgroundColor:"#1B3A6B"}}>
          <Send size={15}/> Envoyer la demande
        </button>
      </div>
    </div>
  );
}

function ClientMyRequests({onBack,onNew}:{onBack:()=>void;onNew:()=>void}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"><X size={16}/></button>
          <h1 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Mes demandes</h1>
        </div>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-lg" style={{backgroundColor:"#1B3A6B"}}><Plus size={14}/> Nouvelle</button>
      </header>
      <div className="max-w-xl mx-auto px-4 py-5 space-y-3">
        {clientRequestsData.map(r=>(
          <div key={r.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div><span className="font-mono text-xs text-muted-foreground">{r.id}</span><p className="text-sm font-bold text-foreground mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{r.type}</p></div>
              <StatusBadge status={r.status}/>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin size={11}/>{r.from} → {r.to}</span>
              <span className="flex items-center gap-1"><Calendar size={11}/>{r.date}</span>
              <span className="flex items-center gap-1"><Package size={11}/>{r.weight}</span>
              <span className="flex items-center gap-1"><Truck size={11}/>{r.trucks} camion{r.trucks>1?"s":""}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>{r.scope==="international"?"🌍 International":"🇲🇦 National"}</span>
              <span>Soumis le {r.submitted}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN — FLEET TRACKING BY PRODUCT CLASSIFICATION
══════════════════════════════════════════ */
function FleetTrackingSection() {
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [sel, setSel] = useState<typeof fleetDataInit[0] | null>(null);
  const delivering = fleetDataInit.filter(t => activeDeliveryStatuses.has(t.status) && t.productType);
  const filtered = delivering.filter(t => productFilter === "all" || t.productType === productFilter);
  const counts = Object.fromEntries(
    productTypes.map(type => [type, delivering.filter(t => t.productType === type).length])
  ) as Record<(typeof productTypes)[number], number>;
  const [routeMap, setRouteMap] = useState<any[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchRouteMarkers().then(m => { if (alive && m.length) setRouteMap(m); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const mapTrucks = routeMap ?? filtered;   // vraies routes de la base, sinon repli mock

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Suivi flotte · Classification marchandises
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} camion{filtered.length > 1 ? "s" : ""} en livraison
            {productFilter !== "all" ? ` · ${productFilter}` : ` · ${delivering.length} livraisons actives`}
          </p>
          {routeMap && <span className="inline-block text-xs font-bold mt-1" style={{ color: "#10B981" }}>● Itinéraires en direct de PostgreSQL</span>}
        </div>
        <button
          onClick={() => setProductFilter("all")}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all"
          style={productFilter === "all"
            ? { backgroundColor: "#E8EEF6", color: "#1B3A6B", borderColor: "#1B3A6B" }
            : { borderColor: "var(--border)", color: "#5A6882" }}
        >
          <RefreshCw size={13} /> Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Livraisons actives" value={String(delivering.length)} sub="Toutes classifications" icon={Truck} />
        <KpiCard
          label="Classification filtrée"
          value={String(filtered.length)}
          sub={productFilter === "all" ? "Aucun filtre" : productClassificationMeta[productFilter].short}
          icon={Filter}
          accent
        />
        <KpiCard
          label="Types couverts"
          value={String(Object.values(counts).filter(c => c > 0).length)}
          sub={`Sur ${productTypes.length} catégories`}
          icon={Package}
        />
        <KpiCard
          label="Alertes livraison"
          value={String(filtered.filter(t => t.status === "alerte" || t.fuel < 20).length)}
          sub="Carburant ou statut"
          icon={AlertTriangle}
          alert={filtered.some(t => t.status === "alerte" || t.fuel < 20)}
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtrer par type de marchandise</p>
          <span className="text-xs text-muted-foreground">{delivering.length} camions en livraison</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
          <button
            onClick={() => setProductFilter("all")}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
            style={productFilter === "all"
              ? { backgroundColor: "#1B3A6B", color: "#fff", borderColor: "#1B3A6B" }
              : { borderColor: "var(--border)", color: "#5A6882" }}
          >
            <Layers size={13} /> Tous
            <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: productFilter === "all" ? "rgba(255,255,255,0.2)" : "#EFF2F8" }}>
              {delivering.length}
            </span>
          </button>
          {productTypes.map(type => {
            const meta = productClassificationMeta[type];
            const count = counts[type];
            const active = productFilter === type;
            return (
              <button
                key={type}
                onClick={() => setProductFilter(type)}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                style={active
                  ? { backgroundColor: meta.color, color: "#fff", borderColor: meta.color }
                  : { backgroundColor: meta.bg, color: meta.color, borderColor: `${meta.color}33` }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: active ? "#fff" : meta.color }} />
                {meta.short}
                <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-card rounded-2xl border border-border overflow-hidden" style={{ height: 420 }}>
          <FleetTrackingMap
            trucks={mapTrucks}
            selectedId={sel?.id ?? null}
            onSelect={t => setSel(t)}
            productMeta={productClassificationMeta}
          />
        </div>

        <div className="bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Camions triés par marchandise
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cliquez pour localiser sur la carte</p>
          </div>
          {sel && sel.productType && (
            <div className="px-4 py-3 border-b border-border bg-secondary/40">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{sel.id}</span>
                <button onClick={() => setSel(null)} className="p-0.5 hover:bg-muted rounded text-muted-foreground"><X size={12} /></button>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ color: productClassificationMeta[sel.productType].color, backgroundColor: productClassificationMeta[sel.productType].bg }}
              >
                <Package size={10} /> {sel.productType}
              </span>
              <p className="text-xs font-semibold text-foreground mt-2">{sel.driver}</p>
              <p className="text-xs text-muted-foreground">{sel.route} · {sel.km} km</p>
              <div className="mt-2"><FuelBar value={sel.fuel} /></div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[420px]" style={{ scrollbarWidth: "thin" }}>
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                Aucune livraison active pour cette classification.
              </div>
            ) : (
              [...filtered]
                .sort((a, b) => (a.productType || "").localeCompare(b.productType || ""))
                .map(t => {
                  const meta = t.productType ? productClassificationMeta[t.productType] : productClassificationMeta.Autre;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSel(t)}
                      className="w-full text-left rounded-xl border border-border p-3 hover:shadow-sm transition-all"
                      style={{ borderLeft: `4px solid ${meta.color}`, backgroundColor: sel?.id === t.id ? meta.bg : undefined }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] text-muted-foreground">{t.id}</span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold truncate max-w-[160px]"
                              style={{ color: meta.color, backgroundColor: meta.bg }}
                            >
                              {t.productType}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-1 truncate">{t.driver}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.route}</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.plate}</span>
                        <span>{t.km} km</span>
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {productTypes.map(type => {
          const meta = productClassificationMeta[type];
          const count = counts[type];
          return (
            <button
              key={type}
              onClick={() => setProductFilter(type)}
              className="rounded-xl border p-3 text-left transition-all hover:shadow-sm"
              style={{
                borderColor: productFilter === type ? meta.color : "var(--border)",
                backgroundColor: productFilter === type ? meta.bg : "#fff",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                <span className="text-[11px] font-bold truncate" style={{ color: meta.color }}>{meta.short}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{type}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN — WORLD MAP
══════════════════════════════════════════ */
function CarteSection() {
  const [hovered,setHovered]=useState<string|null>(null);
  const [sel,setSel]=useState<typeof fleetDataInit[0]|null>(null);
  const [showRelays,setShowRelays]=useState(true);
  const statColor:Record<string,string>={en_route:"#1B3A6B",livraison:"#F97316",disponible:"#10B981",maintenance:"#D97706",alerte:"#DC2626"};
  const allRelays=[...relayNational.map(r=>({...r,intl:false})),...relayIntl.map(r=>({...r,intl:true}))];

  /* Simplified continent paths in a 0-100 x 0-80 viewBox */
  const landPaths=[
    // North America
    "M5,18 L8,14 L14,13 L22,15 L26,19 L28,25 L27,30 L24,35 L21,38 L17,37 L13,39 L9,36 L6,30 L5,24 Z",
    // South America
    "M18,42 L22,40 L26,42 L28,48 L27,56 L25,62 L22,65 L18,64 L15,58 L14,50 L15,44 Z",
    // Europe (simplified)
    "M44,18 L48,16 L54,17 L58,19 L60,23 L58,27 L54,29 L50,31 L46,29 L43,25 L44,20 Z",
    // Africa
    "M44,30 L52,28 L58,30 L62,36 L63,44 L61,54 L58,62 L54,66 L49,67 L44,65 L40,58 L38,50 L40,40 L42,33 Z",
    // Asia (simplified two-part)
    "M58,17 L68,14 L80,15 L88,20 L92,26 L88,32 L80,36 L70,37 L62,34 L57,28 L58,20 Z",
    "M80,36 L88,32 L92,38 L90,44 L85,48 L78,46 L76,40 Z",
    // Australia
    "M78,54 L84,52 L90,54 L92,60 L90,66 L84,68 L78,66 L76,60 Z",
    // Greenland
    "M26,8 L30,6 L34,8 L34,13 L30,15 L26,13 Z",
    // UK & Ireland
    "M43,18 L45,16 L47,17 L47,21 L44,22 L43,20 Z",
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Carte de suivi mondiale</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Positions en temps réel · {fleetDataInit.length} camions · {allRelays.length} points de relais</p>
        </div>
        <button onClick={()=>setShowRelays(r=>!r)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all"
          style={showRelays?{backgroundColor:"#E8EEF6",color:"#1B3A6B",borderColor:"#1B3A6B"}:{borderColor:"var(--border)",color:"#5A6882"}}>
          <Layers size={13}/> Relais {showRelays?"visibles":"masqués"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        {[{l:"En route",c:"#1B3A6B"},{l:"Livraison",c:"#F97316"},{l:"Alerte",c:"#DC2626"},{l:"Maintenance",c:"#D97706"}].map(x=>(
          <span key={x.l} className="flex items-center gap-1.5 text-muted-foreground"><span className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:x.c}}/>{x.l}</span>
        ))}
        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-3 h-3 rounded-full border-2 shrink-0" style={{borderColor:"#10B981"}}/> Relais national</span>
        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-3 h-3 rounded-full border-2 shrink-0" style={{borderColor:"#F97316"}}/> Relais international</span>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden relative" style={{height:460}}>
        <div className="absolute inset-0" style={{background:"linear-gradient(160deg,#C8E6F7 0%,#B8D8F0 50%,#C5E0F5 100%)"}}>
          <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" style={{pointerEvents:"none"}}>
            {/* Grid */}
            {[...Array(9)].map((_,i)=><line key={`h${i}`} x1="0" y1={i*10} x2="100" y2={i*10} stroke="rgba(27,58,107,0.06)" strokeWidth="0.3"/>)}
            {[...Array(11)].map((_,i)=><line key={`v${i}`} x1={i*10} y1="0" x2={i*10} y2="80" stroke="rgba(27,58,107,0.06)" strokeWidth="0.3"/>)}
            {/* Land */}
            {landPaths.map((d,i)=><path key={i} d={d} fill="rgba(27,58,107,0.08)" stroke="rgba(27,58,107,0.2)" strokeWidth="0.3"/>)}
            {/* Labels */}
            {[{t:"Maroc",x:19,y:48},{t:"France",x:48,y:23},{t:"Espagne",x:45,y:29},{t:"Italie",x:51,y:30},{t:"Belgique",x:49,y:22},{t:"Sénégal",x:14,y:58},{t:"Algérie",x:24,y:43}].map(l=>(
              <text key={l.t} x={l.x} y={l.y} fontSize="2.2" fill="rgba(27,58,107,0.4)" textAnchor="middle" fontFamily="Inter,sans-serif">{l.t}</text>
            ))}
          </svg>

          {/* Relay points */}
          {showRelays&&allRelays.map(rp=>(
            <div key={rp.id} className="absolute group" style={{left:`${rp.wx}%`,top:`${rp.wy}%`,transform:"translate(-50%,-50%)"}}>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer hover:scale-125 transition-transform"
                style={{borderColor:rp.intl?"#F97316":"#10B981",backgroundColor:rp.intl?"rgba(249,115,22,0.15)":"rgba(16,185,129,0.15)"}}>
                <div className="w-2 h-2 rounded-full" style={{backgroundColor:rp.intl?"#F97316":"#10B981"}}/>
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-foreground rounded-lg shadow-xl px-2.5 py-1.5 text-xs text-background whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-20">
                <p className="font-bold">{rp.city} ({rp.country})</p>
                <p className="opacity-60">{rp.drivers} dispo. · {rp.address.slice(0,28)}…</p>
              </div>
            </div>
          ))}

          {/* Trucks */}
          {fleetDataInit.map(t=>(
            <button key={t.id} className="absolute focus:outline-none z-10"
              style={{left:`${t.wx}%`,top:`${t.wy}%`,transform:"translate(-50%,-50%)"}}
              onMouseEnter={()=>setHovered(t.id)} onMouseLeave={()=>setHovered(null)}
              onClick={()=>setSel(p=>p?.id===t.id?null:t)}>
              <div className="relative">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  style={{backgroundColor:statColor[t.status]||"#5A6882"}}>
                  <Truck size={13} className="text-white"/>
                </div>
                {t.status==="alerte"&&<div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping"/>}
                {hovered===t.id&&(
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-lg shadow-xl px-2.5 py-1.5 text-xs whitespace-nowrap z-20 pointer-events-none">
                    <p className="font-bold">{t.id} · {t.plate}</p>
                    <p className="opacity-60">{t.driver!=="—"?t.driver:"Sans conducteur"}</p>
                    {t.route!=="—"&&<p className="opacity-60">{t.route}</p>}
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* Selected panel */}
          {sel&&(
            <div className="absolute top-3 right-3 bg-white rounded-xl shadow-xl border border-border w-56 p-3 z-20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs">{sel.id}</span>
                <button onClick={()=>setSel(null)} className="p-0.5 hover:bg-muted rounded text-muted-foreground"><X size={12}/></button>
              </div>
              <p className="text-xs font-semibold text-foreground">{sel.driver!=="—"?sel.driver:"Aucun conducteur"}</p>
              <p className="text-xs text-muted-foreground">{sel.plate}</p>
              {sel.route!=="—"&&<p className="text-xs text-muted-foreground mt-1">{sel.route}</p>}
              <div className="mt-2 mb-2"><FuelBar value={sel.fuel}/></div>
              <StatusBadge status={sel.status}/>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border">
            {fleetDataInit.filter(t=>t.status==="en_route"||t.status==="livraison").length} actifs · {allRelays.length} relais mondiaux
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold mb-3 text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Alertes actives</h3>
          {fleetDataInit.filter(t=>t.status==="alerte"||t.fuel<20).map(t=>(
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div><p className="text-xs font-semibold text-foreground">{t.id} · {t.driver!=="—"?t.driver:"Sans conducteur"}</p><p className="text-xs text-muted-foreground">{t.route!=="—"?t.route:"Stationnaire"}</p></div>
              <FuelBar value={t.fuel}/>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold mb-3 text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Points de relais ({allRelays.length})</h3>
          <div className="max-h-52 overflow-y-auto space-y-1" style={{scrollbarWidth:"thin"}}>
            {allRelays.map(rp=>(
              <div key={rp.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:rp.intl?"#F97316":"#10B981"}}/>
                  <p className="text-xs font-semibold text-foreground">{rp.city}</p>
                  <span className="text-xs text-muted-foreground">({rp.country})</span>
                </div>
                <span className="text-xs text-muted-foreground">{rp.drivers} dispo.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN — FLEET + DRIVER ASSIGNMENT
══════════════════════════════════════════ */
function FleetSection() {
  const [fleet,setFleet]=useState(fleetDataInit.map(t=>({...t})));
  const [live,setLive]=useState(false);
  useEffect(()=>{
    let alive=true;
    fetchTrucks(fleetDataInit)
      .then(real=>{ if(alive&&real.length){ setFleet(real); setLive(true); } })
      .catch(()=>{});   // en cas d'echec API : on garde les donnees mockees
    return ()=>{ alive=false; };
  },[]);
  const [search,setSearch]=useState("");
  const [assigning,setAssigning]=useState<typeof fleet[0]|null>(null);
  const [picked,setPicked]=useState("");
  const filtered=fleet.filter(t=>t.plate.toLowerCase().includes(search.toLowerCase())||t.driver.toLowerCase().includes(search.toLowerCase())||t.route.toLowerCase().includes(search.toLowerCase()));
  const available=driversData.filter(d=>d.status==="repos"||!d.truckId);

  function confirm() {
    if(!assigning||!picked) return;
    const d=driversData.find(d=>d.id===picked);
    if(!d) return;
    setFleet(p=>p.map(t=>t.id===assigning.id?{...t,driver:d.name,driverId:d.id}:t));
    setAssigning(null);setPicked("");
  }

  return (
    <div className="space-y-5">
      {assigning&&(
        <Modal title={`Assigner un conducteur — ${assigning.id}`} onClose={()=>{setAssigning(null);setPicked("");}}>
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-3 text-sm">
              <p className="text-muted-foreground text-xs mb-1">Camion</p>
              <p className="font-bold text-foreground">{assigning.id} · {assigning.plate}</p>
              <p className="text-xs text-muted-foreground">{assigning.driver!=="—"?`Actuel : ${assigning.driver}`:"Aucun conducteur assigné"}</p>
            </div>
            <Lbl>Choisir un conducteur disponible</Lbl>
            <div className="space-y-2 max-h-64 overflow-y-auto" style={{scrollbarWidth:"thin"}}>
              {available.length===0&&<p className="text-sm text-muted-foreground text-center py-4">Aucun conducteur disponible</p>}
              {available.map(d=>(
                <button key={d.id} onClick={()=>setPicked(d.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={picked===d.id?{borderColor:"#1B3A6B",backgroundColor:"#E8EEF6"}:{borderColor:"var(--border)"}}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{backgroundColor:"#1B3A6B"}}>
                    {d.name.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{d.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <StatusBadge status={d.status}/>
                      <span>{d.type==="international"?"🌍 Intl.":"🇲🇦 National"}</span>
                      <span>{d.compliance}% conf.</span>
                    </div>
                  </div>
                  {picked===d.id&&<Check size={16} style={{color:"#1B3A6B"}}/>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={()=>{setAssigning(null);setPicked("");}} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground">Annuler</button>
              <button onClick={confirm} disabled={!picked} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{backgroundColor:"#1B3A6B"}}>
                <UserCheck size={14} className="inline mr-1.5"/>Assigner
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Gestion de la flotte</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{fleet.length} camions · {fleet.filter(t=>t.driverId).length} assignés · {fleet.filter(t=>!t.driverId).length} sans conducteur</p>
          {live&&<span className="inline-flex items-center gap-1 text-xs font-bold mt-1" style={{color:"#10B981"}}>● Données en direct de PostgreSQL (via l'API)</span>}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input className="pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {["ID / Plaque","Conducteur","Statut","Route","Carburant","Km","Assignation"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t=>(
                <tr key={t.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3"><span className="font-mono text-xs text-muted-foreground block">{t.id}</span><span className="font-semibold text-foreground">{t.plate}</span></td>
                  <td className="px-4 py-3">
                    {t.driver!=="—"?(
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{backgroundColor:"#1B3A6B"}}>{t.driver.split(" ").map(n=>n[0]).join("")}</div>
                        <span className="text-foreground text-sm">{t.driver}</span>
                      </div>
                    ):<span className="text-xs text-muted-foreground italic">Non assigné</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status}/></td>
                  <td className="px-4 py-3 text-xs text-foreground">{t.route}</td>
                  <td className="px-4 py-3"><FuelBar value={t.fuel}/></td>
                  <td className="px-4 py-3 font-mono text-sm text-foreground">{t.km>0?`${t.km} km`:"—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={()=>{setAssigning(t);setPicked("");}}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all hover:bg-secondary"
                      style={t.driver==="—"?{borderColor:"#1B3A6B",color:"#1B3A6B",backgroundColor:"#E8EEF6"}:{borderColor:"var(--border)",color:"#5A6882"}}>
                      <UserCheck size={12}/>{t.driver==="—"?"Assigner":"Changer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN — DEMANDES
══════════════════════════════════════════ */
function DemandesSection() {
  const [reqs,setReqs]=useState(adminRequestsInit);
  const [sel,setSel]=useState<typeof adminRequestsInit[0]|null>(null);
  const [filter,setFilter]=useState<"all"|"en_attente"|"approuvé"|"rejeté">("all");
  const filtered=reqs.filter(r=>filter==="all"||r.status===filter);
  const approve=(id:string)=>{setReqs(p=>p.map(r=>r.id===id?{...r,status:"approuvé"}:r));setSel(null);};
  const reject=(id:string)=>{setReqs(p=>p.map(r=>r.id===id?{...r,status:"rejeté"}:r));setSel(null);};

  return (
    <div className="space-y-5">
      {sel&&(
        <Modal title={`${sel.id} — Détail demande`} onClose={()=>setSel(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Client",sel.client],["RC",sel.rc],["Produit",sel.type],["Poids",sel.weight],
                ["Camions",`${sel.trucks} camion${sel.trucks>1?"s":""}`],["Type",sel.scope==="international"?"🌍 International":"🇲🇦 National"],
                ["Départ",sel.from],["Arrivée",sel.to],["Date",sel.date],["Soumis le",sel.submitted]
              ].map(([k,v])=>(
                <div key={k} className="bg-secondary rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-sm font-semibold text-foreground">{v}</p>
                </div>
              ))}
            </div>
            {sel.status==="en_attente"?(
              <div className="flex gap-3 pt-2">
                <button onClick={()=>reject(sel.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 text-destructive hover:bg-red-50" style={{borderColor:"#DC2626"}}>Rejeter</button>
                <button onClick={()=>approve(sel.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90" style={{backgroundColor:"#10B981"}}><CheckCircle size={14} className="inline mr-1.5"/>Approuver</button>
              </div>
            ):<div className="text-center py-2"><StatusBadge status={sel.status}/></div>}
          </div>
        </Modal>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Demandes clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{reqs.filter(r=>r.status==="en_attente").length} en attente d'approbation</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(["all","en_attente","approuvé","rejeté"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
              style={filter===f?{backgroundColor:"#fff",color:"#1B3A6B",boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}:{color:"#5A6882"}}>
              {f==="all"?"Toutes":f==="en_attente"?"En attente":f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map(req=>(
          <div key={req.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm cursor-pointer" onClick={()=>setSel(req)}>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{req.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:req.scope==="international"?"#FEF3E8":"#E8EEF6",color:req.scope==="international"?"#F97316":"#1B3A6B"}}>
                    {req.scope==="international"?"🌍 Intl.":"🇲🇦 National"}
                  </span>
                </div>
                <p className="font-bold text-foreground mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{req.client}</p>
                <p className="text-xs text-muted-foreground">{req.rc}</p>
              </div>
              <StatusBadge status={req.status}/>
            </div>
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Package size={11}/>{req.type}</span>
              <span className="flex items-center gap-1"><Truck size={11}/>{req.trucks} · {req.weight}</span>
              <span className="flex items-center gap-1"><MapPin size={11}/>{req.from} → {req.to}</span>
              <span className="flex items-center gap-1"><Calendar size={11}/>{req.date}</span>
            </div>
            {req.status==="en_attente"&&(
              <div className="mt-3 flex gap-2" onClick={e=>e.stopPropagation()}>
                <button onClick={()=>reject(req.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border text-destructive hover:bg-red-50" style={{borderColor:"#DC2626"}}>Rejeter</button>
                <button onClick={()=>approve(req.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white hover:opacity-90" style={{backgroundColor:"#10B981"}}>Approuver</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN — OTHER SECTIONS
══════════════════════════════════════════ */
function DashboardSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vendredi 18 juillet 2026 · Vue temps réel</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-secondary rounded-lg hover:bg-blue-100"><RefreshCw size={14}/>Actualiser</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Camions actifs" value="17" sub="sur 30 total" icon={Truck}/>
        <KpiCard label="En route" value="12" sub="3 intl · 9 national" icon={Navigation} accent/>
        <KpiCard label="Alertes fuel" value="3" sub="< 20% réservoir" icon={AlertTriangle} alert/>
        <KpiCard label="Revenus mois" value="2.4M MAD" sub="+12% vs juin" icon={TrendingUp}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Dépenses mensuelles (MAD)</h2>
            <span className="text-xs text-muted-foreground">Jan – Jun 2026</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={expenseChartData} margin={{top:4,right:4,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1B3A6B" stopOpacity={0.2}/><stop offset="95%" stopColor="#1B3A6B" stopOpacity={0}/></linearGradient>
                <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/><stop offset="95%" stopColor="#F97316" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#5A6882"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#5A6882"}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v:number)=>[`${v.toLocaleString()} MAD`]} contentStyle={{borderRadius:8,fontSize:12}}/>
              <Area type="monotone" dataKey="carburant" name="Carburant" stroke="#1B3A6B" strokeWidth={2} fill="url(#gF)"/>
              <Area type="monotone" dataKey="maintenance" name="Maintenance" stroke="#F97316" strokeWidth={2} fill="url(#gM)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Statut flotte</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
              {statusPieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
            </Pie><Tooltip formatter={(v:number)=>[`${v} camions`]} contentStyle={{borderRadius:8,fontSize:12}}/></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusPieData.map(d=>(
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:d.color}}/>{d.name}</span>
                <span className="font-semibold font-mono text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Activité routes cette semaine</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={routeActivityData} barGap={4} margin={{top:4,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
              <XAxis dataKey="day" tick={{fontSize:11,fill:"#5A6882"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#5A6882"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:8,fontSize:12}}/>
              <Bar dataKey="national" name="National" fill="#1B3A6B" radius={[3,3,0,0]}/>
              <Bar dataKey="international" name="International" fill="#F97316" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Alertes récentes</h2>
          <div className="space-y-3">
            {[{msg:"TRK-006 · Carburant critique 12%",time:"il y a 8 min",color:"#DC2626"},
              {msg:"DRV-006 · Heures max proches",time:"il y a 22 min",color:"#F97316"},
              {msg:"TRK-004 · Révision programmée",time:"il y a 1h",color:"#D97706"},
              {msg:"TRK-003 · Livraison confirmée Fès",time:"il y a 2h",color:"#10B981"},
              {msg:"REQ-2389 · Nouvelle demande client",time:"il y a 3h",color:"#1B3A6B"},
            ].map((a,i)=>(
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{backgroundColor:a.color}}/>
                <div><p className="text-xs text-foreground">{a.msg}</p><p className="text-xs text-muted-foreground mt-0.5">{a.time}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutesSection() {
  const [tab,setTab]=useState<"national"|"international">("national");
  const [live,setLive]=useState<any[]|null>(null);
  useEffect(()=>{
    let a=true;
    fetchRoutesList().then(r=>{ if(a&&r.length) setLive(r); }).catch(()=>{});
    return ()=>{ a=false; };
  },[]);
  const nat=[
    {id:"RT-N01",from:"Casablanca",to:"Tanger",    truck:"TRK-001",driver:"Hassan Benali", dist:"340 km",status:"en_route",  eta:"10:15",prog:72},
    {id:"RT-N02",from:"Rabat",     to:"Fès",       truck:"TRK-002",driver:"Mohamed Oulad", dist:"200 km",status:"livraison", eta:"10:20",prog:45},
    {id:"RT-N03",from:"Agadir",    to:"Marrakech", truck:"TRK-005",driver:"Karim Tazi",    dist:"260 km",status:"en_route",  eta:"10:15",prog:58},
  ];
  const intl=[
    {id:"RT-I01",from:"Casablanca",to:"Paris (France)",       truck:"TRK-007",driver:"Youssef Darif",   dist:"2340 km",status:"en_route",  eta:"Mer 14:00",prog:31},
    {id:"RT-I02",from:"Tanger",    to:"Barcelone (Espagne)",  truck:"TRK-008",driver:"Ibrahim Chaoui",  dist:"1100 km",status:"livraison", eta:"Mer 12:00",prog:88},
  ];
  const routes=live ? live.filter(r=>r.scope===tab) : (tab==="national"?nat:intl);
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Suivi d'itinéraire</h1>
      {live && <span className="inline-block text-xs font-bold" style={{color:"#10B981"}}>● Itinéraires en direct de PostgreSQL</span>}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(["national","international"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 text-sm font-semibold rounded-md transition-all"
            style={tab===t?{backgroundColor:"#fff",color:"#1B3A6B",boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}:{color:"#5A6882"}}>
            {t==="national"?"National":"International"}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {routes.map(r=>(
          <div key={r.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                <div className="flex items-center gap-2 text-base font-bold text-foreground mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {r.from}<ArrowRight size={14} className="text-muted-foreground"/>{r.to}
                </div>
                <p className="text-xs text-muted-foreground">{r.truck} · {r.driver} · {r.dist}</p>
              </div>
              <div className="flex items-center gap-4"><StatusBadge status={r.status}/><div className="text-right text-xs"><p className="font-bold text-foreground">{r.eta}</p><p className="text-muted-foreground">ETA</p></div></div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progression</span><span className="font-mono font-semibold text-foreground">{r.prog}%</span></div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{width:`${r.prog}%`,backgroundColor:r.status==="en_route"?"#1B3A6B":"#F97316"}}/></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriversSection() {
  const [filter,setFilter]=useState<"all"|"national"|"international">("all");
  const filtered=driversData.filter(d=>filter==="all"||d.type===filter);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Gestion des conducteurs</h1>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(["all","national","international"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
              style={filter===f?{backgroundColor:"#fff",color:"#1B3A6B",boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}:{color:"#5A6882"}}>
              {f==="all"?"Tous":f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(d=>(
          <div key={d.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{backgroundColor:"#1B3A6B"}}>{d.name.split(" ").map(n=>n[0]).join("")}</div>
                <div><p className="font-semibold text-foreground">{d.name}</p><p className="text-xs text-muted-foreground">{d.phone}</p></div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={d.status}/>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:d.type==="international"?"#FEF3E8":"#E8EEF6",color:d.type==="international"?"#F97316":"#1B3A6B"}}>
                  {d.type==="international"?"🌍 Intl.":"🇲🇦 National"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              <div className="text-center"><p className="text-lg font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d.trips}</p><p className="text-xs text-muted-foreground">Trajets</p></div>
              <div className="text-center"><p className="text-lg font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d.compliance}%</p><p className="text-xs text-muted-foreground">Conformité</p></div>
              <div className="text-center"><p className="text-lg font-bold flex items-center justify-center gap-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d.rating}<Star size={12} fill="#F97316" stroke="none"/></p><p className="text-xs text-muted-foreground">Note</p></div>
            </div>
            {d.truckId&&(
              <div className="mt-3 flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs"><Clock size={12} style={{color:d.hoursLeft<1?"#DC2626":"#5A6882"}}/><span className="text-muted-foreground">Heures restantes :</span><span className="font-semibold" style={{color:d.hoursLeft<1?"#DC2626":"#1B3A6B"}}>{d.hoursLeft}h</span></div>
                <span className="text-xs font-mono text-muted-foreground">{d.truckId}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpensesSection() {
  const expenses=[
    {id:"EXP-001",type:"Carburant",  truck:"TRK-001",driver:"Hassan Benali",  amount:4200, date:"18 Jul 2026",status:"validé",    desc:"Plein Afriquia Casablanca"},
    {id:"EXP-002",type:"Maintenance",truck:"TRK-004",driver:"—",              amount:8500, date:"17 Jul 2026",status:"en_attente",desc:"Révision 100 000 km + pneus"},
    {id:"EXP-003",type:"Amende",     truck:"TRK-006",driver:"Omar Fassi",     amount:1200, date:"16 Jul 2026",status:"validé",    desc:"Excès vitesse A1 N1"},
    {id:"EXP-004",type:"Carburant",  truck:"TRK-005",driver:"Karim Tazi",     amount:3800, date:"16 Jul 2026",status:"validé",    desc:"Plein Shell Agadir"},
    {id:"EXP-005",type:"Péage",      truck:"TRK-002",driver:"Mohamed Oulad",  amount:480,  date:"15 Jul 2026",status:"validé",    desc:"Autoroute Rabat-Fès A2"},
  ];
  const tc:Record<string,string>={Carburant:"#1B3A6B",Maintenance:"#F97316",Amende:"#DC2626",Péage:"#10B981"};
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Surveillance des dépenses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Dépenses soumises par les conducteurs — lecture seule</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:"Carburant (mois)",value:"49 000 MAD",icon:Fuel,color:"#1B3A6B"},{label:"Maintenance",value:"21 000 MAD",icon:Wrench,color:"#F97316"},{label:"Amendes",value:"1 500 MAD",icon:AlertTriangle,color:"#DC2626"},{label:"Total juillet",value:"71 500 MAD",icon:BarChart3,color:"#10B981"}].map(c=>(
          <div key={c.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><c.icon size={15} style={{color:c.color}}/><span className="text-xs text-muted-foreground">{c.label}</span></div>
            <p className="text-lg font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Journal des dépenses (soumises par les conducteurs)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/40">
              {["Réf.","Type","Camion","Conducteur","Description","Montant","Date","Statut"].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {expenses.map(e=>(
                <tr key={e.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{backgroundColor:tc[e.type]||"#5A6882"}}>{e.type}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{e.truck}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{e.driver}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.desc}</td>
                  <td className="px-4 py-3 font-semibold font-mono text-foreground">{e.amount.toLocaleString()} MAD</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MarketingSection() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Marketing & Croissance</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Clients actifs" value="128" sub="+14 ce mois" icon={Users}/>
        <KpiCard label="Prospects" value="47" sub="En négociation" icon={Star} accent/>
        <KpiCard label="Taux conv." value="31%" sub="+5% vs mai" icon={TrendingUp}/>
        <KpiCard label="Revenus acqn." value="320K MAD" sub="Ce trimestre" icon={DollarSign}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Prospects récents</h2>
          <div className="space-y-2">
            {[{name:"Groupe Marjane Logistics",sector:"Grande distribution",value:"120K/an",stage:"Démo planifiée"},
              {name:"ATLAS Transport SARL",sector:"Import/Export",value:"85K/an",stage:"Offre envoyée"},
              {name:"Souss Agri-Export",sector:"Agroalimentaire",value:"60K/an",stage:"Premier contact"},
              {name:"BTP Maghreb SA",sector:"Construction",value:"200K/an",stage:"Négociation"}].map((p,i)=>(
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div><p className="text-sm font-semibold text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.sector} · {p.value}</p></div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:"#FEF3E8",color:"#F97316"}}>{p.stage}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Onboarding en cours</h2>
          <div className="space-y-4">
            {[{name:"Cosumar Logistics",step:3,total:5,desc:"Configuration flotte"},{name:"OCP Transport",step:2,total:5,desc:"Validation contrat"},{name:"ONCF Fret",step:5,total:5,desc:"Go-live ✓"}].map((o,i)=>(
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1"><span className="font-medium text-foreground">{o.name}</span><span className="text-xs text-muted-foreground">{o.step}/{o.total} — {o.desc}</span></div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{width:`${(o.step/o.total)*100}%`,backgroundColor:o.step===o.total?"#10B981":"#F97316"}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN LAYOUT
══════════════════════════════════════════ */
const navItems:[AdminSection,string,React.ComponentType<{size?:number}>][]=[
  ["dashboard","Tableau de bord",BarChart3],
  ["carte","Carte mondiale",Map],
  ["suivi","Suivi flotte",Filter],
  ["demandes","Demandes clients",FileText],
  ["fleet","Flotte",Truck],
  ["routes","Itinéraires",Navigation],
  ["drivers","Conducteurs",Users],
  ["expenses","Dépenses",DollarSign],
  ["marketing","Marketing",Zap],
];

function AdminLayout({onLogout}:{onLogout:()=>void}) {
  const [section,setSection]=useState<AdminSection>("dashboard");
  const [open,setOpen]=useState(true);
  const sectionMap:Record<AdminSection,React.ReactNode>={
    dashboard:<DashboardSection/>,carte:<CarteSection/>,suivi:<FleetTrackingSection/>,demandes:<DemandesSection/>,
    fleet:<FleetSection/>,routes:<RoutesSection/>,drivers:<DriversSection/>,
    expenses:<ExpensesSection/>,marketing:<MarketingSection/>,
  };
  const cur=navItems.find(n=>n[0]===section)!;
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="flex flex-col shrink-0 border-r border-white/10 transition-all duration-200 overflow-hidden" style={{width:open?220:60,backgroundColor:"#0D1B2A"}}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:"#F97316"}}><Truck size={15} className="text-white"/></div>
          {open&&<span className="text-white font-bold text-sm whitespace-nowrap truncate" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{APP}</span>}
          <button className="ml-auto text-white/30 hover:text-white/70 shrink-0" onClick={()=>setOpen(p=>!p)}><Menu size={15}/></button>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto" style={{scrollbarWidth:"none"}}>
          {navItems.map(([id,label,Icon])=>{
            const active=section===id;
            const badge=id==="demandes"?2:null;
            return (
              <button key={id} onClick={()=>setSection(id)}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                style={{backgroundColor:active?"#1B3A6B":"transparent",color:active?"#fff":"rgba(255,255,255,0.45)"}}>
                <Icon size={16}/>
                {open&&<span className="whitespace-nowrap flex-1">{label}</span>}
                {badge&&open&&<span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{backgroundColor:"#DC2626"}}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-3 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{backgroundColor:"#F97316"}}>AD</div>
            {open&&<div className="min-w-0 flex-1"><p className="text-xs font-semibold text-white truncate">Admin Principal</p><p className="text-xs truncate" style={{color:"rgba(255,255,255,0.3)"}}>admin@portransline.ma</p></div>}
            {open&&<button onClick={onLogout} className="p-1 rounded hover:bg-white/10 shrink-0" title="Déconnexion"><LogOut size={14} className="text-white/30"/></button>}
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Administration</span><ChevronRight size={14}/><span className="text-foreground font-semibold">{cur[1]}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer"><Bell size={17} className="text-muted-foreground"/><span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center text-xs text-white font-bold">3</span></div>
            <div className="h-5 w-px bg-border"/>
            <span className="text-xs text-muted-foreground font-mono">v2.4.0</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(0,0,0,0.12) transparent"}}>
          {sectionMap[section]}
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROOT
══════════════════════════════════════════ */
export default function App() {
  const [view,setView]=useState<AppView>("login");
  return (
    <div className="size-full" style={{fontFamily:"'Inter',sans-serif"}}>
      {view==="login"  && <LoginPage  onLogin={setView}/>}
      {view==="admin"  && <AdminLayout onLogout={()=>setView("login")}/>}
      {view==="driver" && <DriverPortal onLogout={()=>setView("login")}/>}
      {view==="client" && <ClientPortal onLogout={()=>setView("login")}/>}
    </div>
  );
}
