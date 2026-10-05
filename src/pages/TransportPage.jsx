import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bike, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Crosshair, MapPin, Minus, Package, Plus, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getPoint, TRANSPORT_PROGRESS, TRANSPORT_STATUS_LABELS } from '../services/transportService';
import { getPublicPropertyLocation } from '../utils/propertyMapping';
import MovingIllustration from '../components/moving/MovingIllustration';
import TransportTrackingMap from '../components/moving/TransportTrackingMap';
import CoordinateMapPicker from '../components/moving/CoordinateMapPicker';
import KenyaAreaPicker from '../components/moving/KenyaAreaPicker';
import KenyaLocationSearch from '../components/moving/KenyaLocationSearch';
import '../components/moving/LiquidGlass.css';
import { formatKenyaArea } from '../utils/kenyaLocationOptions';
import { reverseGeocodeKenyaPoint } from '../utils/transportLocationLookup';

const ITEMS = [
  { id: 'bed', label: 'Bed', detail: 'Frame and base' }, { id: 'mattress', label: 'Mattress', detail: 'Single or double' },
  { id: 'sofa', label: 'Sofa', detail: 'Seats and couches' }, { id: 'table', label: 'Table', detail: 'Dining or desk' },
  { id: 'chair', label: 'Chairs', detail: 'Individual seats' }, { id: 'wardrobe', label: 'Wardrobe', detail: 'Cabinet or dresser' },
  { id: 'fridge', label: 'Fridge', detail: 'Fridge or freezer' }, { id: 'tv', label: 'TV & electronics', detail: 'Screens and devices' },
  { id: 'washer', label: 'Washing machine', detail: 'Washer or dryer' }, { id: 'box', label: 'Boxes', detail: 'Packed boxes' },
  { id: 'other', label: 'Other items', detail: 'Household extras' },
];

const VEHICLES = [
  { id: 'motorbike', title: 'Motorbike', detail: 'A few small, light items', Icon: Bike },
  { id: 'tuk', title: 'Tuk Tuk', detail: 'Compact loads and boxes', Icon: Truck },
  { id: 'pickup', title: 'Pickup', detail: 'Furniture and medium loads', Icon: Truck },
  { id: 'lorry', title: 'Lorry', detail: 'A larger household move', Icon: Truck },
];

const STEP_NAMES = ['Your things', 'Pickup', 'Destination', 'Transport', 'Review', 'Track'];
const money = (value) => `KSh ${Number(value || 0).toLocaleString()}`;
const formatTime = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now';
};
const quantityTotal = (items) => Object.values(items).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
const emptyArea = () => ({ county: '', subCounty: '', ward: '', area: '' });
const propertyArea = (property) => ({
  county: property?.county || property?.approxLocation?.county || '',
  subCounty: property?.subCounty || property?.constituency || '',
  ward: property?.ward || '',
  area: property?.estate || property?.neighborhood || property?.approxLocation?.estate || '',
});

const getAccurateBrowserLocation = ({ targetAccuracy = 250, fallbackAccuracy = 1200, timeout = 25000 } = {}) => {
  if (!navigator.geolocation) return Promise.reject(new Error('This browser does not provide location access.'));

  return new Promise((resolve, reject) => {
    let watchId = null;
    let timer = null;
    let bestPosition = null;
    let finished = false;

    const stop = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer !== null) window.clearTimeout(timer);
      watchId = null;
      timer = null;
    };
    const accept = (position) => {
      if (finished) return;
      finished = true;
      stop();
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    };
    const fail = (error) => {
      if (finished) return;
      finished = true;
      stop();
      reject(error);
    };

    watchId = navigator.geolocation.watchPosition((position) => {
      if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) bestPosition = position;
      if (position.coords.accuracy <= targetAccuracy) accept(position);
    }, (error) => {
      if (bestPosition && bestPosition.coords.accuracy <= fallbackAccuracy) accept(bestPosition);
      else fail(error);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout });

    timer = window.setTimeout(() => {
      if (bestPosition && bestPosition.coords.accuracy <= fallbackAccuracy) accept(bestPosition);
      else fail(new Error('GPS could not get a precise fix. Move closer to a window or place the pin on the map.'));
    }, timeout + 250);
  });
};

function RequestTrackingCard({ request, selected, onSelect, showDetails = true }) {
  const statusIndex = TRANSPORT_PROGRESS.indexOf(request.status);
  const progressIndex = ['REQUESTED', 'QUOTED', 'ACCEPTED'].includes(request.status) ? 0 : request.status === 'PICKUP_READY' ? 1 : statusIndex;
  return <article className={`mmx-glass-surface overflow-hidden rounded-3xl border shadow-sm transition ${selected ? 'border-emerald-700 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
    <button type="button" onClick={onSelect} className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5">
      <span className="min-w-0"><span className="block truncate font-bold text-slate-900">{request.destinationTitle || request.destinationLabel || 'Your move'}</span><span className="mt-1 block text-xs text-slate-500">{formatTime(request.createdAt)} · {quantityTotal(request.items)} items</span></span>
      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{TRANSPORT_STATUS_LABELS[request.status] || request.status}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${selected ? 'rotate-180' : ''}`} />
    </button>
    {selected && showDetails && <div className="border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-emerald-800">Move status</p><h3 className="mt-1 text-lg font-bold text-slate-900">{TRANSPORT_STATUS_LABELS[request.status] || request.status}</h3></div><span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Truck className="h-5 w-5" /></span></div>
          <div className="mt-5 grid grid-cols-3 gap-1 sm:grid-cols-6">{TRANSPORT_PROGRESS.map((status, index) => {
            const complete = progressIndex >= index && request.status !== 'CANCELLED';
            return <div key={status} className="relative text-center"><div className={`mx-auto grid h-7 w-7 place-items-center rounded-full border ${complete ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>{complete ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{index + 1}</span>}</div><p className="mt-1.5 text-[9px] leading-3 text-slate-500 sm:text-[10px]">{TRANSPORT_STATUS_LABELS[status]}</p>{index < TRANSPORT_PROGRESS.length - 1 && <span className={`absolute left-[calc(50%+16px)] top-3.5 hidden h-px w-[calc(100%-28px)] sm:block ${progressIndex > index ? 'bg-emerald-500' : 'bg-slate-200'}`} />}</div>;
          })}</div>
          <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm"><p><span className="font-semibold text-slate-800">Pickup:</span> <span className="text-slate-600">{request.pickupLabel}</span></p><p><span className="font-semibold text-slate-800">Destination:</span> <span className="text-slate-600">{request.destinationTitle || request.destinationLabel}</span></p><p><span className="font-semibold text-slate-800">Vehicle:</span> <span className="text-slate-600">{request.vehicleLabel || 'Waiting for provider'}</span></p>{request.driverName && <p><span className="font-semibold text-slate-800">Driver:</span> <span className="text-slate-600">{request.driverName}</span></p>}{request.quotedPrice != null && <p><span className="font-semibold text-slate-800">Provider quote:</span> <span className="text-slate-600">{money(request.quotedPrice)}</span></p>}{request.etaMinutes && <p><span className="font-semibold text-slate-800">Provider ETA:</span> <span className="text-slate-600">{request.etaMinutes} min</span></p>}</div>
          {request.driverPhone && <div className="mt-3 flex gap-2"><a href={`tel:${encodeURIComponent(request.driverPhone)}`} className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-bold text-white">Call driver</a><a href={`https://wa.me/${request.driverPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-900">WhatsApp</a></div>}
          <p className="mt-3 text-[11px] text-slate-500">Driver map sharing works while the assigned driver keeps this page open and location permission enabled.</p>
        </div>
        <TransportTrackingMap pickupLocation={request.pickupCoordinates} destinationLocation={request.destinationCoordinates} driverLocation={request.driverLocation} />
      </div>
    </div>}
  </article>;
}

const TransportPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId') || '';
  const [step, setStep] = useState(0);
  const [propertyOptions, setPropertyOptions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [items, setItems] = useState({});
  const [pickupLabel, setPickupLabel] = useState('');
  const [pickupArea, setPickupArea] = useState(emptyArea);
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [pickupAccuracy, setPickupAccuracy] = useState(null);
  const [destinationLabel, setDestinationLabel] = useState('');
  const [destinationArea, setDestinationArea] = useState(emptyArea);
  const [destinationCoordinates, setDestinationCoordinates] = useState(null);
  const [vehicle, setVehicle] = useState('');
  const [lookupBusy, setLookupBusy] = useState('');
  const [pinningLocation, setPinningLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const locationLookupIds = useRef({ pickup: 0, destination: 0 });

  useEffect(() => {
    let active = true;
    const loadProperties = async () => {
      try {
        const results = await getDocs(query(collection(db, 'properties'), where('approvalStatus', '==', 'approved')));
        if (!active) return;
        const options = results.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
        setPropertyOptions(options);
        const selected = options.find((entry) => entry.id === propertyId) || null;
        if (selected) {
          setSelectedProperty(selected);
          const area = propertyArea(selected);
          setDestinationArea(area);
          setDestinationLabel(formatKenyaArea(area) || getPublicPropertyLocation(selected));
          const point = getPoint(selected.coordinates || selected.locationCoordinates);
          setDestinationCoordinates(point);
          if (!point) setPinningLocation('destination');
        }
      } catch (error) {
        console.error('Could not load destination properties:', error);
        toast.error('Could not load available property destinations.');
      }
    };
    loadProperties();
    return () => { active = false; };
  }, [propertyId]);

  useEffect(() => {
    let active = true;
    getDocs(query(collection(db, 'movingPackages'), where('active', '==', true))).then((snapshot) => {
      if (!active) return;
      const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      next.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
      setPackages(next);
    }).catch((error) => {
      console.error('Could not load moving packages:', error);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setRequests([]);
      return undefined;
    }
    const ownRequests = query(collection(db, 'transportRequests'), where('userId', '==', currentUser.uid));
    return onSnapshot(ownRequests, (snapshot) => {
      const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      next.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRequests(next);
      if (!selectedRequestId && next[0]) setSelectedRequestId(next[0].id);
    }, (error) => {
      console.error('Could not follow move requests:', error);
      toast.error('Could not load your move updates.');
    });
  }, [currentUser?.uid]);

  const selectedRequest = useMemo(() => requests.find((request) => request.id === selectedRequestId), [requests, selectedRequestId]);
  const totalItems = quantityTotal(items);
  const selectedVehicle = VEHICLES.find((option) => option.id === vehicle);

  const fillAreaFromCoordinates = async (kind, point) => {
    const requestId = ++locationLookupIds.current[kind];
    try {
      const resolved = await reverseGeocodeKenyaPoint(point);
      if (locationLookupIds.current[kind] !== requestId) return null;
      const area = resolved.area;
      if (!Object.values(area).some(Boolean)) return false;
      const label = formatKenyaArea(area) || resolved.label || `${kind === 'pickup' ? 'Pickup' : 'Destination'} map pin`;
      if (kind === 'pickup') {
        setPickupArea(area);
        setPickupLabel(label);
      } else {
        setDestinationArea(area);
        setDestinationLabel(label);
      }
      return true;
    } catch (error) {
      console.warn('Could not find the county and local area for this transport pin:', error);
      return false;
    }
  };

  const selectDestinationLocation = ({ point, area, label, displayName }) => {
    locationLookupIds.current.destination += 1;
    setSelectedProperty(null);
    setDestinationCoordinates(point);
    setDestinationArea(area);
    setDestinationLabel(formatKenyaArea(area) || label || displayName);
    setPinningLocation('');
    if (!area.county || (!area.area && !area.ward && !area.subCounty)) {
      toast('Location selected. Complete any missing county or area fields below.');
    } else {
      toast.success('Destination selected and area details filled in.');
    }
  };

  const choosePackage = (packageItem) => {
    setSelectedPackage(packageItem);
    setItems(Object.fromEntries((packageItem.itemIds || []).filter((id) => ITEMS.some((item) => item.id === id)).map((id) => [id, 1])));
    if (VEHICLES.some((option) => option.id === packageItem.vehicleId)) setVehicle(packageItem.vehicleId);
    setStep(0);
    toast.success(`${packageItem.title} added to your move.`);
  };

  const usePickupCurrentLocation = async () => {
    setLookupBusy('pickup-current');
    try {
      const result = await getAccurateBrowserLocation();
      const point = { lat: result.latitude, lng: result.longitude };
      setPickupCoordinates(point);
      setPickupAccuracy(result.accuracy);
      setPickupArea(emptyArea());
      setPickupLabel('Current location pin');
      const areaFilled = await fillAreaFromCoordinates('pickup', point);
      const accuracy = `GPS accuracy ${String.fromCharCode(177)}${Math.round(result.accuracy)} m`;
      if (areaFilled) toast.success(`Pickup pin saved (${accuracy}) and area fields filled in.`);
      else toast.success(`Pickup pin saved (${accuracy}). Fill in the county and local area if they are still blank.`);
    } catch (error) {
      console.error('Could not read device location:', error);
      toast.error('Allow location access, or enter your pickup area manually.');
    } finally {
      setLookupBusy('');
    }
  };

  const setManualMapPin = (kind, point) => {
    locationLookupIds.current[kind] += 1;
    if (kind === 'pickup') {
      setPickupCoordinates(point);
      setPickupAccuracy(null);
      setPickupArea(emptyArea());
      setPickupLabel('');
    } else {
      setDestinationCoordinates(point);
      if (!selectedProperty) {
        setDestinationArea(emptyArea());
        setDestinationLabel('');
      }
    }
    setPinningLocation('');
    toast.success(`${kind === 'pickup' ? 'Pickup' : 'Destination'} pin saved: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}.`);
    fillAreaFromCoordinates(kind, point).then((areaFilled) => {
      if (areaFilled === false) toast('Fill in the county and local area manually if they are still blank.');
    });
  };

  const updateArea = (kind, area) => {
    locationLookupIds.current[kind] += 1;
    if (kind === 'pickup') {
      setPickupArea(area);
      setPickupLabel(formatKenyaArea(area));
      return;
    }
    if (!selectedProperty && destinationCoordinates) setDestinationCoordinates(null);
    setDestinationArea(area);
    setDestinationLabel(formatKenyaArea(area));
  };

  const selectPropertyDestination = async (id) => {
    const property = propertyOptions.find((option) => option.id === id) || null;
    setSelectedProperty(property);
    if (!property) {
      setDestinationLabel('');
      setDestinationArea(emptyArea());
      setDestinationCoordinates(null);
      return;
    }
    const area = propertyArea(property);
    setDestinationArea(area);
    const point = getPoint(property.coordinates || property.locationCoordinates);
    setDestinationLabel(formatKenyaArea(area) || getPublicPropertyLocation(property));
    if (point) {
      setDestinationCoordinates(point);
      setPinningLocation('');
      return;
    }
    setDestinationCoordinates(null);
    setPinningLocation('destination');
  };

  const requestMove = async () => {
    if (!currentUser?.uid) {
      window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (!totalItems || !pickupLabel.trim() || !destinationLabel.trim() || !vehicle || !pickupCoordinates || !destinationCoordinates) {
      toast.error('Add your items, both named locations, map pins and a transport option first.');
      return;
    }
    setSaving(true);
    try {
      const requestRef = await addDoc(collection(db, 'transportRequests'), {
        userId: currentUser.uid,
        userName: (userProfile?.name || currentUser.displayName || currentUser.email || 'MarketMix customer').slice(0, 120),
        userEmail: String(currentUser.email || '').slice(0, 256),
        propertyId: selectedProperty?.id || '',
        destinationTitle: (selectedProperty?.title || '').slice(0, 160),
        pickupLabel: pickupLabel.trim().slice(0, 200),
        pickupCounty: pickupArea.county,
        pickupSubCounty: pickupArea.subCounty,
        pickupWard: pickupArea.ward,
        pickupArea: pickupArea.area,
        pickupCoordinates: pickupCoordinates || null,
        destinationLabel: destinationLabel.trim().slice(0, 200),
        destinationCounty: destinationArea.county,
        destinationSubCounty: destinationArea.subCounty,
        destinationWard: destinationArea.ward,
        destinationArea: destinationArea.area,
        destinationCoordinates: destinationCoordinates || null,
        destinationPrecision: selectedProperty && !getPoint(selectedProperty.coordinates || selectedProperty.locationCoordinates) && destinationCoordinates ? 'approximate-area' : 'customer-pin',
        packageId: selectedPackage?.id || '',
        packageTitle: (selectedPackage?.title || '').slice(0, 80),
        items: Object.fromEntries(Object.entries(items).filter(([, quantity]) => Number(quantity) > 0)),
        itemCount: totalItems,
        vehicleId: selectedVehicle.id,
        vehicleLabel: selectedVehicle.title,
        status: 'REQUESTED',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSelectedRequestId(requestRef.id);
      setStep(5);
      toast.success('Your transport request has been sent.');
    } catch (error) {
      console.error('Could not create moving request:', error);
      toast.error('Could not send the request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepForward = () => {
    if (step === 0 && totalItems === 0) return toast('Choose at least one item to move.');
    if (step === 1 && (!pickupArea.county || (!pickupArea.area && !pickupArea.ward && !pickupArea.subCounty) || !pickupCoordinates)) return toast('Choose your pickup county and local area, then use GPS or place its map pin.');
    if (step === 2 && (!destinationArea.county || (!destinationArea.area && !destinationArea.ward && !destinationArea.subCounty) || !destinationCoordinates)) return toast('Choose a destination county and local area, then place its map pin if it is not already set.');
    if (step === 3 && !vehicle) return toast('Choose a transport option.');
    setStep((current) => Math.min(4, current + 1));
  };

  const updateQuantity = (itemId, delta) => setItems((current) => {
    const quantity = Math.max(0, Math.min(99, (Number(current[itemId]) || 0) + delta));
    const next = { ...current };
    if (quantity) next[itemId] = quantity;
    else delete next[itemId];
    return next;
  });

  return <main className="mmx-liquid-canvas min-h-screen overflow-hidden pb-24 text-slate-900">
    <section className="mmx-glass-surface-dark relative isolate overflow-hidden rounded-b-[2.8rem] text-white">
      <div className="pointer-events-none absolute -right-24 -top-44 h-[480px] w-[480px] rounded-full bg-emerald-300/20 blur-3xl"/><div className="pointer-events-none absolute -left-32 bottom-[-16rem] h-[470px] w-[470px] rounded-full bg-sky-300/15 blur-3xl"/>
      <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 pb-7 pt-8 sm:px-6 sm:pb-12 sm:pt-12 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <div><Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.19em] text-emerald-200"><ArrowLeft className="h-4 w-4"/> MarketMix moving</Link><h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">A smoother way to get home.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Choose what you’re moving, set the two places, then let the right local transport provider take it from there.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">No made-up prices</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">Private trip locations</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">Live updates when driver shares</span></div></div>
        <MovingIllustration className="mx-auto w-full max-w-[520px] drop-shadow-[0_26px_42px_rgba(0,0,0,.2)]" />
      </div>
    </section>

    {packages.length > 0 && <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix moving packages</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Start with a move that fits</h2><p className="mt-1 text-sm text-slate-600">Choose a package to prefill your list. You can adjust every item before requesting.</p></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{packages.map((packageItem) => <article key={packageItem.id} className={`mmx-glass-card group overflow-hidden rounded-[1.8rem] border shadow-[0_16px_45px_rgba(24,55,42,.09)] ${selectedPackage?.id === packageItem.id ? 'is-selected' : ''}`}><div className="mmx-glass-image relative h-48 overflow-hidden bg-[#172720]">{packageItem.coverImage ? <img src={packageItem.coverImage} alt={packageItem.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <MovingIllustration kind={`vehicle:${packageItem.vehicleId || 'pickup'}`} className="h-full w-full transition duration-500 group-hover:scale-105"/>}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200">{packageItem.vehicleLabel || 'Moving package'}</p><h3 className="mt-1 text-xl font-extrabold">{packageItem.title}</h3><p className="mt-1 text-xs font-semibold text-white/80">{packageItem.priceLabel || 'Provider quote after request'}</p></div></div><div className="bg-white/20 p-4 backdrop-blur-xl"><p className="text-sm leading-5 text-slate-700">{packageItem.summary}</p><p className="mt-2 text-xs font-semibold text-slate-900">Best for {packageItem.suitableFor}</p>{packageItem.includes?.length > 0 && <ul className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">{packageItem.includes.slice(0, 4).map((line) => <li key={line} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700"/>{line}</li>)}</ul>}<button type="button" onClick={() => choosePackage(packageItem)} className="mmx-liquid-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white">{selectedPackage?.id === packageItem.id ? 'Package selected' : 'Start with this package'} <ArrowRight className="h-4 w-4"/></button></div></article>)}</div></section>}

    <div className="mx-auto grid max-w-7xl gap-7 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8 lg:py-9">
      <section className="min-w-0">
        <div className="mb-5 mmx-glass-surface rounded-[1.7rem] border p-3 shadow-[0_18px_60px_rgba(20,55,42,.08)] backdrop-blur-xl sm:p-4">
          <div className="grid grid-cols-6 gap-1">{STEP_NAMES.map((name, index) => <button key={name} type="button" onClick={() => index <= step && setStep(index)} className={`rounded-2xl px-1 py-3 text-center transition sm:px-3 ${step === index ? 'mmx-glass-surface-dark text-white shadow-lg' : index < step ? 'mmx-glass-pill text-emerald-900' : 'text-slate-400'}`}><span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[10px] font-bold">{index < step ? <Check className="h-3.5 w-3.5"/> : index + 1}</span><span className="mt-1 hidden text-xs font-bold sm:block">{name}</span></button>)}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .22 }} className="mmx-glass-surface rounded-[2rem] border p-4 shadow-[0_20px_70px_rgba(20,55,42,.09)] backdrop-blur-xl sm:p-6">
            {step === 0 && <>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">01 · Choose what you’re moving</p><div className="mt-2 flex items-end justify-between gap-2"><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What should we bring?</h2><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{totalItems} selected</span></div><p className="mt-2 text-sm text-slate-500">Tap an item, then set its quantity. Add only what needs a ride.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{ITEMS.map((item) => { const quantity = Number(items[item.id] || 0); return <article key={item.id} className={`mmx-glass-card ${quantity ? 'is-selected' : ''} group overflow-hidden rounded-2xl border transition-all duration-200 ${quantity ? 'border-emerald-700 bg-emerald-50/60 shadow-[0_8px_25px_rgba(39,104,79,.12)]' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg'}`}><button type="button" onClick={() => !quantity && updateQuantity(item.id, 1)} aria-pressed={quantity > 0} className="block w-full text-left"><MovingIllustration kind={`item:${item.id}`} className="h-28 w-full object-cover sm:h-32"/><span className="block px-3 pb-1 pt-2"><span className="block text-sm font-bold text-slate-900">{item.label}</span><span className="mt-0.5 block text-[10px] text-slate-500">{item.detail}</span></span></button>{quantity > 0 && <div className="flex items-center justify-between border-t border-emerald-100 px-3 py-2"><button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.label}`} className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 shadow-sm hover:bg-slate-100"><Minus className="h-4 w-4"/></button><span className="text-sm font-extrabold text-slate-900">{quantity}</span><button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.label}`} className="grid h-8 w-8 place-items-center rounded-full bg-[#19372b] text-white shadow-sm hover:bg-emerald-800"><Plus className="h-4 w-4"/></button></div>}</article>; })}</div>
            </>}

            {step === 1 && <><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">02 · Pickup</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Where should we collect your things?</h2><p className="mt-2 text-sm text-slate-500">Use your current location to fill the county and nearby area when map data is available. Coordinates are sent to <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap contributors</a> for place-name lookup. You can also enter the fields manually and place a pin. Saved trip pins are visible to you, the assigned driver and MarketMix admins.</p><div className="mt-5"><KenyaAreaPicker value={pickupArea} onChange={(area) => updateArea('pickup', area)} areaLabel="Estate, location name or landmark" areaPlaceholder="Building, estate, area or nearby landmark" /></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" onClick={usePickupCurrentLocation} disabled={Boolean(lookupBusy)} className="mmx-liquid-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><Crosshair className="h-4 w-4"/>{lookupBusy === 'pickup-current' ? 'Getting your pin…' : 'Use current location'}</button><button type="button" onClick={() => setPinningLocation(pinningLocation === 'pickup' ? '' : 'pickup')} className="mmx-glass-action inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold text-slate-800"><MapPin className="h-4 w-4"/>{pickupCoordinates ? 'Adjust map pin' : 'Choose pin on map'}</button></div>{pinningLocation === 'pickup' && <div className="mt-4"><CoordinateMapPicker point={pickupCoordinates} onPick={(point) => setManualMapPin('pickup', point)} /></div>}{pickupCoordinates && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4"/>Map pin saved · {pickupCoordinates.lat.toFixed(5)}, {pickupCoordinates.lng.toFixed(5)}{pickupAccuracy != null ? ` · GPS ±${Math.round(pickupAccuracy)} m` : ` · map pin`}</p>}</>}

            {step === 2 && <><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">03 · Destination</p>{propertyId && selectedProperty ? <><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Moving into your new home</h2><div className="mt-5 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50"><div className="grid items-center sm:grid-cols-[1fr_190px]"><div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-800">MarketMix property · destination selected</p><h3 className="mt-2 text-2xl font-bold text-slate-900">{selectedProperty.title || 'Selected property'}</h3><p className="mt-1 text-sm text-slate-600">{getPublicPropertyLocation(selectedProperty) || 'Destination confirmed'}</p><p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-emerald-900 shadow-sm"><CheckCircle2 className="h-4 w-4"/>Destination confirmed</p></div><MovingIllustration kind="item:box" className="hidden w-full p-4 sm:block"/></div></div><div className="mt-5"><KenyaAreaPicker value={destinationArea} onChange={(area) => updateArea('destination', area)} areaLabel="Confirm estate, neighbourhood or local place" areaPlaceholder="Add an estate, landmark or street" /></div>{!destinationCoordinates && <div className="mt-4 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-bold text-slate-800">This listing has no map coordinates yet.</p><p className="mt-1 text-xs leading-5 text-slate-500">The property stays selected as your destination. Place a pin near it to enable the route map.</p><button type="button" onClick={() => setPinningLocation(pinningLocation === 'destination' ? '' : 'destination')} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800"><MapPin className="h-4 w-4"/>Choose destination pin</button>{pinningLocation === 'destination' && <div className="mt-3"><CoordinateMapPicker point={destinationCoordinates} onPick={(point) => setManualMapPin('destination', point)} /></div>}</div>}</> : <><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Where are your things going?</h2><p className="mt-2 text-sm text-slate-500">Choose a MarketMix home or enter a destination yourself.</p><label className="mt-6 block text-sm font-bold text-slate-700">MarketMix property<select value={selectedProperty?.id || ''} onChange={(event) => selectPropertyDestination(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-normal outline-none focus:border-emerald-700"><option value="">Enter a destination manually</option>{propertyOptions.map((property) => <option key={property.id} value={property.id}>{property.title} · {getPublicPropertyLocation(property)}</option>)}</select></label>{!selectedProperty && <><KenyaLocationSearch onSelect={selectDestinationLocation} /><div className="mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Or enter the area manually</p><KenyaAreaPicker value={destinationArea} onChange={(area) => updateArea('destination', area)} areaLabel="Estate, location name or landmark" areaPlaceholder="Building, estate, area or nearby landmark" /></div><button type="button" onClick={() => setPinningLocation(pinningLocation === 'destination' ? '' : 'destination')} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800">{destinationCoordinates ? 'Adjust destination pin' : 'Choose destination pin'}</button>{pinningLocation === 'destination' && <div className="mt-4"><CoordinateMapPicker point={destinationCoordinates} onPick={(point) => setManualMapPin('destination', point)} /></div>}</>}</>}</>}

            {step === 3 && <><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">04 · Choose transport</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">What size move feels right?</h2><p className="mt-2 text-sm text-slate-500">A provider will confirm vehicle fit and availability before accepting. No estimated fare is shown until they quote.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{VEHICLES.map(({ id, title, detail, Icon }) => <button key={id} type="button" onClick={() => setVehicle(id)} aria-pressed={vehicle === id} className={`mmx-glass-card ${vehicle === id ? 'is-selected' : ''} overflow-hidden rounded-3xl border text-left transition-all duration-200 ${vehicle === id ? 'scale-[1.01] border-emerald-700 bg-emerald-50 shadow-[0_12px_35px_rgba(39,104,79,.15)] ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg'}`}><MovingIllustration kind={`vehicle:${id}`} className="w-full"/><span className="flex items-center justify-between gap-2 px-4 pb-4 pt-2"><span><span className="block text-base font-extrabold text-slate-900">{title}</span><span className="mt-1 block text-xs text-slate-500">{detail}</span></span><span className={`grid h-10 w-10 place-items-center rounded-2xl ${vehicle === id ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{vehicle === id ? <Check className="h-5 w-5"/> : <Icon className="h-5 w-5"/>}</span></span></button>)}</div></>}

            {step === 4 && <><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">05 · Review trip</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Ready when you are.</h2><div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="grid gap-0 sm:grid-cols-2"><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pickup</p><p className="mt-1 font-bold text-slate-900">{pickupLabel}</p><p className="mt-1 text-xs text-slate-500">{pickupCoordinates ? `${pickupCoordinates.lat.toFixed(5)}, ${pickupCoordinates.lng.toFixed(5)} · map pin ready` : 'Map pin required'}</p></div><div className="border-t border-slate-100 p-5 sm:border-l sm:border-t-0"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Destination</p><p className="mt-1 font-bold text-slate-900">{selectedProperty?.title || destinationLabel}</p><p className="mt-1 text-xs text-slate-500">{destinationCoordinates ? `${destinationCoordinates.lat.toFixed(5)}, ${destinationCoordinates.lng.toFixed(5)} · map pin ready` : 'Map pin required'}</p></div></div><div className="border-t border-slate-100 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Belongings · {totalItems} items</p><p className="mt-2 text-sm leading-6 text-slate-700">{Object.entries(items).map(([id, quantity]) => `${ITEMS.find((item) => item.id === id)?.label || id} × ${quantity}`).join(' · ')}</p></div><Package className="h-5 w-5 shrink-0 text-emerald-800"/></div></div>{selectedPackage && <div className="border-t border-slate-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Package</p><p className="mt-1 font-bold text-slate-900">{selectedPackage.title}</p></div>}<div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Transport option</p><p className="mt-1 font-bold text-slate-900">{selectedVehicle?.title}</p></div><p className="max-w-48 text-right text-xs leading-5 text-slate-500">Distance and price are confirmed by the provider</p></div></div><div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><span className="font-bold">Saved trip pins are visible to your account, the assigned driver and MarketMix admins.</span> OpenStreetMap receives coordinates to find place names, and OSRM receives pinned points to draw the route and estimate driving time. The estimate does not include live traffic.</div></>}
          </motion.section>
        </AnimatePresence>

        {step < 4 && <div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="mmx-glass-action rounded-xl border px-5 py-3 text-sm font-bold text-slate-700 disabled:invisible">Back</button><button type="button" onClick={stepForward} className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white">Continue <ArrowRight className="h-4 w-4"/></button></div>}
        {step === 4 && <div className="mt-4 flex flex-col-reverse justify-between gap-3 sm:flex-row"><button type="button" onClick={() => setStep(3)} className="mmx-glass-action rounded-xl border px-5 py-3 text-sm font-bold text-slate-700">Back to transport</button><button type="button" onClick={requestMove} disabled={saving} className="mmx-liquid-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Sending request…' : 'Request transport'} <ArrowRight className="h-4 w-4"/></button></div>}
        {step === 5 && (selectedRequest ? <RequestTrackingCard request={selectedRequest} selected showDetails onSelect={() => {}} /> : <div className="rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center"><Truck className="mx-auto h-8 w-8 text-slate-400"/><p className="mt-3 font-bold text-slate-800">Opening your move updates…</p></div>)}
      </section>

      <aside className="space-y-5">
        <section className="mmx-glass-surface rounded-[1.7rem] border p-5 shadow-[0_18px_60px_rgba(20,55,42,.08)] backdrop-blur-xl"><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.13em] text-emerald-800"><CircleHelp className="h-4 w-4"/> How moving works</p><div className="mt-4 space-y-4">{['Choose the things going with you', 'Pin the two ends of your move', 'Select a vehicle size', 'Review the provider quote and driver updates'].map((line, index) => <div key={line} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-extrabold text-emerald-900">{index + 1}</span><p className="pt-1 text-sm leading-5 text-slate-600">{line}</p></div>)}</div><div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-800">About map time estimates</p><p className="mt-1 text-xs leading-5 text-slate-500">The route estimate is based on road distance and does not include live traffic. Ask your driver for a current arrival update.</p></div></section>
        {currentUser && <section className="mmx-glass-surface rounded-[1.7rem] border p-5 shadow-[0_18px_60px_rgba(20,55,42,.08)] backdrop-blur-xl"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-emerald-800">Your moves</p><h2 className="mt-1 font-bold text-slate-900">Live request updates</h2></div><Clock3 className="h-5 w-5 text-slate-500"/></div><div className="mt-4 space-y-3">{requests.length ? requests.map((request) => <RequestTrackingCard key={request.id} request={request} selected={request.id === selectedRequestId && step === 5} showDetails={false} onSelect={() => { setSelectedRequestId(request.id); setStep(5); }} />) : <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-5 text-slate-500">Your requests and driver updates will appear here.</p>}</div></section>}
        <Link to="/roommates" className="mmx-glass-card group flex items-center justify-between gap-3 rounded-2xl border p-4 transition"><span><span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">Sharing your new home?</span><span className="mt-1 block text-sm font-bold text-slate-900">Find a compatible roommate</span></span><ArrowRight className="h-5 w-5 text-emerald-800 transition group-hover:translate-x-1"/></Link>
      </aside>
    </div>
    {step === 5 && selectedRequest && <div className="mmx-glass-surface-dark pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(92vw,460px)] -translate-x-1/2 rounded-2xl border p-4 text-white shadow-2xl backdrop-blur-xl md:bottom-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-slate-950"><Truck className="h-5 w-5"/></span><span><span className="block text-xs text-white/60">Move request</span><span className="block text-sm font-bold">{TRANSPORT_STATUS_LABELS[selectedRequest.status] || selectedRequest.status}</span></span></div><span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"/>Live updates</span></div></div>}
  </main>;
};

export default TransportPage;
