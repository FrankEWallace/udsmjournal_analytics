import { useState, memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { motion } from "framer-motion";
import { countryData } from "@/lib/mock-data";
import { useMatomoCountries } from "@/hooks/useMatomoData";
import { MapSkeleton } from "@/components/ui/skeletons";

// Country coordinates lookup for Matomo data (live dots mode)
const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  TZ: { lat: -6.37, lng: 34.89 },
  KE: { lat: -0.02, lng: 37.91 },
  US: { lat: 37.09, lng: -95.71 },
  GB: { lat: 55.38, lng: -3.44 },
  ZA: { lat: -30.56, lng: 22.94 },
  NG: { lat: 9.08, lng: 8.68 },
  IN: { lat: 20.59, lng: 78.96 },
  DE: { lat: 51.17, lng: 10.45 },
  UG: { lat: 1.37, lng: 32.29 },
  ET: { lat: 9.15, lng: 40.49 },
  CA: { lat: 56.13, lng: -106.35 },
  AU: { lat: -25.27, lng: 133.78 },
  FR: { lat: 46.23, lng: 2.21 },
  CN: { lat: 35.86, lng: 104.20 },
  BR: { lat: -14.24, lng: -51.93 },
  RW: { lat: -1.94, lng: 29.87 },
  MW: { lat: -13.25, lng: 34.30 },
  ZM: { lat: -13.13, lng: 27.85 },
  JP: { lat: 36.20, lng: 138.25 },
  SE: { lat: 60.13, lng: 18.64 },
  NO: { lat: 60.47, lng: 8.47 },
  NL: { lat: 52.13, lng: 5.29 },
  EG: { lat: 26.82, lng: 30.80 },
  GH: { lat: 7.95, lng: -1.02 },
  MZ: { lat: -18.67, lng: 35.53 },
};

// ISO Alpha-2 → ISO Numeric (used by world-atlas topojson)
const isoAlpha2ToNumeric: Record<string, string> = {
  AF:"004",AL:"008",DZ:"012",AO:"024",AR:"032",AM:"051",AU:"036",AT:"040",AZ:"031",
  BD:"050",BY:"112",BE:"056",BJ:"204",BT:"064",BO:"068",BA:"070",BW:"072",BR:"076",
  BN:"096",BG:"100",BF:"854",BI:"108",KH:"116",CM:"120",CA:"124",CF:"140",TD:"148",
  CL:"152",CN:"156",CO:"170",CD:"180",CG:"178",CR:"188",CI:"384",HR:"191",CU:"192",
  CY:"196",CZ:"203",DK:"208",DJ:"262",DO:"214",EC:"218",EG:"818",SV:"222",GQ:"226",
  ER:"232",EE:"233",ET:"231",FI:"246",FR:"250",GA:"266",GM:"270",GE:"268",DE:"276",
  GH:"288",GR:"300",GT:"320",GN:"324",GW:"624",GY:"328",HT:"332",HN:"340",HU:"348",
  IS:"352",IN:"356",ID:"360",IR:"364",IQ:"368",IE:"372",IL:"376",IT:"380",JM:"388",
  JP:"392",JO:"400",KZ:"398",KE:"404",KW:"414",KG:"417",LA:"418",LV:"428",LB:"422",
  LS:"426",LR:"430",LY:"434",LT:"440",LU:"442",MK:"807",MG:"450",MW:"454",MY:"458",
  ML:"466",MR:"478",MX:"484",MD:"498",MN:"496",ME:"499",MA:"504",MZ:"508",MM:"104",
  NA:"516",NP:"524",NL:"528",NZ:"554",NI:"558",NE:"562",NG:"566",KP:"408",NO:"578",
  OM:"512",PK:"586",PA:"591",PG:"598",PY:"600",PE:"604",PH:"608",PL:"616",PT:"620",
  QA:"634",RO:"642",RU:"643",RW:"646",SA:"682",SN:"686",RS:"688",SL:"694",SK:"703",
  SI:"705",SO:"706",ZA:"710",KR:"410",SS:"728",ES:"724",LK:"144",SD:"729",SR:"740",
  SZ:"748",SE:"752",CH:"756",SY:"760",TW:"158",TJ:"762",TZ:"834",TH:"764",TL:"626",
  TG:"768",TT:"780",TN:"788",TR:"792",TM:"795",UG:"800",UA:"804",AE:"784",GB:"826",
  US:"840",UY:"858",UZ:"860",VE:"862",VN:"704",YE:"887",ZM:"894",ZW:"716",
};

// Color scale for "All Time" choropleth mode
const getChoroplethColor = (intensity: number): string => {
  if (intensity <= 0) return "#e5e7eb";        // grey — no data
  if (intensity < 0.15) return "#d1d5db";       // light grey — very low
  if (intensity < 0.3) return "#86efac";        // light green — low
  if (intensity < 0.5) return "#22c55e";        // green — moderate
  if (intensity < 0.7) return "#f59e0b";        // orange — medium-high
  if (intensity < 0.85) return "#f97316";       // deep orange — high
  return "#ef4444";                             // red — very high
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface InteractiveWorldMapProps {
  title?: string;
  subtitle?: string;
  showToggle?: boolean;
  animated?: boolean;
}

const InteractiveWorldMap = memo(({ title = "Global Reader Engagement", subtitle, showToggle = true, animated = false }: InteractiveWorldMapProps) => {
  const [activeToggle, setActiveToggle] = useState<"alltime" | "live">("alltime");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const isLive = activeToggle === "live";
  
  // "All Time" fetches month range for broader coverage; "Live" fetches today
  const { data: matomoCountries, isLoading, isRefetching } = useMatomoCountries(
    isLive ? "day" : "month",
    isLive ? "today" : "previous12"
  );

  // ── All Time: Build country lookup by ISO numeric code (for choropleth) ──
  const countryByNumeric = useMemo(() => {
    const lookup = new Map<string, { label: string; code: string; visits: number }>();
    const source = (matomoCountries && matomoCountries.length > 0) ? matomoCountries : countryData.map(c => ({ label: c.country, code: c.code.toLowerCase(), nb_visits: c.downloads }));
    
    for (const c of source) {
      const alpha2 = ('code' in c ? c.code : '').toUpperCase();
      const visits = 'nb_visits' in c ? (c as any).nb_visits : ('downloads' in c ? (c as any).downloads : 0);
      const numericCode = isoAlpha2ToNumeric[alpha2];
      if (numericCode) {
        lookup.set(numericCode, { label: ('label' in c ? c.label : (c as any).country) as string, code: alpha2, visits });
      }
    }
    return lookup;
  }, [matomoCountries]);

  const maxVisitsAllTime = useMemo(() => {
    let max = 1;
    countryByNumeric.forEach(v => { if (v.visits > max) max = v.visits; });
    return max;
  }, [countryByNumeric]);
  
  // ── Live: Build dot markers from Matomo ──
  const liveMapData = useMemo(() => {
    if (!isLive) return [];
    if (matomoCountries && matomoCountries.length > 0) {
      return matomoCountries
        .filter(c => c.code && countryCoordinates[c.code.toUpperCase()])
        .map(c => ({
          country: c.label,
          code: c.code.toUpperCase(),
          downloads: c.nb_visits,
          lat: countryCoordinates[c.code.toUpperCase()].lat,
          lng: countryCoordinates[c.code.toUpperCase()].lng,
        }));
    }
    return countryData; // Mock fallback
  }, [matomoCountries, isLive]);
  
  const maxLiveDownloads = Math.max(...(liveMapData.length ? liveMapData.map(c => c.downloads) : [1]), 1);

  if (isLoading) {
    return <MapSkeleton />;
  }

  const isUsingMockData = !matomoCountries || matomoCountries.length === 0;
  const dynamicSubtitle = subtitle || (isLive ? "Real-time visitor locations" : "Download coverage by country (all time)");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold font-heading text-foreground flex items-center gap-2">
            {title}
            {isRefetching && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Refreshing..." />
            )}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            {dynamicSubtitle}
            {isUsingMockData && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Demo Data</span>
            )}
          </p>
        </div>
        {showToggle && (
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => setActiveToggle("alltime")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeToggle === "alltime" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              All Time
            </button>
            <button
              onClick={() => setActiveToggle("live")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${isLive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"}`} />
              Live
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-lg bg-slate-50 overflow-hidden" style={{ aspectRatio: "2/1" }}>
        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoId = geo.id || geo.properties?.["ISO_A3_EH"];
                  const countryInfo = countryByNumeric.get(geoId);
                  
                  // In "All Time" mode, color countries by download intensity
                  let fillColor = "#e5e7eb"; // default grey
                  if (!isLive && countryInfo) {
                    const intensity = countryInfo.visits / maxVisitsAllTime;
                    fillColor = getChoroplethColor(intensity);
                  } else if (isLive) {
                    fillColor = "#eef2f7"; // light neutral for live mode background
                  }
                  
                  return (
                    <Geography
                      key={geo.rsmKey || geo.id}
                      geography={geo}
                      fill={fillColor}
                      stroke="#fff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { 
                          fill: countryInfo ? "#2A6EBB" : "#d1d5db",
                          outline: "none",
                          cursor: countryInfo ? "pointer" : "default",
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(e) => {
                        if (!isLive && countryInfo) {
                          const rect = (e.target as SVGPathElement).ownerSVGElement?.getBoundingClientRect();
                          if (rect) {
                            setTooltip({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top - 10,
                              content: `${countryInfo.label}: ${countryInfo.visits.toLocaleString()} downloads`,
                            });
                          }
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })
              }
            </Geographies>

            {/* Live mode: show animated dots */}
            {isLive && liveMapData.map((c) => {
              const intensity = c.downloads / maxLiveDownloads;
              const radius = 4 + intensity * 14;
              return (
                <Marker key={c.code} coordinates={[c.lng, c.lat]}>
                  <circle
                    r={radius}
                    fill="rgba(42, 110, 187, 0.7)"
                    stroke="#2A6EBB"
                    strokeWidth={1}
                    className="cursor-pointer animate-pulse-glow"
                    style={{ filter: `drop-shadow(0 0 ${radius / 2}px rgba(42,110,187,0.5))` }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top - 10,
                          content: `${c.country}: ${c.downloads.toLocaleString()} active visits`,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {intensity > 0.3 && (
                    <text
                      textAnchor="middle"
                      y={radius + 12}
                      style={{ fontFamily: "Inter, sans-serif", fontSize: "7px", fill: "#64748b", fontWeight: 500 }}
                    >
                      {c.code}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {isLive ? (
          /* Live mode legend — dot sizes */
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "rgba(42,110,187,0.5)" }} />
              Low activity
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: "rgba(42,110,187,0.7)" }} />
              Medium
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 rounded-full" style={{ background: "rgba(42,110,187,0.9)" }} />
              High
            </div>
          </div>
        ) : (
          /* All Time legend — color scale */
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ background: "#ef4444" }} />
              Very High
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ background: "#f97316" }} />
              High
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ background: "#f59e0b" }} />
              Medium
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ background: "#22c55e" }} />
              Low
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ background: "#86efac" }} />
              Very Low
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ background: "#e5e7eb" }} />
              No Data
            </div>
          </div>
        )}
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {isLive ? "Live · Auto-refresh 15s" : "Auto-refresh every 60s"}
        </span>
      </div>
    </motion.div>
  );
});

InteractiveWorldMap.displayName = "InteractiveWorldMap";
export default InteractiveWorldMap;
