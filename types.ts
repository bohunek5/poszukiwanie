
export interface Source {
  uri: string;
  title?: string;
}

export interface Lead {
  id: string;
  name: string;
  nip: string;
  industry: string;
  location: string;
  justification: string;
  recommendedProducts: string[];
  salesTip: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  sources?: Source[];
}

export interface SearchFilters {
  region: string;
  industryTypes: string[];
  limit: number;
}

export enum IndustryType {
  Wholesalers = 'Hurtownie i Sklepy Elektryczne',
  LED = 'Klasyczna branża LED',
  POS = 'POS / reklama / ekspozycja',
  Furniture = 'Meble / wnętrza',
  Marine = 'Branża szkutnicza i specjalistyczna',
  OEM = 'Producenci / OEM',
  Developers = 'Deweloperzy i Inwestycje',
  SmartHome = 'Smart Home i Automatyka',
  HoReCa = 'Hotele i Restauracje',
  Retail = 'Retail i Visual Merchandising',
  Landscape = 'Architektura Krajobrazu',
  Automotive = 'Auto Detailing i Warsztaty Premium',
  Medical = 'Placówki Medyczne i Estetyczne',
  Fitness = 'Fitness i Wellness',
  Offices = 'Biura i Coworking'
}

export const REGIONS = [
  'Cała Polska',
  'Dolnośląskie',
  'Kujawsko-pomorskie',
  'Lubelskie',
  'Lubuskie',
  'Łódzkie',
  'Małopolskie',
  'Mazowieckie',
  'Opolskie',
  'Podkarpackie',
  'Podlaskie',
  'Pomorskie',
  'Śląskie',
  'Świętokrzyskie',
  'Warmińsko-mazurskie',
  'Wielkopolskie',
  'Zachodniopomorskie'
];
