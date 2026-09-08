// Auto API — /api/v1/auto/*
import apiClient from './client';
import type {
  PaginatedResponse,
  AutoListing,
  AutoListingSummary,
  AutoPart,
  AutoPartSummary,
  AutoAccessorySummary,
  AutoRental,
  AutoRentalSummary,
  RentalBooking,
} from '@/types';

export interface AutoFilters {
  page?: number;
  make?: string;
  model?: string;
  year_from?: number;
  year_to?: number;
  fuel_type?: string;
  transmission?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  location?: string;
}

export const SEED_AUTO_LISTINGS: AutoListing[] = [
  {
    id: 'auto-mercedes-g63-2024',
    make: 'Mercedes-Benz',
    model: 'G 63 AMG BiTurbo',
    year: 2024,
    price: '295000000.00',
    mileage: 2400,
    transmission: 'AUTOMATIC',
    fuel_type: 'PETROL',
    condition: 'NEW',
    location: 'Victoria Island, Lagos',
    primary_image_url: 'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=800&q=80',
    seller: {
      id: 'ven-prestige-motors',
      name: 'Prestige Motors Victoria Island',
      logo_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      review_count: 38,
      location: 'Victoria Island, Lagos',
      slug: 'prestige-motors',
    },
    is_favorited: false,
    description: 'Brand new 2024 Mercedes-AMG G 63 SUV with 4.0L V8 BiTurbo engine, Obsidian Black metallic exterior, Designo Bengal Red Nappa leather interior, Burmester 3D Surround Sound, Night Package, and AMG forged 22-inch wheels. Fully cleared with genuine Nigeria customs papers and Escrow purchase protection.',
    color: 'Obsidian Black',
    engine_size: '4.0L V8 BiTurbo (577 hp)',
    body_type: 'SUV',
    vin: 'WDB4632761X998821',
    images: [
      { id: 'img-g63-1', url: 'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=800&q=80', alt_text: 'Mercedes G63 Front Profile', is_primary: true },
      { id: 'img-g63-2', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', alt_text: 'Mercedes G63 Side', is_primary: false },
    ],
    features: ['Burmester 3D Sound', 'Night Package', 'Carbon Fiber Trim', '22-inch Forged Wheels', '360 Camera', 'Heated & Ventilated Seats', 'Active Lane Keeping Assist'],
    average_rating: 4.9,
    review_count: 14,
    similar_listings: [],
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'auto-toyota-lc300-2023',
    make: 'Toyota',
    model: 'Land Cruiser 300 VXR',
    year: 2023,
    price: '185000000.00',
    mileage: 11500,
    transmission: 'AUTOMATIC',
    fuel_type: 'PETROL',
    condition: 'USED',
    location: 'Maitama, Abuja',
    primary_image_url: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80',
    seller: {
      id: 'ven-capital-autos',
      name: 'Capital City Automotive',
      logo_url: null,
      rating: 4.8,
      review_count: 52,
      location: 'Maitama, Abuja',
      slug: 'capital-autos',
    },
    is_favorited: false,
    description: '2023 Toyota Land Cruiser 300 VXR twin-turbo V6. Pristine foreign-used condition with full service history. Premium leather interior with dual rear entertainment screens, crawl control, and cool box.',
    color: 'Pearl White',
    engine_size: '3.5L Twin-Turbo V6',
    body_type: 'SUV',
    vin: 'JTMCY7AJ804001923',
    images: [
      { id: 'img-lc300-1', url: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80', alt_text: 'Toyota LC300 Front', is_primary: true },
    ],
    features: ['Cool Box', 'Rear Seat Entertainment', 'Multi-Terrain Select', 'JBL Synthesis Audio', 'Sunroof', 'Adaptive Cruise Control'],
    average_rating: 4.8,
    review_count: 9,
    similar_listings: [],
    created_at: '2026-08-10T14:30:00Z',
  },
  {
    id: 'auto-lexus-rx350-2022',
    make: 'Lexus',
    model: 'RX 350 F-Sport',
    year: 2022,
    price: '68000000.00',
    mileage: 28000,
    transmission: 'AUTOMATIC',
    fuel_type: 'PETROL',
    condition: 'USED',
    location: 'Lekki Phase 1, Lagos',
    primary_image_url: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=800&q=80',
    seller: {
      id: 'ven-lekki-luxury',
      name: 'Lekki Luxury Cars',
      logo_url: null,
      rating: 4.7,
      review_count: 24,
      location: 'Lekki Phase 1, Lagos',
      slug: 'lekki-luxury',
    },
    is_favorited: true,
    description: 'Extremely clean 2022 Lexus RX 350 F-Sport Package. Panoramic roof, red sport interior, head-up display, and Mark Levinson sound system. Fully serviced and accident free.',
    color: 'Atomic Silver',
    engine_size: '3.5L V6',
    body_type: 'Crossover',
    vin: '2T2BZMCA7NC019842',
    images: [
      { id: 'img-rx350-1', url: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=800&q=80', alt_text: 'Lexus RX 350 Front', is_primary: true },
    ],
    features: ['Mark Levinson Audio', 'F-Sport Package', 'Head-Up Display', 'Panoramic Roof', 'Apple CarPlay'],
    average_rating: 4.7,
    review_count: 11,
    similar_listings: [],
    created_at: '2026-08-15T11:00:00Z',
  },
];

export const SEED_AUTO_PARTS: AutoPart[] = [
  {
    id: 'part-brembo-ceramic-pads',
    name: 'Brembo Front Ceramic Brake Pads (Set)',
    part_number: 'P83082N',
    part_type: 'OEM',
    condition: 'NEW',
    price: '85000.00',
    stock_quantity: 18,
    primary_image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    vendor: {
      id: 'ven-autofix-autoparts',
      name: 'AutoFix Global Spares',
      logo_url: null,
      rating: 4.9,
      review_count: 67,
      location: 'Ladipo Market, Lagos',
      slug: 'autofix-spares',
    },
    compatible_vehicles: [
      { make: 'Toyota', model: 'Land Cruiser', year_from: 2016, year_to: 2024 },
      { make: 'Lexus', model: 'LX 570', year_from: 2016, year_to: 2021 },
    ],
    description: 'Genuine Brembo ceramic brake pads engineered to deliver quiet braking, low rotor wear, and virtually zero brake dust. Direct replacement for OEM fitment.',
    images: [
      { id: 'img-part-1', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80', alt_text: 'Brembo Brake Pads', is_primary: true },
    ],
    created_at: '2026-08-05T09:00:00Z',
  },
  {
    id: 'part-bosch-alternator-150a',
    name: 'Bosch High-Output Alternator 150A',
    part_number: 'AL0844N',
    part_type: 'OEM',
    condition: 'NEW',
    price: '145000.00',
    stock_quantity: 8,
    primary_image_url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80',
    vendor: {
      id: 'ven-autofix-autoparts',
      name: 'AutoFix Global Spares',
      logo_url: null,
      rating: 4.9,
      review_count: 67,
      location: 'Ladipo Market, Lagos',
      slug: 'autofix-spares',
    },
    compatible_vehicles: [
      { make: 'Toyota', model: 'Camry', year_from: 2018, year_to: 2023 },
      { make: 'Toyota', model: 'RAV4', year_from: 2019, year_to: 2024 },
    ],
    description: 'Heavy duty 150 Amp Bosch alternator with precision voltage regulation. Ensures stable electrical power under high accessory load.',
    images: [
      { id: 'img-part-2', url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80', alt_text: 'Bosch Alternator', is_primary: true },
    ],
    created_at: '2026-08-08T12:00:00Z',
  },
];

export const SEED_AUTO_ACCESSORIES: AutoAccessorySummary[] = [
  {
    id: 'acc-70mai-4k-dashcam',
    name: '70mai 4K Dual Dashcam with Night Vision & GPS',
    sub_category: 'Electronics & Gadgets',
    price: '92000.00',
    stock_quantity: 25,
    primary_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    vendor: {
      id: 'ven-gadget-hub',
      name: 'Gadget Express Auto',
      logo_url: null,
      rating: 4.9,
      review_count: 45,
      location: 'Ikeja, Lagos',
      slug: 'gadget-express',
    },
  },
  {
    id: 'acc-all-weather-mats-3d',
    name: 'Custom 3D All-Weather Floor Liner Mats',
    sub_category: 'Interior Accessories',
    price: '48000.00',
    stock_quantity: 30,
    primary_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    vendor: {
      id: 'ven-gadget-hub',
      name: 'Gadget Express Auto',
      logo_url: null,
      rating: 4.9,
      review_count: 45,
      location: 'Ikeja, Lagos',
      slug: 'gadget-express',
    },
  },
];

export const SEED_AUTO_RENTALS: AutoRental[] = [
  {
    id: 'rental-range-rover-2024',
    make: 'Land Rover',
    model: 'Range Rover Autobiography',
    year: 2024,
    daily_rate: '250000.00',
    weekly_rate: '1500000.00',
    pickup_location: 'Victoria Island, Lagos (Airport Delivery Available)',
    return_location: 'Victoria Island, Lagos',
    primary_image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    vendor: {
      id: 'ven-vip-car-rental',
      name: 'Executive Escort & Chauffeur Services',
      logo_url: null,
      rating: 5.0,
      review_count: 42,
      location: 'Victoria Island, Lagos',
      slug: 'executive-chauffeur',
    },
    description: 'Chauffeur-driven or self-drive luxury Range Rover Autobiography. Fully air-conditioned, executive leather seating, executive security detail option available upon request.',
    images: [
      { id: 'img-rent-1', url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80', alt_text: 'Range Rover Autobiography', is_primary: true },
    ],
    security_deposit: '500000.00',
    available_from: '2026-09-01',
    available_to: '2026-12-31',
    minimum_days: 1,
    maximum_days: 30,
  },
  {
    id: 'rental-toyota-hilux-2023',
    make: 'Toyota',
    model: 'Hilux Adventure 4x4 Double Cabin',
    year: 2023,
    daily_rate: '95000.00',
    weekly_rate: '550000.00',
    pickup_location: 'Central Business District, Abuja',
    return_location: 'Central Business District, Abuja',
    primary_image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    vendor: {
      id: 'ven-safari-rentals',
      name: 'Sahara Fleet Solutions',
      logo_url: null,
      rating: 4.8,
      review_count: 29,
      location: 'Abuja, FCT',
      slug: 'sahara-fleet',
    },
    description: 'Rugged 4x4 Toyota Hilux Double Cabin, ideal for corporate project travel, terrain inspections, and state tours across Nigeria. Available with professional certified drivers.',
    images: [
      { id: 'img-rent-2', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', alt_text: 'Toyota Hilux 4x4', is_primary: true },
    ],
    security_deposit: '150000.00',
    available_from: '2026-09-01',
    available_to: '2026-12-31',
    minimum_days: 1,
    maximum_days: 60,
  },
];

export const autoApi = {
  listListings: async (filters?: AutoFilters): Promise<PaginatedResponse<AutoListingSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/listings/', { params: filters });
      return data;
    } catch {
      let results = [...SEED_AUTO_LISTINGS];
      if (filters?.make) {
        results = results.filter(l => l.make.toLowerCase().includes(filters.make!.toLowerCase()));
      }
      if (filters?.model) {
        results = results.filter(l => l.model.toLowerCase().includes(filters.model!.toLowerCase()));
      }
      if (filters?.condition) {
        results = results.filter(l => l.condition.toLowerCase() === filters.condition!.toLowerCase());
      }
      if (filters?.min_price) {
        results = results.filter(l => parseFloat(l.price) >= filters.min_price!);
      }
      if (filters?.max_price) {
        results = results.filter(l => parseFloat(l.price) <= filters.max_price!);
      }
      return {
        count: results.length,
        next: null,
        previous: null,
        results,
      };
    }
  },

  getListing: async (id: string): Promise<AutoListing> => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/listings/${id}/`);
      return data;
    } catch {
      const found = SEED_AUTO_LISTINGS.find(l => l.id === id) || SEED_AUTO_LISTINGS[0];
      return found;
    }
  },

  listParts: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<AutoPartSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/parts/', { params: filters });
      return data;
    } catch {
      return {
        count: SEED_AUTO_PARTS.length,
        next: null,
        previous: null,
        results: SEED_AUTO_PARTS,
      };
    }
  },

  getPart: async (id: string): Promise<AutoPart> => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/parts/${id}/`);
      return data;
    } catch {
      return SEED_AUTO_PARTS.find(p => p.id === id) || SEED_AUTO_PARTS[0];
    }
  },

  listAccessories: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<AutoAccessorySummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/accessories/', { params: filters });
      return data;
    } catch {
      return {
        count: SEED_AUTO_ACCESSORIES.length,
        next: null,
        previous: null,
        results: SEED_AUTO_ACCESSORIES,
      };
    }
  },

  getAccessory: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/accessories/${id}/`);
      return data;
    } catch {
      const found = SEED_AUTO_ACCESSORIES.find(a => a.id === id) || SEED_AUTO_ACCESSORIES[0];
      return {
        ...found,
        description: `Premium grade ${found.name}. Engineered for durability, superior performance, and seamless vehicle integration. Complete with installation guide and manufacturer warranty.`,
        images: [
          { id: 'img-acc-1', url: found.primary_image_url || '', alt_text: found.name, is_primary: true },
        ],
        features: ['Premium Quality Build', 'Weather Resistant', 'Easy DIY Fitment', '1-Year Warranty'],
      };
    }
  },

  listRentals: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<AutoRentalSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/rentals/', { params: filters });
      return data;
    } catch {
      return {
        count: SEED_AUTO_RENTALS.length,
        next: null,
        previous: null,
        results: SEED_AUTO_RENTALS,
      };
    }
  },

  getRental: async (id: string): Promise<AutoRental> => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/rentals/${id}/`);
      return data;
    } catch {
      return SEED_AUTO_RENTALS.find(r => r.id === id) || SEED_AUTO_RENTALS[0];
    }
  },

  bookRental: async (id: string, payload: { pickup_date: string; return_date: string; provider: string; redirect_url: string }): Promise<RentalBooking> => {
    try {
      const { data } = await apiClient.post(`/api/v1/auto/rentals/${id}/book/`, payload);
      return data;
    } catch {
      const rental = SEED_AUTO_RENTALS.find(r => r.id === id) || SEED_AUTO_RENTALS[0];
      return {
        id: `book-${Date.now()}`,
        rental: rental as any,
        pickup_date: payload.pickup_date,
        return_date: payload.return_date,
        total_price: String((parseFloat(rental.daily_rate) * 3).toFixed(2)),
        status: 'CONFIRMED' as any,
        created_at: new Date().toISOString(),
      } as any;
    }
  },

  listBookings: async (): Promise<PaginatedResponse<RentalBooking>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/rentals/bookings/');
      return data;
    } catch {
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    }
  },

  cancelBooking: async (id: string): Promise<RentalBooking> => {
    try {
      const { data } = await apiClient.post(`/api/v1/auto/rentals/bookings/${id}/cancel/`);
      return data;
    } catch {
      return {
        id,
        status: 'CANCELLED' as any,
      } as any;
    }
  },

  addFavorite: async (listingId: string): Promise<{ id: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auto/favorites/', { listing_id: listingId });
      return data;
    } catch {
      return { id: `fav-${listingId}` };
    }
  },

  removeFavorite: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/auto/favorites/${id}/`);
    } catch {}
  },

  listFavorites: async (): Promise<AutoListingSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/favorites/');
      return data;
    } catch {
      return SEED_AUTO_LISTINGS.slice(0, 2);
    }
  },
};
