
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import {
  LocateFixed,
  Navigation,
  Route as RouteIcon,
  MapPinned,
  Compass,
  ArrowUpRight,
  ExternalLink,
  Clock3,
  LoaderCircle,
  AlertCircle,
  ChevronRight,
  Crosshair,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./TransportTrackingMap.css";
import { getPoint } from "../../services/transportService";
import { isAndroid } from "../../utils/platform";

const OSRM_BASE =
  import.meta.env.VITE_OSRM_URL || "https://router.project-osrm.org";

const OSM_TILES =
  import.meta.env.VITE_OSM_TILE_URL ||
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const DEFAULT_CENTER = [-0.3031, 36.08]; // Nakuru fallback only

const validNumber = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

function normalizePoint(value) {
  if (!value) return null;

  let point = null;

  try {
    point = getPoint(value);
  } catch {
    point = null;
  }

  const source = point || value;

  let lat =
    source?.lat ??
    source?.latitude ??
    source?.coords?.lat ??
    source?.coordinates?.lat;

  let lng =
    source?.lng ??
    source?.lon ??
    source?.longitude ??
    source?.coords?.lng ??
    source?.coords?.lon ??
    source?.coordinates?.lng ??
    source?.coordinates?.lon;

  // GeoJSON coordinates are [longitude, latitude].
  if (
    Array.isArray(source?.coordinates) &&
    source.coordinates.length >= 2
  ) {
    lng = source.coordinates[0];
    lat = source.coordinates[1];
  }

  if (!validNumber(lat) || !validNumber(lng)) return null;

  lat = Number(lat);
  lng = Number(lng);

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    lat,
    lng,
    heading: validNumber(source?.heading)
      ? Number(source.heading)
      : validNumber(source?.bearing)
        ? Number(source.bearing)
        : validNumber(source?.course)
          ? Number(source.course)
          : null,
    accuracy: validNumber(source?.accuracy)
      ? Number(source.accuracy)
      : null,
  };
}

function asLatLng(point) {
  return [point.lat, point.lng];
}

function distanceMetres(a, b) {
  if (!a || !b) return 0;

  const rad = (n) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bearingBetween(a, b) {
  if (!a || !b) return 0;

  const rad = (n) => (n * Math.PI) / 180;
  const deg = (n) => (n * 180) / Math.PI;
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const dLng = rad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (deg(Math.atan2(y, x)) + 360) % 360;
}

function formatDistance(metres) {
  if (!Number.isFinite(metres) || metres < 0) return "—";
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(metres >= 10000 ? 0 : 1)} km`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function maneuverText(step) {
  const maneuver = step?.maneuver || {};
  const type = String(maneuver.type || "").toLowerCase();
  const modifier = String(maneuver.modifier || "").toLowerCase();
  const road = step?.name?.trim();
  const roadText = road ? ` onto ${road}` : "";

  if (type === "arrive") return "You have arrived";
  if (type === "depart") return road ? `Head onto ${road}` : "Start driving";
  if (type === "roundabout" || type === "rotary") {
    const exit = maneuver.exit;

    if (exit) {
      return `At the roundabout, take exit ${exit}${roadText}`;
    }

    return `At the roundabout, follow the route${roadText}`;
  }

  if (type === "merge") return `Merge${modifier ? ` ${modifier}` : ""}${roadText}`;
  if (type === "fork") return `Keep ${modifier || "to the indicated road"}${roadText}`;
  if (type === "on ramp") return `Take the ramp${roadText}`;
  if (type === "off ramp") return `Take the exit${roadText}`;
  if (type === "continue") return road ? `Continue on ${road}` : "Continue ahead";
  if (type === "new name") return road ? `Continue onto ${road}` : "Continue ahead";
  if (type === "end of road") {
    return `At the end of the road, turn ${modifier || "as indicated"}${roadText}`;
  }

  if (type === "turn") {
    const direction = modifier || "ahead";
    return `Turn ${direction}${roadText}`;
  }

  if (type === "notification") return road ? `Continue on ${road}` : "Continue on the route";

  if (modifier.includes("left")) return `Keep left${roadText}`;
  if (modifier.includes("right")) return `Keep right${roadText}`;

  return road ? `Continue on ${road}` : "Continue on the route";
}

function carIcon(heading = 0) {
  return L.divIcon({
    className: "mm-car-icon-shell",
    html: `
      <div class="mm-car-heading" style="transform:rotate(${heading}deg)">
        <span class="mm-car-glow"></span>
        <svg viewBox="0 0 48 60" aria-hidden="true">
          <path d="M15 4 Q24 -1 33 4 L39 19 L43 30 L43 46 Q43 51 38 51 L10 51 Q5 51 5 46 L5 30 L9 19 Z"
            fill="#111318" stroke="#ffffff" stroke-width="2.2"/>
          <path d="M14 11 Q24 7 34 11 L37 22 L11 22 Z"
            fill="#b9e4ff" stroke="#e9f7ff" stroke-width="1.2"/>
          <path d="M10 28 L38 28 L38 42 Q24 46 10 42 Z"
            fill="#262b35" stroke="#606a7a" stroke-width="1"/>
          <path d="M8 17 L4 22 L4 29 L9 28 Z" fill="#ffe5a1"/>
          <path d="M40 17 L44 22 L44 29 L39 28 Z" fill="#ffe5a1"/>
          <path d="M10 46 L17 46 M31 46 L38 46"
            stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M18 32 L30 32" stroke="#697487" stroke-width="1.2"/>
        </svg>
      </div>
    `,
    iconSize: [48, 60],
    iconAnchor: [24, 30],
  });
}

function endpointIcon(kind, label) {
  const colour = kind === "pickup" ? "#16865c" : "#d94949";

  return L.divIcon({
    className: "mm-endpoint-icon-shell",
    html: `
      <div class="mm-endpoint-wrap">
        <span class="mm-endpoint-dot" style="background:${colour}"></span>
        <span class="mm-endpoint-label">${label}</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapInteraction({ onUserMove }) {
  useMapEvents({
    dragstart: () => onUserMove?.(),
    zoomstart: () => onUserMove?.(),
  });

  return null;
}

function MapController({
  pickup,
  destination,
  driver,
  followDriver,
  overviewKey,
}) {
  const map = useMap();
  const firstFit = useRef(false);

  useEffect(() => {
    if (!map) return;

    const points = [pickup, destination].filter(Boolean);

    if (points.length >= 2 && !firstFit.current) {
      map.fitBounds(
        L.latLngBounds(points.map(asLatLng)),
        { padding: [60, 60], maxZoom: 16, animate: true }
      );
      firstFit.current = true;
    } else if (points.length === 1 && !firstFit.current) {
      map.setView(asLatLng(points[0]), 15);
      firstFit.current = true;
    } else if (!points.length && driver && !firstFit.current) {
      map.setView(asLatLng(driver), 16);
      firstFit.current = true;
    }
  }, [map, pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, driver?.lat, driver?.lng]);

  useEffect(() => {
    if (!map || !overviewKey) return;

    const points = [pickup, destination].filter(Boolean);

    if (points.length >= 2) {
      map.fitBounds(
        L.latLngBounds(points.map(asLatLng)),
        { padding: [60, 60], maxZoom: 16, animate: true }
      );
    } else if (points.length === 1) {
      map.setView(asLatLng(points[0]), 16, { animate: true });
    }
  }, [map, overviewKey]);

  useEffect(() => {
    if (!map || !followDriver || !driver) return;

    map.setView(asLatLng(driver), Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 0.45,
    });
  }, [map, followDriver, driver?.lat, driver?.lng]);

  return null;
}

function DriverMarker({ point, fallbackHeading = 0 }) {
  const markerRef = useRef(null);
  const previousPoint = useRef(null);
  const headingRef = useRef(fallbackHeading);
  const animationRef = useRef(null);
  const [heading, setHeading] = useState(fallbackHeading);

  useEffect(() => {
    if (!point) return;

    const previous = previousPoint.current;
    let nextHeading = point.heading;

    if (nextHeading === null && previous) {
      const moved = distanceMetres(previous, point);

      // Ignore GPS jitter when deriving the direction of travel.
      if (moved > 2) nextHeading = bearingBetween(previous, point);
    }

    if (nextHeading === null) nextHeading = headingRef.current ?? fallbackHeading;

    nextHeading = ((nextHeading % 360) + 360) % 360;

    // Keep the turn direction smooth when heading crosses 359° -> 0°.
    const current = headingRef.current ?? nextHeading;
    const delta = ((nextHeading - current + 540) % 360) - 180;
    const smoothHeading = (current + delta * 0.65 + 360) % 360;

    headingRef.current = smoothHeading;
    setHeading(smoothHeading);
    previousPoint.current = point;
  }, [point?.lat, point?.lng, point?.heading, fallbackHeading]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!point) return null;

  return (
    <>
      {point.accuracy && point.accuracy < 250 && (
        <CircleMarker
          center={asLatLng(point)}
          radius={Math.min(24, Math.max(7, point.accuracy / 5))}
          pathOptions={{
            color: "#2785f7",
            fillColor: "#2785f7",
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3,
          }}
        />
      )}
      <Marker
        ref={markerRef}
        position={asLatLng(point)}
        icon={carIcon(heading)}
        zIndexOffset={1000}
        keyboard={false}
        title="Driver location"
      />
    </>
  );
}

export default function TransportTrackingMap({
  pickupLocation,
  destinationLocation,
  driverLocation,
  className = "",
  pickupLabel = "Pickup",
  destinationLabel = "Destination",
}) {
  const pickup = useMemo(
    () => normalizePoint(pickupLocation),
    [pickupLocation]
  );

  const destination = useMemo(
    () => normalizePoint(destinationLocation),
    [destinationLocation]
  );

  const driver = useMemo(
    () => normalizePoint(driverLocation),
    [driverLocation]
  );

  const [route, setRoute] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle");
  const [routeError, setRouteError] = useState("");

  const [followDriver, setFollowDriver] = useState(Boolean(driver));
  const [overviewKey, setOverviewKey] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const routeKey = pickup && destination
    ? `${pickup.lat.toFixed(6)},${pickup.lng.toFixed(6)}:${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`
    : "";

  const routeCoordinates = route?.geometry?.coordinates || [];

  const routeLine = useMemo(
    () => routeCoordinates.map(([lng, lat]) => [lat, lng]),
    [routeCoordinates]
  );

  const routeSteps = useMemo(() => {
    const legs = route?.legs || [];
    return legs.flatMap((leg) => leg.steps || []);
  }, [route]);

  const tripDistance = route?.distance ?? null;
  const tripDuration = route?.duration ?? null;

  const currentStep = routeSteps[activeStep] || null;
  const nextStep = routeSteps[activeStep + 1] || null;

  const origin = pickup || driver || destination;
  const mapCenter = origin ? asLatLng(origin) : DEFAULT_CENTER;

  const roadName = currentStep?.name?.trim();
  const instruction = currentStep
    ? maneuverText(currentStep)
    : routeStatus === "loading"
      ? "Finding the best route…"
      : routeStatus === "error"
        ? "Route directions are unavailable"
        : pickup && destination
          ? "Route ready when directions load"
          : "Waiting for pickup and destination";

  const loadRoute = useCallback(async (signal) => {
    if (!pickup || !destination) {
      setRoute(null);
      setRouteStatus("idle");
      setRouteError("");
      return;
    }

    if (distanceMetres(pickup, destination) < 8) {
      setRoute(null);
      setRouteStatus("error");
      setRouteError("Pickup and destination are almost the same point.");
      return;
    }

    setRouteStatus("loading");
    setRouteError("");
    setActiveStep(0);

    try {
      const base = OSRM_BASE.replace(/\/+$/, "");
      const url =
        `${base}/route/v1/driving/` +
        `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}` +
        `?overview=full&geometries=geojson&steps=true&alternatives=false`;

      const response = await fetch(url, { signal });

      if (!response.ok) throw new Error(`Routing service returned ${response.status}`);

      const data = await response.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("No drivable route was returned for these points.");
      }

      setRoute(data.routes[0]);
      setRouteStatus("ready");
    } catch (error) {
      if (signal.aborted) return;

      setRoute(null);
      setRouteStatus("error");
      setRouteError(
        error?.message || "Could not load driving directions. Try again."
      );
    }
  }, [routeKey]);

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      setRoute(null);
      setRouteStatus("error");
      setRouteError(
        "We're having trouble finding your route. Please try again."
      );
      controller.abort();
    }, 22000);

    loadRoute(controller.signal).finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadRoute, routeKey]);

  useEffect(() => {
    if (!routeSteps.length) return;

    // Move the instruction forward once the driver is near the next step.
    // This is only a distance-based estimate, not map-matched GPS navigation.
    if (!driver) return;

    const candidates = routeSteps
      .map((step, index) => {
        const location = step?.maneuver?.location;

        if (!Array.isArray(location) || location.length < 2) return null;

        const point = { lat: location[1], lng: location[0] };

        return {
          index,
          distance: distanceMetres(driver, point),
        };
      })
      .filter(Boolean);

    if (!candidates.length) return;

    const nearest = candidates.reduce((best, candidate) =>
      candidate.distance < best.distance ? candidate : best
    );

    if (nearest.distance < 80) {
      setActiveStep((previous) => Math.max(previous, nearest.index));
    }
  }, [driver?.lat, driver?.lng, routeSteps]);

  const handleLocate = useCallback(() => {
    if (driver) {
      setFollowDriver(true);
      return;
    }

    if (pickup) {
      setOverviewKey((value) => value + 1);
    }
  }, [driver, pickup]);

  const handleOverview = useCallback(() => {
    setFollowDriver(false);
    setOverviewKey((value) => value + 1);
  }, []);

  const openGoogleMaps = useCallback((startNavigation = false) => {
    if (!pickup || !destination) return;
    const params = new URLSearchParams({
      api: "1",
      destination: `${destination.lat},${destination.lng}`,
      travelmode: "driving",
    });
    if (startNavigation) {
      // Open the route preview so Google Maps displays its own Start control.
      // `dir_action=navigate` can skip that preview and begin guidance directly.
      if (driver) params.set("origin", `${driver.lat},${driver.lng}`);
      else params.set("origin", `${pickup.lat},${pickup.lng}`);
    } else {
      params.set("origin", `${pickup.lat},${pickup.lng}`);
    }
    const mapsUrl = `https://www.google.com/maps/dir/?${params.toString()}`;

    if (isAndroid()) {
      const intentUrl = `intent://www.google.com/maps/dir/?${params.toString()}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${encodeURIComponent(mapsUrl)};end`;
      window.location.href = intentUrl;
      return;
    }

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, driver?.lat, driver?.lng]);

  const mapPoints = [pickup, destination].filter(Boolean);
  const hasTrip = Boolean(pickup && destination);

  return (
    <section className={`mm-nav ${className}`}>
      <div className="mm-nav-map">
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom
          zoomControl
          preferCanvas
          className="mm-nav-leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url={OSM_TILES}
            maxZoom={19}
          />

          <MapController
            pickup={pickup}
            destination={destination}
            driver={driver}
            followDriver={followDriver}
            overviewKey={overviewKey}
          />

          <MapInteraction
            onUserMove={() => {
              if (followDriver) setFollowDriver(false);
            }}
          />

          {routeLine.length > 1 && (
            <>
              <Polyline
                positions={routeLine}
                pathOptions={{
                  color: "#ffffff",
                  weight: 10,
                  opacity: 0.92,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                positions={routeLine}
                pathOptions={{
                  color: "#1877f2",
                  weight: 6,
                  opacity: 0.98,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </>
          )}

          {pickup && (
            <Marker
              position={asLatLng(pickup)}
              icon={endpointIcon("pickup", "A")}
              zIndexOffset={500}
              title={pickupLabel}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>{pickupLabel}</strong>
                <div>{pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}</div>
              </Tooltip>
            </Marker>
          )}

          {destination && (
            <Marker
              position={asLatLng(destination)}
              icon={endpointIcon("destination", "B")}
              zIndexOffset={500}
              title={destinationLabel}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>{destinationLabel}</strong>
                <div>{destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}</div>
              </Tooltip>
            </Marker>
          )}

          {driver && (
            <DriverMarker
              point={driver}
              fallbackHeading={
                routeCoordinates.length > 1
                  ? bearingBetween(
                      { lat: routeCoordinates[0][1], lng: routeCoordinates[0][0] },
                      { lat: routeCoordinates[1][1], lng: routeCoordinates[1][0] }
                    )
                  : 0
              }
            />
          )}

        </MapContainer>

        <div className="mm-map-topline">
          <div className="mm-map-live">
            <span className={`mm-live-dot ${driver ? "is-live" : ""}`} />
            <span>{driver ? "Driver location" : "Trip map"}</span>
          </div>
          <div className="mm-map-attribution">OpenStreetMap · Live tracking</div>
        </div>

        <div className="mm-map-actions">
          <button
            type="button"
            className={`mm-map-action ${followDriver ? "is-active" : ""}`}
            onClick={handleLocate}
            title={driver ? "Follow driver" : "Show trip"}
            aria-label={driver ? "Follow driver" : "Show trip"}
          >
            {followDriver ? <Navigation size={18} /> : <LocateFixed size={18} />}
          </button>
          <button
            type="button"
            className="mm-map-action"
            onClick={handleOverview}
            title="Show full route"
            aria-label="Show full route"
          >
            <MapPinned size={18} />
          </button>
        </div>

        {routeStatus === "loading" && (
          <div className="mm-map-loading">
            <LoaderCircle className="mm-spin" size={16} />
            <span>Finding road route…</span>
          </div>
        )}

        {routeStatus === "error" && (
          <div className="mm-map-error">
            <AlertCircle size={16} />
            <span>{routeError || "Driving route unavailable."}</span>
          </div>
        )}
      </div>

      <div className="mm-nav-bottom">
        <div className="mm-nav-summary">
          <div className="mm-nav-summary-icon">
            {routeStatus === "ready" ? (
              <Navigation size={20} />
            ) : (
              <RouteIcon size={20} />
            )}
          </div>
          <div className="mm-nav-summary-main">
            <span className="mm-nav-eyebrow">
              {routeStatus === "ready" ? "DRIVING ROUTE" : "TRIP OVERVIEW"}
            </span>
            <strong>
              {tripDistance !== null ? formatDistance(tripDistance) : "Route details"}
            </strong>
            <span className="mm-nav-subtitle">
              {tripDuration !== null
                ? `Estimated drive · ${formatDuration(tripDuration)}`
                : hasTrip
                  ? "Waiting for route estimate"
                  : "Waiting for trip locations"}
            </span>
          </div>
          <div className="mm-nav-estimate">
            <Clock3 size={15} />
            <span>{tripDuration !== null ? formatDuration(tripDuration) : "—"}</span>
          </div>
        </div>

        <div className="mm-nav-actions">
          <button
            type="button"
            className="mm-open-google-maps mm-view-directions"
            onClick={() => openGoogleMaps(false)}
            disabled={!hasTrip}
          >
            <ExternalLink size={17} />
            <span>View directions</span>
          </button>
          <button
            type="button"
            className="mm-open-google-maps"
            onClick={() => openGoogleMaps(true)}
            disabled={!hasTrip}
          >
            <Navigation size={17} />
            <span>Start navigation</span>
          </button>
        </div>

        <div className="mm-nav-stops">
          <div className="mm-stop-line">
            <span className="mm-stop-dot mm-stop-pickup" />
            <div className="mm-stop-copy">
              <span>FROM</span>
              <strong>{pickupLabel}</strong>
              <small>
                {pickup
                  ? `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`
                  : "Pickup location not set"}
              </small>
            </div>
          </div>
          <div className="mm-stop-line">
            <span className="mm-stop-dot mm-stop-destination" />
            <div className="mm-stop-copy">
              <span>TO</span>
              <strong>{destinationLabel}</strong>
              <small>
                {destination
                  ? `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`
                  : "Destination not set"}
              </small>
            </div>
          </div>
        </div>

        <div className="mm-nav-instruction">
          <div className="mm-instruction-symbol">
            <Compass size={22} />
          </div>
          <div className="mm-instruction-copy">
            <span className="mm-nav-eyebrow">
              {currentStep ? `NEXT DIRECTION${roadName ? ` · ${roadName}` : ""}` : "NAVIGATION"}
            </span>
            <strong>{instruction}</strong>
            {currentStep && (
              <small>
                {formatDistance(currentStep.distance || 0)}
                {nextStep?.name ? ` · Then ${nextStep.name}` : ""}
              </small>
            )}
          </div>
          {currentStep && (
            <button
              type="button"
              className="mm-step-next"
              onClick={() => setActiveStep((value) => Math.min(value + 1, routeSteps.length - 1))}
              aria-label="Next direction"
              title="Preview next direction"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <div className="mm-nav-foot">
          <div className="mm-landmark-status">
            <span className={`mm-status-dot ${driver ? "is-ready" : ""}`} />
            {driver ? "Driver location updates live" : routeStatus === "ready" ? "Route displayed" : "Waiting for live driver location"}
          </div>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="mm-data-link"
          >
            Map data details <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
