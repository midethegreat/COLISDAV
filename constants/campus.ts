import { CampusLocation } from "@/types";

export const CAMPUS_CENTER = {
  latitude: 7.22365,
  longitude: 3.43558,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const FUNAAB_BOUNDS = {
  northEast: { latitude: 7.231106284322777, longitude: 3.438265524570699 }, // Calculated max points + padding
  southWest: { latitude: 7.2274, longitude: 3.4319 }, // Calculated min points - padding
};

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: "1",
    name: "Nimbe Adedipe Library",
    latitude: 7.230748427569003,
    longitude: 3.4366291925490433,
  },
  {
    id: "2",
    name: "College of Engineering (COLENG)",
    latitude: 7.23004,
    longitude: 3.43472,
  },
  {
    id: "3",
    name: "Senate Building",
    latitude: 7.2310352390995245,
    longitude: 3.438221012507257,
  },
  {
    id: "4",
    name: "Mancot Bus Stop",
    latitude: 7.2300935346009965,
    longitude: 3.4360375739684685,
  },
  { id: "5", name: "COLANIM", latitude: 7.23209, longitude: 3.43701 },
  {
    id: "6",
    name: "COLVET",
    latitude: 7.234357918069535,
    longitude: 3.4384678773463917,
  },
  { id: "7", name: "COLNAS", latitude: 7.22921, longitude: 3.43677 },
  {
    id: "8",
    name: "Anenih Lecture Hall",
    latitude: 7.227319960103526,
    longitude: 3.437406974094178,
  },
  { id: "9", name: "Umar kabir hostel", latitude: 7.23347, longitude: 3.43347 },
  {
    id: "10",
    name: "Iyat Hostel",
    latitude: 7.23212,
    longitude: 3.43297,
  },
  { id: "11", name: "FUNAAB Zoo", latitude: 7.2316, longitude: 3.4339 },
  { id: "12", name: "IFSERAR", latitude: 7.2279, longitude: 3.4345 },
  {
    id: "13",
    name: "Directorate of ICT (DICT)",
    latitude: 7.2304,
    longitude: 3.4362,
  },
  {
    id: "14",
    name: "FUNAAB Health Centre",
    latitude: 7.228688002165256,
    longitude: 3.4411214536851347,
  },
  {
    id: "15",
    name: "Sports Complex",
    latitude: 7.229862580402424,
    longitude: 3.442546885129324,
  },
];

export const CAMPUS_NAME = "FUNAAB";
export const APP_NAME = "CID Nigeria";
export const APP_TAGLINE = "Campus commuting, safer and faster.";
