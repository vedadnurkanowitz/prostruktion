"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Building2,
  HardHat,
  Users,
  MapPin,
  Calendar,
  Euro,
  Phone,
  Mail,
  Briefcase,
  Search,
  Filter,
  Navigation,
  ArrowRight,
} from "lucide-react";

// OpenLayers imports
import "ol/ol.css";
import OLMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { fromLonLat } from "ol/proj";
import { Style, Circle, Fill, Stroke, Text } from "ol/style";
import Overlay from "ol/Overlay";
import { createClient } from "@/lib/supabase/client";
import { haversineDistance, formatDistance } from "@/utils/haversine";

type Worker = {
  id: string;
  name: string;
  role: string;
  subRole?: string;
  subcontractor: string;
  avatarSeed?: string;
  status?: string;
  a1Status?: string;
  certStatus?: string;
  coolingStatus?: string;
  complaints?: number;
  completedProjects?: number;
  activeProjects?: number;
  successRate?: number;
  phone?: string;
  email?: string;
  joinedDate?: string;
  certFiles?: string[];
};

type Company = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: string;
  status?: string;
  rating?: number;
  complaints?: number;
  activeProjects?: number;
  workers?: Worker[];
  docsExpired?: boolean;
};

type Project = {
  project: string;
  address: string;
  description?: string;
  status: string;
  statusColor: string;
  contractor?: string;
  sub?: string;
  partner?: string;
  mediator?: string;
  amount?: string;
  start?: string;
  scheduledStart?: string;
  workers?: string[];
  lat?: number;
  lng?: number;
  complaints?: number;
  isArchived?: boolean;
  id?: string;
  subId?: string;
  mediatorId?: string;
};

const getRandomInRange = (from: number, to: number, fixed: number) => {
  return parseFloat((Math.random() * (to - from) + from).toFixed(fixed));
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  Scheduled: "#9333ea",
  "In Progress": "#f97316",
  "In Abnahme": "#eab308",
  Finished: "#16a34a",
};

// Geocoding cache to avoid repeated API calls
// Use a more persistent key structure if needed, but for now this is in-memory per session reload
// unless we load it from localStorage.
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

const geocodeAddress = async (
  address: string,
): Promise<{ lat: number; lng: number } | null> => {
  if (!address || address.trim() === "") return null;

  // Check cache first
  if (geocodeCache[address] !== undefined) {
    return geocodeCache[address];
  }

  try {
    // Nominatim requires a proper User-Agent, but some browsers block it
    // Moving to backend or removing custom header if blocked by CORS
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    );

    if (!response.ok) {
      console.warn("Nominatim geocoding failed:", response.status);
      geocodeCache[address] = null;
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geocodeCache[address] = result;
      return result;
    }

    geocodeCache[address] = null;
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    geocodeCache[address] = null;
    return null;
  }
};

// Default workers for demo
// Default workers removed for clean slate
const DEFAULT_WORKERS: Worker[] = [];

export default function ProjectMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<OLMap | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Data from Supabase
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const vectorSourceRef = useRef<VectorSource<Feature<Point>> | null>(null);
  const mapInitialized = useRef(false);

  // Data from Supabase lists
  // Data from localStorage
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]); // Cleared defaults
  const [subcontractors, setSubcontractors] = useState<Company[]>([]);
  const [contractors, setContractors] = useState<Company[]>([]);
  const [partners, setPartners] = useState<Company[]>([]);

  // Filter States
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerRole, setWorkerRole] = useState("all");
  const [companySearch, setCompanySearch] = useState("");

  const [filterSub, setFilterSub] = useState("all");
  const [filterPartner, setFilterPartner] = useState("all");
  const [filterContractor, setFilterContractor] = useState("all");

  // Team Deployment State
  const [showNearbyProjects, setShowNearbyProjects] = useState(false);
  const [nearbyProjects, setNearbyProjects] = useState<
    Array<Project & { distance: number }>
  >([]);
  const [assigningTeam, setAssigningTeam] = useState<string | null>(null);
  const linesSourceRef = useRef<VectorSource | null>(null);

  // 1. Unified Data Fetching Effect
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const supabase = createClient();

      try {
        // A. Fetch Lists (Workers, Companies)
        const { data: workersData } = await supabase
          .from("workers")
          .select("*")
          .eq("status", "Active");
        if (workersData && isMounted) {
          setAllWorkers(
            workersData.map((w: any) => ({
              id: w.id,
              name: w.name,
              role: w.role,
              subRole: w.sub_role,
              subcontractor: w.company_name,
              status: w.status,
              phone: w.phone,
              email: w.email,
              avatarSeed: w.avatar_seed || w.name,
              successRate: w.success_rate || 98,
              completedProjects: w.completed_projects || 0,
              a1Status: w.a1_status,
              certStatus: w.cert_status,
              certFiles: w.cert_files || [],
            })),
          );
        }

        const { data: contacts } = await supabase.from("contacts").select("*");
        const { data: profiles } = await supabase.from("profiles").select("*");

        const allEntities: Company[] = [];
        const nameMap: Record<string, string> = {};

        if (profiles) {
          profiles.forEach((p) => {
            const name = p.company_name || p.full_name;
            allEntities.push({
              id: p.id,
              name,
              email: p.email,
              status: "Active",
              type: p.role,
            });
            nameMap[p.id] = name;
          });
        }
        if (contacts) {
          contacts.forEach((c) => {
            const name = c.company_name || c.name;
            allEntities.push({
              id: c.id,
              name,
              email: c.email || "",
              phone: c.phone || "",
              status: "Active",
              type: c.role,
            });
            nameMap[c.id] = name;
          });
        }

        if (isMounted) {
          setPartners(
            allEntities.filter(
              (e) =>
                e.type === "partner" ||
                e.type === "broker" ||
                e.type === "mediator",
            ),
          );
          setSubcontractors(
            allEntities.filter((e) => e.type === "subcontractor"),
          );
          setContractors(allEntities.filter((e) => e.type === "contractor"));
        }

        // B. Fetch Projects
        const { data: dbProjects } = await supabase
          .from("projects")
          .select(`*, project_workers(worker_id)`)
          .order("created_at", { ascending: false });

        if (dbProjects && isMounted) {
          // Load caches
          const storedCache = localStorage.getItem("prostruktion_geo_cache");
          const localCacheMap: Record<string, { lat: number; lng: number }> =
            {};
          if (storedCache) {
            try {
              const parsed = JSON.parse(storedCache);
              if (Array.isArray(parsed)) {
                parsed.forEach((p: any) => {
                  if (p.project && p.lat)
                    localCacheMap[p.project] = { lat: p.lat, lng: p.lng };
                });
              } else {
                Object.assign(localCacheMap, parsed);
              }
            } catch (e) {}
          }

          const storedComplaints = localStorage.getItem(
            "prostruktion_complaints",
          );
          const realComplaintsMap: Record<string, number> = {};
          if (storedComplaints) {
            try {
              const parsedC = JSON.parse(storedComplaints);
              if (Array.isArray(parsedC)) {
                parsedC.forEach((c: any) => {
                  if (c.project && (c.status1 === "red" || c.count > 0))
                    realComplaintsMap[c.project] =
                      (realComplaintsMap[c.project] || 0) + 1;
                });
              }
            } catch (e) {}
          }

          const rawProjects: Project[] = dbProjects.map((p: any) => {
            const partnerName = nameMap[p.partner_id] || "";
            const subName = nameMap[p.subcontractor_id] || "";
            const contractorName = nameMap[p.contractor_id] || "";
            const mediatorName = nameMap[p.broker_id] || "";

            const cached = localCacheMap[p.title];
            let lat = p.lat || cached?.lat;
            let lng = p.lng || cached?.lng;

            const isArchived =
              p.status === "In Warranty" ||
              p.status === "Expiring" ||
              p.status === "Expired" ||
              p.status === "Archived";
            const realCount = realComplaintsMap[p.title] || 0;
            let complaints = realCount;
            if (complaints === 0 && (p.status === "Finished" || isArchived)) {
              complaints = p.complaints !== undefined ? p.complaints : 0;
            }

            return {
              project: p.title,
              id: p.id,
              address: p.address || "",
              description: p.description,
              status: p.status || "Scheduled",
              statusColor: "",
              contractor: contractorName,
              sub: subName,
              subId: p.subcontractor_id,
              partner: partnerName,
              mediator: mediatorName,
              mediatorId: p.broker_id,
              amount: `€ ${p.contract_value?.toLocaleString("de-DE") || "0"}`,
              start: p.actual_start
                ? new Date(p.actual_start).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "",
              scheduledStart: p.scheduled_start
                ? new Date(p.scheduled_start).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "",
              workers: p.project_workers?.map((pw: any) => pw.worker_id) || [],
              lat,
              lng,
              complaints,
              isArchived,
            } as Project;
          });

          console.log(
            "[Map Debug] Fetched",
            rawProjects.length,
            "projects from Supabase:",
            rawProjects.map((p) => p.project + ":" + p.status),
          );

          // 1. Set initial projects immediately (show even without geocoding)
          if (isMounted) setAllProjects(rawProjects);

          // 2. Background Geocoding
          const processGeocoding = async () => {
            let updated = false;
            // Clone array to avoid mutation issues, though we will update indices
            const workingProjects = [...rawProjects];

            for (let i = 0; i < workingProjects.length; i++) {
              if (!isMounted) break;
              const p = workingProjects[i];

              if (!p.lat || !p.lng) {
                // Delay to respect rate limit if not first
                if (i > 0) await new Promise((r) => setTimeout(r, 1200));
                if (!isMounted) break;

                try {
                  const geocoded = await geocodeAddress(p.address);

                  if (geocoded) {
                    p.lat = geocoded.lat;
                    p.lng = geocoded.lng;

                    // Update Cache
                    try {
                      const geoCache = JSON.parse(
                        localStorage.getItem("prostruktion_geo_cache") || "{}",
                      );
                      geoCache[p.project] = {
                        lat: geocoded.lat,
                        lng: geocoded.lng,
                      };
                      localStorage.setItem(
                        "prostruktion_geo_cache",
                        JSON.stringify(geoCache),
                      );
                    } catch (e) {}
                  } else {
                    // Mark as defaulted to avoid re-trying endlessly?
                    // For now just set to default in state implicitly by loop finishing
                    // But finding it again next reload will retry. Acceptable.
                    p.lat = 51.1657;
                    p.lng = 10.4515;
                  }
                  updated = true;
                  // Update state progressively (optional: batch this if too many re-renders)
                  if (isMounted) setAllProjects([...workingProjects]);
                } catch (e) {
                  console.error("Geocoding error in loop", e);
                }
              }
            }
            if (updated && isMounted) setAllProjects([...workingProjects]);
          };

          processGeocoding();
        }
      } catch (e) {
        console.error("Error fetching data", e);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Map Effect
  useEffect(() => {
    let olMap: OLMap | null = null;
    let timer: any;

    if (mapRef.current && !mapInitialized.current) {
      mapInitialized.current = true;

      // Delay initialization slightly to ensure DOM is ready and sized
      timer = setTimeout(() => {
        if (!mapRef.current) return;

        const vectorSource = new VectorSource({ features: [] });
        vectorSourceRef.current = vectorSource;

        const vectorLayer = new VectorLayer({ source: vectorSource });

        // Lines layer for team deployment visualization
        const linesSource = new VectorSource({ features: [] });
        linesSourceRef.current = linesSource;
        const linesLayer = new VectorLayer({
          source: linesSource,
          style: new Style({
            stroke: new Stroke({
              color: "#22c55e",
              width: 3,
              lineDash: [5, 5],
            }),
          }),
          zIndex: 100, // Ensure lines are on top
        });

        const popup = new Overlay({
          element: popupRef.current!,
          positioning: "bottom-center",
          stopEvent: true,
          offset: [0, -15],
        });

        const mapInstance = new OLMap({
          target: mapRef.current!,
          layers: [
            new TileLayer({ source: new OSM() }),
            vectorLayer,
            linesLayer,
          ],
          view: new View({
            center: fromLonLat([10.4515, 51.1657]),
            zoom: 6,
          }),
          overlays: [popup],
        });

        // Store reference for cleanup
        olMap = mapInstance;

        mapInstance.on("click", (evt) => {
          const feature = mapInstance.forEachFeatureAtPixel(
            evt.pixel,
            (f) => f,
          );
          if (feature) {
            const proj = feature.get("project") as Project;
            setSelectedProject(proj);
            setShowDetails(false);
            popup.setPosition(evt.coordinate);
          } else {
            setSelectedProject(null);
            setShowDetails(false);
            popup.setPosition(undefined);
          }
        });

        mapInstance.on("pointermove", (evt) => {
          const hit = mapInstance.hasFeatureAtPixel(evt.pixel);
          mapInstance.getTargetElement().style.cursor = hit ? "pointer" : "";
        });

        setMap(mapInstance);
      }, 100);
    }

    return () => {
      clearTimeout(timer);
      if (olMap) {
        olMap.setTarget(undefined);
        olMap = null;
      }
    };
  }, []);

  // 3. Update Map Features (Filters) Effect
  useEffect(() => {
    console.log("[Map Debug] allProjects:", allProjects.length, "map:", !!map);
    if (!map || !allProjects.length) return;

    const filtered = allProjects.filter((p) => {
      // Apply dropdown filters
      if (filterSub !== "all" && p.sub !== filterSub) return false;
      if (
        filterPartner !== "all" &&
        p.partner !== filterPartner &&
        p.mediator !== filterPartner
      )
        return false;
      if (filterContractor !== "all" && p.contractor !== filterContractor)
        return false;

      // Hide finished and archived projects (unless they have complaints)
      const status = (p.status || "").toLowerCase();
      if (status === "finished" || status === "archived") return false;
      if (p.isArchived && (!p.complaints || p.complaints === 0)) return false;

      return true;
    });

    console.log(
      "[Map Debug] Filtered projects:",
      filtered.length,
      filtered.map((p) => p.project + ":" + p.status),
    );

    const features = filtered.map((project) => {
      // Use default coords if missing (while geocoding)
      const lat = project.lat || 51.1657;
      const lng = project.lng || 10.4515;

      const feature = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
        project: project,
      });

      const color = PROJECT_STATUS_COLORS[project.status] || "#64748b";

      if (project.complaints && project.complaints > 0) {
        feature.setStyle(
          new Style({
            text: new Text({
              text: "!",
              font: "900 24px sans-serif",
              fill: new Fill({ color: "#ef4444" }),
              stroke: new Stroke({ color: "#ffffff", width: 3 }),
              offsetY: 0,
            }),
            zIndex: 10,
          }),
        );
      } else {
        feature.setStyle(
          new Style({
            image: new Circle({
              radius: 10,
              fill: new Fill({ color: color }),
              stroke: new Stroke({ color: "#ffffff", width: 2 }),
            }),
          }),
        );
      }
      return feature;
    });

    if (vectorSourceRef.current) {
      vectorSourceRef.current.clear();
      vectorSourceRef.current.addFeatures(features);
    }

    // Force map size update to fix rendering issues on tab switch
    if (map) {
      setTimeout(() => map.updateSize(), 200);
    }
  }, [allProjects, filterSub, filterPartner, filterContractor, map]);

  const closePopup = () => {
    setSelectedProject(null);
    setShowDetails(false);
    if (map) {
      map.getOverlays().getArray()[0]?.setPosition(undefined);
    }
  };

  const getProjectWorkers = (workerIds: string[] | undefined): Worker[] => {
    if (!workerIds) return [];
    return allWorkers.filter((w) => workerIds.includes(w.id));
  };

  const getCompanyByName = (
    name: string | undefined,
    list: Company[],
  ): Company | null => {
    if (!name) return null;
    return list.find((c) => c.name === name) || null;
  };

  // Find nearby scheduled projects for team deployment
  const findNearbyScheduledProjects = (fromProject: Project) => {
    if (!fromProject.lat || !fromProject.lng) return;

    const scheduledProjects = allProjects
      .filter((p) => {
        // Only scheduled projects that are not the current one
        const status = (p.status || "").toLowerCase();
        return (
          status === "scheduled" &&
          p.project !== fromProject.project &&
          p.lat &&
          p.lng
        );
      })
      .map((p) => ({
        ...p,
        distance: haversineDistance(
          fromProject.lat!,
          fromProject.lng!,
          p.lat!,
          p.lng!,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Top 5 closest

    setNearbyProjects(scheduledProjects);
    setShowNearbyProjects(true);

    // Draw lines on map
    if (linesSourceRef.current) {
      linesSourceRef.current.clear();
      console.log(
        "[Lines Debug] Drawing lines from",
        fromProject.project,
        "to",
        scheduledProjects.length,
        "projects",
      );

      const fromCoord = fromLonLat([fromProject.lng!, fromProject.lat!]);

      scheduledProjects.forEach((p) => {
        const toCoord = fromLonLat([p.lng!, p.lat!]);

        // Color based on distance
        let color = "#22c55e"; // Green for < 50km
        if (p.distance > 100) {
          color = "#ef4444"; // Red for > 100km
        } else if (p.distance > 50) {
          color = "#eab308"; // Yellow for 50-100km
        }

        const lineFeature = new Feature({
          geometry: new LineString([fromCoord, toCoord]),
        });

        lineFeature.setStyle(
          new Style({
            stroke: new Stroke({
              color: color,
              width: 3,
              lineDash: [8, 8],
            }),
          }),
        );

        linesSourceRef.current!.addFeature(lineFeature);
        console.log(
          "[Lines Debug] Added line to",
          p.project,
          "distance:",
          p.distance.toFixed(1),
          "km",
        );
      });
    } else {
      console.log("[Lines Debug] linesSourceRef is null!");
    }
  };

  // Clear lines when hiding nearby projects
  const clearDeploymentLines = () => {
    if (linesSourceRef.current) {
      linesSourceRef.current.clear();
    }
    setShowNearbyProjects(false);
  };

  return (
    <div className="relative h-[calc(100vh-140px)] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-40 flex flex-wrap gap-2 liquid-glass p-3 rounded-xl max-w-[90%]">
        <select
          className="h-8 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          value={filterContractor}
          onChange={(e) => setFilterContractor(e.target.value)}
        >
          <option value="all">All Contractors</option>
          {contractors.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="h-8 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}
        >
          <option value="all">All Partners/Mediators</option>
          {partners.map((p) => (
            <option key={p.id || p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className="h-8 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          value={filterSub}
          onChange={(e) => setFilterSub(e.target.value)}
        >
          <option value="all">All Subcontractors</option>
          {subcontractors.map((s) => (
            <option key={s.id || s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        {/* Reset Button */}
        {(filterSub !== "all" ||
          filterPartner !== "all" ||
          filterContractor !== "all") && (
          <button
            onClick={() => {
              setFilterSub("all");
              setFilterPartner("all");
              setFilterContractor("all");
            }}
            className="h-8 px-2 text-xs bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded transition-colors"
            title="Reset Filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {/* Popup */}
      <div ref={popupRef} className="absolute z-50">
        {selectedProject && !showDetails && (
          <div className="liquid-glass rounded-xl p-4 min-w-[240px] transform -translate-x-1/2">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white pr-4">
                {selectedProject.project}
              </h3>
              <button
                onClick={closePopup}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {selectedProject.address}
            </p>
            <div className="flex gap-2 items-center mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    PROJECT_STATUS_COLORS[selectedProject.status] || "#gray",
                }}
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {selectedProject.status}
              </span>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-7 text-xs bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
              >
                View Details
              </Button>
            </div>
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/40 dark:border-t-black/40" />
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {showDetails && selectedProject && (
        <div className="absolute top-4 right-4 w-[420px] max-h-[calc(100%-32px)] liquid-glass rounded-xl overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="bg-black/5 dark:bg-white/5 p-4 shrink-0 border-b border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {selectedProject.project}
                </h2>
                <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                    {selectedProject.address}
                  </span>
                </div>
              </div>
              <button
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Badge
                className="text-xs"
                style={{
                  backgroundColor:
                    PROJECT_STATUS_COLORS[selectedProject.status],
                  color: "white",
                }}
              >
                {selectedProject.status}
              </Badge>
              {selectedProject.amount && (
                <Badge
                  variant="outline"
                  className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                >
                  <Euro className="h-3 w-3 mr-1" />
                  {selectedProject.amount.replace("€ ", "")}
                </Badge>
              )}
              {selectedProject.start && (
                <Badge
                  variant="outline"
                  className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="font-medium">{selectedProject.start}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-5">
            {/* Companies Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Partners & Subcontractors
                </h3>
              </div>

              {/* Company Filter */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter companies..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-4">
                {/* Partner (Parent) */}
                {(!companySearch ||
                  (selectedProject.partner &&
                    selectedProject.partner
                      .toLowerCase()
                      .includes(companySearch.toLowerCase()))) && (
                  <div className="relative">
                    <CompanyCard
                      label="Partner"
                      name={selectedProject.partner}
                      company={getCompanyByName(
                        selectedProject.partner,
                        partners,
                      )}
                      icon={<Users className="h-4 w-4 text-purple-500" />}
                      color="purple"
                    />

                    {/* Mediator (Child) - Connected Visually */}
                    {selectedProject.mediator &&
                      selectedProject.mediator !== "-" &&
                      (!companySearch ||
                        selectedProject.mediator
                          .toLowerCase()
                          .includes(companySearch.toLowerCase())) && (
                        <div className="mt-2 ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700 relative">
                          <div className="absolute -left-[2px] top-6 w-3 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                          <CompanyCard
                            label="Mediator"
                            name={selectedProject.mediator}
                            company={null}
                            icon={
                              <Briefcase className="h-4 w-4 text-green-500" />
                            }
                            color="green"
                          />
                        </div>
                      )}

                    {/* Subcontractor (Child) - Connected Visually */}
                    {selectedProject.sub &&
                      (!companySearch ||
                        selectedProject.sub
                          .toLowerCase()
                          .includes(companySearch.toLowerCase())) && (
                        <div className="mt-2 ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700 relative">
                          <div className="absolute -left-[2px] top-6 w-3 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                          <CompanyCard
                            label="Subcontractor"
                            name={selectedProject.sub}
                            company={getCompanyByName(
                              selectedProject.sub,
                              subcontractors,
                            )}
                            icon={
                              <HardHat className="h-4 w-4 text-orange-500" />
                            }
                            color="orange"
                          />
                        </div>
                      )}
                  </div>
                )}

                {/* Fallback if searching for sub only and not showing partner logic above restricts it? 
                    Actually the above logic nests Sub. If I search for "Sub", I might want to see it even if Partner doesn't match?
                    Revised logic: Show structure if either matches, or flatten. 
                    For simple "working under that partner" visualization, keeping the tree structure is best. 
                    If I search "Sub", and Partner is hidden, the tree looks weird. 
                    I'll keep it simple: Show Partner if matches OR if Sub matches (to keep context).
                */}
              </div>
            </div>

            {/* Workers Section */}
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <HardHat className="h-4 w-4 text-yellow-500" />
                  Assigned Workers (
                  {
                    getProjectWorkers(selectedProject.workers).filter(
                      (w) =>
                        (w.name
                          .toLowerCase()
                          .includes(workerSearch.toLowerCase()) ||
                          w.role
                            .toLowerCase()
                            .includes(workerSearch.toLowerCase())) &&
                        (workerRole === "all" || w.role === workerRole),
                    ).length
                  }
                  )
                </h3>

                {/* Workers Filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search workers..."
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <select
                    value={workerRole}
                    onChange={(e) => setWorkerRole(e.target.value)}
                    className="pl-2 pr-6 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-yellow-500 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Roles</option>
                    <option value="Electrician">Electrician</option>
                    <option value="S/H/K">S/H/K</option>
                    <option value="Cooling Technician">Cooling</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {getProjectWorkers(selectedProject.workers).filter(
                  (w) =>
                    (w.name
                      .toLowerCase()
                      .includes(workerSearch.toLowerCase()) ||
                      w.role
                        .toLowerCase()
                        .includes(workerSearch.toLowerCase())) &&
                    (workerRole === "all" || w.role === workerRole),
                ).length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    No workers found matching criteria
                  </p>
                ) : (
                  getProjectWorkers(selectedProject.workers)
                    .filter(
                      (w) =>
                        (w.name
                          .toLowerCase()
                          .includes(workerSearch.toLowerCase()) ||
                          w.role
                            .toLowerCase()
                            .includes(workerSearch.toLowerCase())) &&
                        (workerRole === "all" || w.role === workerRole),
                    )
                    .map((worker) => (
                      <div
                        key={worker.id}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border flex items-center justify-center overflow-hidden shrink-0">
                              {worker.avatarSeed ? (
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.avatarSeed}`}
                                  alt={worker.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                  {worker.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {worker.name}
                                </p>
                                {worker.status && (
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      worker.status === "Active"
                                        ? "bg-green-500"
                                        : worker.status === "Blocked"
                                          ? "bg-red-500"
                                          : "bg-gray-400"
                                    }`}
                                    title={worker.status}
                                  />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                {worker.role}
                              </p>
                              {worker.subRole && (
                                <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                                  {worker.subRole}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 px-1.5 ${
                                worker.successRate && worker.successRate >= 95
                                  ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20"
                                  : "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
                              }`}
                            >
                              {worker.successRate}% Success
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-white dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-widest font-semibold">
                              Stats
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="text-xs text-gray-700 dark:text-gray-300"
                                title="Completed Projects"
                              >
                                <span className="font-bold">
                                  {worker.completedProjects || 0}
                                </span>{" "}
                                done
                              </div>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-widest font-semibold">
                              Compliance
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span
                                className={`text-[10px] px-1 rounded border ${
                                  worker.a1Status === "Valid"
                                    ? "border-green-200 text-green-700 bg-green-50"
                                    : "border-gray-200 text-gray-400 bg-gray-50"
                                }`}
                              >
                                A1: {worker.a1Status || "N/A"}
                              </span>
                              <span
                                className={`text-[10px] px-1 rounded border ${
                                  worker.certStatus === "Valid" &&
                                  worker.certFiles &&
                                  worker.certFiles.length > 0
                                    ? "border-green-200 text-green-700 bg-green-50"
                                    : "border-gray-200 text-gray-400 bg-gray-50"
                                }`}
                              >
                                Cert:{" "}
                                {worker.certStatus === "Valid" &&
                                worker.certFiles &&
                                worker.certFiles.length > 0
                                  ? "Available"
                                  : "Missing"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(worker.phone || worker.email) && (
                          <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                            {worker.phone && (
                              <a
                                href={`https://wa.me/${worker.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                WhatsApp
                              </a>
                            )}
                            {worker.email && (
                              <a
                                href={`mailto:${worker.email}`}
                                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                              >
                                <Mail className="h-3 w-3" />
                                Email
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/30 shrink-0 space-y-2">
            {/* Deploy Team Button - Only show for In Progress projects */}
            {(selectedProject.status === "In Progress" ||
              selectedProject.status === "in progress" ||
              selectedProject.status === "Active" ||
              selectedProject.status === "active") && (
              <Button
                size="sm"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                onClick={() => findNearbyScheduledProjects(selectedProject)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Find Next Job for Team
              </Button>
            )}

            {/* Nearby Projects Panel */}
            {showNearbyProjects && nearbyProjects.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-green-500" />
                    Nearby Scheduled Projects
                  </h4>
                  <button
                    onClick={() => clearDeploymentLines()}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nearbyProjects.map((project) => (
                    <div
                      key={project.project}
                      className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 hover:border-green-400 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {project.project}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {project.address}
                          </p>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            {project.scheduledStart || "No Date"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ml-2 ${
                            project.distance < 50
                              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200"
                              : project.distance < 100
                                ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200"
                                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200"
                          }`}
                        >
                          {formatDistance(project.distance)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-[10px]"
                          onClick={() => {
                            setSelectedProject(project);
                            clearDeploymentLines();
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-[10px] bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                          disabled={assigningTeam === project.project}
                          onClick={async () => {
                            if (!selectedProject) return;
                            setAssigningTeam(project.project);

                            // Get workers from current (finished) project
                            const workersToAssign =
                              selectedProject.workers || [];

                            if (workersToAssign.length === 0) {
                              alert("No workers to assign from this project.");
                              setAssigningTeam(null);
                              return;
                            }

                            try {
                              const supabase = createClient();

                              // 1. Assign workers
                              for (const workerId of workersToAssign) {
                                if (project.id) {
                                  await supabase.from("project_workers").upsert(
                                    {
                                      project_id: project.id,
                                      worker_id: workerId,
                                    },
                                    { onConflict: "project_id,worker_id" },
                                  );
                                }
                              }

                              // 2. Transfer Subcontractor and Mediator
                              if (project.id && selectedProject.subId) {
                                const payload: any = {
                                  subcontractor_id: selectedProject.subId,
                                };
                                if (selectedProject.mediatorId) {
                                  payload.broker_id =
                                    selectedProject.mediatorId;
                                }

                                const { error: updateError } = await supabase
                                  .from("projects")
                                  .update(payload)
                                  .eq("id", project.id);

                                if (updateError) {
                                  console.error(
                                    "Error transferring sub/mediator:",
                                    updateError,
                                  );
                                } else {
                                  console.log(
                                    "Transferred sub/mediator to:",
                                    project.project,
                                  );
                                  // Optimistic UI update could go here but forcing reload easiest or relying on existing state
                                }
                              }

                              alert(
                                `Successfully assigned ${workersToAssign.length} worker(s) and transferred Subcontractor/Mediator to ${project.project}`,
                              );
                              clearDeploymentLines();
                            } catch (error) {
                              console.error("Error assigning workers:", error);
                              alert(
                                "Failed to assign workers. Please try again.",
                              );
                            } finally {
                              setAssigningTeam(null);
                            }
                          }}
                        >
                          {assigningTeam === project.project
                            ? "Assigning..."
                            : "Assign Team"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setShowDetails(false);
                clearDeploymentLines();
              }}
            >
              Back to Map
            </Button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
          Status Legend
        </h4>
        <div className="space-y-1.5">
          {Object.entries(PROJECT_STATUS_COLORS).map(([status, color]) => {
            if (status === "Finished") return null;
            return (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {status}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 flex items-center justify-center">
              <span className="text-red-500 font-black text-sm">!</span>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Complaints
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Company Card Component
function CompanyCard({
  label,
  name,
  company,
  icon,
  color,
}: {
  label: string;
  name: string | undefined;
  company: Company | null;
  icon: React.ReactNode;
  color: string;
}) {
  if (!name || name === "-") return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            {label}
          </span>
        </div>
        {company && (
          <Badge
            className={`text-[10px] px-1.5 h-5 font-semibold ${
              company.status === "Active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200"
                : company.status === "Blocked"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200"
            }`}
          >
            {company.status || "Active"}
          </Badge>
        )}
      </div>

      <div className="mb-2">
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {name}
        </p>

        {company && company.rating && (
          <div className="flex items-center gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3 h-3 ${
                  star <= Math.round(company.rating || 0)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300 fill-current"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
            <span className="text-xs text-gray-500 ml-1">
              ({company.rating})
            </span>
          </div>
        )}
      </div>

      {company && (
        <>
          <div className="flex gap-2 mb-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
            <div className="flex items-center gap-1" title="Active Projects">
              <Building2 className="h-3 w-3 text-gray-500" />
              <span>{company.activeProjects || 1} Proj.</span>
            </div>
            {company.complaints !== undefined && (
              <div className="flex items-center gap-1" title="Complaints">
                <span
                  className={
                    company.complaints > 0 ? "text-red-500 font-bold" : ""
                  }
                >
                  {company.complaints} Issues
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline truncate"
              >
                <Mail className="h-3 w-3 shrink-0" />
                {company.email}
              </a>
            )}
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline truncate"
              >
                <Phone className="h-3 w-3 shrink-0" />
                {company.phone}
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
