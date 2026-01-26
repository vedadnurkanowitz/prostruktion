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
import { fromLonLat } from "ol/proj";
import { Style, Circle, Fill, Stroke } from "ol/style";
import Overlay from "ol/Overlay";

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
  status: string;
  statusColor: string;
  contractor?: string;
  sub?: string;
  partner?: string;
  mediator?: string;
  amount?: string;
  start?: string;
  workers?: string[];
  lat?: number;
  lng?: number;
};

// Default workers for demo
const DEFAULT_WORKERS: Worker[] = [
  {
    id: "w1",
    name: "John Doe",
    role: "Electrician",
    subRole: "Senior Electrician",
    subcontractor: "Sub Y",
    status: "Active",
    a1Status: "Valid",
    certStatus: "Valid",
    successRate: 100,
    complaints: 0,
    completedProjects: 45,
    activeProjects: 1,
    phone: "+49 171 1234567",
    email: "john@example.com",
    avatarSeed: "John",
  },
  {
    id: "w2",
    name: "Jane Smith",
    role: "S/H/K",
    subRole: "HVAC Specialist",
    subcontractor: "Sub Y",
    status: "Active",
    a1Status: "Valid",
    certStatus: "Expiring Soon",
    successRate: 98,
    complaints: 1,
    completedProjects: 28,
    activeProjects: 2,
    phone: "+49 172 2345678",
    email: "jane@example.com",
    avatarSeed: "Jane",
  },
  {
    id: "w3",
    name: "Bob Johnson",
    role: "Cooling Technician",
    subRole: "Assistant",
    subcontractor: "Sub Z",
    status: "Active",
    a1Status: "Valid",
    certStatus: "Valid",
    successRate: 100,
    complaints: 0,
    completedProjects: 12,
    activeProjects: 1,
    phone: "+49 173 3456789",
    email: "bob@example.com",
    avatarSeed: "Bob",
  },
  {
    id: "w4",
    name: "Alice Brown",
    role: "S/H/K",
    subRole: "Plumber",
    subcontractor: "Sub Y",
    status: "On Leave",
    a1Status: "Expired",
    certStatus: "Valid",
    successRate: 92,
    complaints: 2,
    completedProjects: 34,
    activeProjects: 0,
    phone: "+49 174 4567890",
    email: "alice@example.com",
    avatarSeed: "Alice",
  },
  {
    id: "w5",
    name: "Mike Davis",
    role: "Electrician",
    subRole: "Wiring Expert",
    subcontractor: "Sub Z",
    status: "Blocked",
    a1Status: "Expired",
    certStatus: "Expired",
    successRate: 86,
    complaints: 4,
    completedProjects: 15,
    activeProjects: 0,
    phone: "+49 175 5678901",
    email: "mike@example.com",
    avatarSeed: "Mike",
  },
  {
    id: "w6",
    name: "Tom Wilson",
    role: "S/H/K",
    subRole: "Pipe Fitter",
    subcontractor: "Sub Alpha",
    status: "Active",
    a1Status: "Expired",
    certStatus: "Valid",
    successRate: 98,
    complaints: 1,
    completedProjects: 22,
    activeProjects: 1,
    phone: "+49 176 6789012",
    email: "tom@example.com",
    avatarSeed: "Tom",
  },
  {
    id: "w7",
    name: "Sarah Lee",
    role: "Cooling Technician",
    subRole: "Maintenance",
    subcontractor: "Sub Alpha",
    status: "Active",
    a1Status: "Valid",
    certStatus: "Valid",
    successRate: 100,
    complaints: 0,
    completedProjects: 8,
    activeProjects: 1,
    phone: "+49 177 7890123",
    email: "sarah@example.com",
    avatarSeed: "Sarah",
  },
  {
    id: "w8",
    name: "David Miller",
    role: "Electrician",
    subRole: "General",
    subcontractor: "Partner Beta",
    status: "Active",
    a1Status: "Valid",
    certStatus: "None",
    successRate: 99,
    complaints: 0,
    completedProjects: 56,
    activeProjects: 2,
    phone: "+49 178 8901234",
    email: "david@example.com",
    avatarSeed: "David",
  },
  {
    id: "w9",
    name: "Emily Clark",
    role: "S/H/K",
    subRole: "Sanitary",
    subcontractor: "ConstructCo",
    status: "Active",
    a1Status: "Valid",
    certStatus: "Valid",
    successRate: 100,
    complaints: 0,
    completedProjects: 19,
    activeProjects: 1,
    phone: "+49 179 9012345",
    email: "emily@example.com",
    avatarSeed: "Emily",
  },
  {
    id: "w10",
    name: "James White",
    role: "Cooling Technician",
    subRole: "Systems",
    subcontractor: "ConstructCo",
    status: "Inactive",
    a1Status: "Expired",
    certStatus: "Expired",
    successRate: 95,
    complaints: 1,
    completedProjects: 14,
    activeProjects: 0,
    phone: "+49 170 0123456",
    email: "james@example.com",
    avatarSeed: "James",
  },
];

const getRandomInRange = (from: number, to: number, fixed: number) => {
  return parseFloat((Math.random() * (to - from) + from).toFixed(fixed));
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  Scheduled: "#9333ea",
  "In Progress": "#f97316",
  "In Abnahme": "#eab308",
  Finished: "#16a34a",
};

export default function ProjectMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<OLMap | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Data from localStorage
  const [allWorkers, setAllWorkers] = useState<Worker[]>(DEFAULT_WORKERS);
  const [subcontractors, setSubcontractors] = useState<Company[]>([]);
  const [contractors, setContractors] = useState<Company[]>([]);
  const [partners, setPartners] = useState<Company[]>([]);

  // Load companies and workers from localStorage
  useEffect(() => {
    // Load Subcontractors
    try {
      const storedSubs = localStorage.getItem("prostruktion_subcontractors");
      if (storedSubs) {
        const parsed = JSON.parse(storedSubs);
        setSubcontractors(parsed);
      }
    } catch (e) {
      console.error("Error loading subcontractors", e);
    }

    // Load Contractors
    try {
      const storedContractors = localStorage.getItem(
        "prostruktion_contractors",
      );
      if (storedContractors) {
        const parsed = JSON.parse(storedContractors);
        setContractors(parsed);
      }
    } catch (e) {
      console.error("Error loading contractors", e);
    }

    // Load Partners
    try {
      const storedPartners = localStorage.getItem("prostruktion_partners");
      if (storedPartners) {
        const parsed = JSON.parse(storedPartners);
        setPartners(parsed);
      }
    } catch (e) {
      console.error("Error loading partners", e);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    let projects: Project[] = [];
    const storedProjects = localStorage.getItem("prostruktion_projects_v1");
    if (storedProjects) {
      try {
        let parsed: Project[] = JSON.parse(storedProjects);
        parsed = parsed.map((p) => {
          if (!p.lat || !p.lng) {
            return {
              ...p,
              lat: getRandomInRange(50.5, 53.5, 5),
              lng: getRandomInRange(9.0, 13.5, 5),
            };
          }
          return p;
        });
        projects = parsed;
      } catch (e) {
        console.error("Error parsing projects for map", e);
      }
    }

    const features = projects.map((project) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([project.lng!, project.lat!])),
        project: project,
      });

      const color = PROJECT_STATUS_COLORS[project.status] || "#64748b";
      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 10,
            fill: new Fill({ color: color }),
            stroke: new Stroke({ color: "#ffffff", width: 2 }),
          }),
        }),
      );

      return feature;
    });

    const vectorSource = new VectorSource({ features });
    const vectorLayer = new VectorLayer({ source: vectorSource });

    const popup = new Overlay({
      element: popupRef.current!,
      positioning: "bottom-center",
      stopEvent: true,
      offset: [0, -15],
    });

    const olMap = new OLMap({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({
        center: fromLonLat([10.4515, 51.1657]),
        zoom: 6,
      }),
      overlays: [popup],
    });

    olMap.on("click", (evt) => {
      const feature = olMap.forEachFeatureAtPixel(evt.pixel, (f) => f);
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

    olMap.on("pointermove", (evt) => {
      const hit = olMap.hasFeatureAtPixel(evt.pixel);
      olMap.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    setMap(olMap);

    return () => {
      olMap.setTarget(undefined);
    };
  }, []);

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

  return (
    <div className="relative h-[calc(100vh-140px)] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
      <div ref={mapRef} className="w-full h-full" />

      {/* Popup */}
      <div ref={popupRef} className="absolute z-50">
        {selectedProject && !showDetails && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[240px] transform -translate-x-1/2">
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
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-900" />
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {showDetails && selectedProject && (
        <div className="absolute top-4 right-4 w-[420px] max-h-[calc(100%-32px)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-4 shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">
                  {selectedProject.project}
                </h2>
                <p className="text-xs text-gray-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedProject.address}
                </p>
              </div>
              <button
                onClick={closePopup}
                className="text-gray-400 hover:text-white transition-colors"
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
                  className="text-xs text-gray-300 border-gray-600"
                >
                  <Euro className="h-3 w-3 mr-1" />
                  {selectedProject.amount.replace("€ ", "")}
                </Badge>
              )}
              {selectedProject.start && (
                <Badge
                  variant="outline"
                  className="text-xs text-gray-300 border-gray-600"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {selectedProject.start}
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-5">
            {/* Companies Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                Companies Involved
              </h3>
              <div className="space-y-3">
                {/* Contractor */}
                <CompanyCard
                  label="Contractor"
                  name={selectedProject.contractor}
                  company={getCompanyByName(
                    selectedProject.contractor,
                    contractors,
                  )}
                  icon={<Building2 className="h-4 w-4 text-blue-500" />}
                  color="blue"
                />
                {/* Subcontractor */}
                <CompanyCard
                  label="Subcontractor"
                  name={selectedProject.sub}
                  company={getCompanyByName(
                    selectedProject.sub,
                    subcontractors,
                  )}
                  icon={<HardHat className="h-4 w-4 text-orange-500" />}
                  color="orange"
                />
                {/* Partner */}
                <CompanyCard
                  label="Partner"
                  name={selectedProject.partner}
                  company={getCompanyByName(selectedProject.partner, partners)}
                  icon={<Users className="h-4 w-4 text-purple-500" />}
                  color="purple"
                />
                {/* Mediator */}
                {selectedProject.mediator &&
                  selectedProject.mediator !== "-" && (
                    <CompanyCard
                      label="Mediator"
                      name={selectedProject.mediator}
                      company={null}
                      icon={<Briefcase className="h-4 w-4 text-green-500" />}
                      color="green"
                    />
                  )}
              </div>
            </div>

            {/* Workers Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <HardHat className="h-4 w-4 text-yellow-500" />
                Assigned Workers (
                {getProjectWorkers(selectedProject.workers).length})
              </h3>
              <div className="space-y-3">
                {getProjectWorkers(selectedProject.workers).length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    No workers assigned to this project
                  </p>
                ) : (
                  getProjectWorkers(selectedProject.workers).map((worker) => (
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
                              <div className="text-xs font-bold text-gray-500">
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
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
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
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
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
                            <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                            <div
                              className={`text-xs ${
                                (worker.complaints || 0) > 0
                                  ? "text-red-500 font-bold"
                                  : "text-gray-500"
                              }`}
                              title="Complaints"
                            >
                              {worker.complaints || 0} issues
                            </div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-800">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                            Compliance
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span
                              className={`text-[10px] px-1 rounded border ${
                                worker.a1Status === "Valid"
                                  ? "border-green-200 text-green-700 bg-green-50"
                                  : "border-red-200 text-red-700 bg-red-50"
                              }`}
                            >
                              A1: {worker.a1Status || "N/A"}
                            </span>
                            {worker.certStatus && (
                              <span
                                className={`text-[10px] px-1 rounded border ${
                                  worker.certStatus === "Valid"
                                    ? "border-green-200 text-green-700 bg-green-50"
                                    : "border-yellow-200 text-yellow-700 bg-yellow-50"
                                }`}
                              >
                                Cert: {worker.certStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {(worker.phone || worker.email) && (
                        <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {worker.phone && (
                            <a
                              href={`tel:${worker.phone}`}
                              className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              Call
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
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/30 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowDetails(false)}
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
          {Object.entries(PROJECT_STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {status}
              </span>
            </div>
          ))}
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
            className={`text-[10px] px-1.5 h-5 ${
              company.status === "Active"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                : company.status === "Blocked"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200"
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
          <div className="flex gap-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1" title="Active Projects">
              <Building2 className="h-3 w-3" />
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
