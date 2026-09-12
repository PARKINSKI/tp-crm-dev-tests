import { env } from './env';

/**
 * Test-side expectations per client preset.
 *
 * These are deliberately NOT a copy of the application's client config — they
 * capture only the visible behaviour that proves a preset was applied:
 * branding, sidebar navigation (order + labels), differentiating terminology,
 * unit summaries and optional feature flags. Source of truth in the app:
 * src/config/clients/*.ts, src/components/layout/Sidebar.tsx (nav registry),
 * src/pages/Settings.tsx (row/flag labels).
 */

/** Navigation keys supported by the app, and their routes. */
export type NavKey =
  | 'dashboard'
  | 'customers'
  | 'bookings'
  | 'jobs'
  | 'dispatch'
  | 'routes'
  | 'documents'
  | 'wasteTransferNotes'
  | 'vehicles'
  | 'fieldUsers'
  | 'reports'
  | 'settings';

export const NAV_HREFS: Record<NavKey, string> = {
  dashboard: '/',
  customers: '/customers',
  bookings: '/bookings',
  jobs: '/jobs',
  dispatch: '/dispatch',
  routes: '/routes',
  documents: '/documents',
  wasteTransferNotes: '/modules/waste/waste-transfer-notes',
  vehicles: '/vehicles',
  fieldUsers: '/field-users',
  reports: '/reports',
  settings: '/settings',
};

export interface ExpectedNavItem {
  key: NavKey;
  href: string;
  label: string;
}

/** A singular/plural term pair, e.g. "Delivery / Deliveries". */
export interface TermPair {
  singular: string;
  plural: string;
}

/** Terminology keys checked by the preset tests — only the differentiating ones. */
export type TermKey = 'site' | 'job' | 'booking' | 'fieldUser' | 'document' | 'route';

/** Row labels used on the Settings > Terminology section, keyed by term. */
export const TERM_ROW_LABELS: Record<TermKey, string> = {
  site: 'Site',
  job: 'Job',
  booking: 'Booking',
  fieldUser: 'Field User',
  document: 'Document',
  route: 'Route',
};

export interface PresetExpectations {
  id: string;
  productName: string;
  organisationName: string;
  /** document.title applied at runtime: "<product> — <org>". */
  documentTitle: string;
  /** Expected --brand-primary CSS variable value. */
  primaryColour: string;
  /** Sidebar nav items in expected order (label = rendered link text). */
  navItems: ExpectedNavItem[];
  /** Differentiating terminology (singular + plural). */
  terms: Record<TermKey, TermPair>;
  /** Expected Settings > Units row values, e.g. "Weight (tonnes)". */
  units: {
    quantity: string;
    capacity: string;
  };
  /** Settings > Features row label -> expected enabled state. */
  features: Record<string, boolean>;
  /** Whether the waste-compliance module is mounted for this preset. */
  wasteModule: boolean;
}

function nav(key: NavKey, label: string): ExpectedNavItem {
  return { key, href: NAV_HREFS[key], label };
}

const demoTerms: Record<TermKey, TermPair> = {
  site: { singular: 'Site', plural: 'Sites' },
  job: { singular: 'Job', plural: 'Jobs' },
  booking: { singular: 'Booking', plural: 'Bookings' },
  fieldUser: { singular: 'Field User', plural: 'Field Users' },
  document: { singular: 'Document', plural: 'Documents' },
  route: { singular: 'Route', plural: 'Routes' },
};

const coreFeatures = {
  'Waste Compliance (module)': false,
  'Drop-Off Locations (module)': false,
  'Xero (integration)': false,
  'Driver App (prototype)': false,
  'Customer Portal (prototype)': false,
};

export const CLIENT_PRESETS: Record<string, PresetExpectations> = {
  demo: {
    id: 'demo',
    productName: 'TP Operations Platform',
    organisationName: 'Northstar Operations Ltd',
    documentTitle: 'TP Operations Platform — Northstar Operations Ltd',
    primaryColour: '#2e6b38',
    navItems: [
      nav('dashboard', 'Dashboard'),
      nav('customers', 'Customers'),
      nav('bookings', 'Bookings'),
      nav('jobs', 'Jobs'),
      nav('dispatch', 'Dispatch'),
      nav('routes', 'Routes'),
      nav('documents', 'Documents'),
      nav('vehicles', 'Vehicles'),
      nav('fieldUsers', 'Field Users'),
      nav('reports', 'Reports'),
      nav('settings', 'Settings'),
    ],
    terms: demoTerms,
    units: { quantity: 'Quantity (units)', capacity: 'Capacity (units)' },
    features: {
      ...coreFeatures,
      'Drop-Off Locations (module)': true,
    },
    wasteModule: false,
  },

  logisticsDemo: {
    id: 'logisticsDemo',
    productName: 'TP Operations Platform',
    organisationName: 'Celtic Logistics Ltd',
    documentTitle: 'TP Operations Platform — Celtic Logistics Ltd',
    primaryColour: '#1d4e89',
    navItems: [
      nav('dashboard', 'Dashboard'),
      nav('bookings', 'Consignments'),
      nav('dispatch', 'Dispatch'),
      nav('routes', 'Routes'),
      nav('jobs', 'Deliveries'),
      nav('customers', 'Customers'),
      nav('vehicles', 'Vehicles'),
      nav('fieldUsers', 'Drivers'),
      nav('documents', 'Delivery Notes'),
      nav('reports', 'Reports'),
      nav('settings', 'Settings'),
    ],
    terms: {
      ...demoTerms,
      site: { singular: 'Depot', plural: 'Depots' },
      job: { singular: 'Delivery', plural: 'Deliveries' },
      booking: { singular: 'Consignment', plural: 'Consignments' },
      fieldUser: { singular: 'Driver', plural: 'Drivers' },
      document: { singular: 'Delivery Note', plural: 'Delivery Notes' },
    },
    units: { quantity: 'Items (items)', capacity: 'Pallets (plt)' },
    features: {
      ...coreFeatures,
      'Driver App (prototype)': true,
    },
    wasteModule: false,
  },

  fieldServiceDemo: {
    id: 'fieldServiceDemo',
    productName: 'TP Operations Platform',
    organisationName: 'Summit Field Services Ltd',
    documentTitle: 'TP Operations Platform — Summit Field Services Ltd',
    primaryColour: '#5b3fa8',
    navItems: [
      nav('dashboard', 'Dashboard'),
      nav('jobs', 'Jobs'),
      nav('bookings', 'Service Requests'),
      nav('dispatch', 'Dispatch'),
      nav('fieldUsers', 'Engineers'),
      nav('customers', 'Customers'),
      nav('documents', 'Job Sheets'),
      nav('reports', 'Reports'),
      nav('settings', 'Settings'),
    ],
    terms: {
      ...demoTerms,
      booking: { singular: 'Service Request', plural: 'Service Requests' },
      fieldUser: { singular: 'Engineer', plural: 'Engineers' },
      document: { singular: 'Job Sheet', plural: 'Job Sheets' },
    },
    units: { quantity: 'Hours (hours)', capacity: 'Hours (hrs)' },
    features: coreFeatures,
    wasteModule: false,
  },

  wasteDemo: {
    id: 'wasteDemo',
    productName: 'TP Operations Platform',
    organisationName: 'Greenway Environmental Ltd',
    documentTitle: 'TP Operations Platform — Greenway Environmental Ltd',
    primaryColour: '#14684a',
    navItems: [
      nav('dashboard', 'Dashboard'),
      nav('customers', 'Customers'),
      nav('bookings', 'Collection Requests'),
      nav('jobs', 'Collections'),
      nav('dispatch', 'Dispatch'),
      nav('routes', 'Rounds'),
      nav('documents', 'Waste Transfer Notes'),
      nav('wasteTransferNotes', 'Waste Transfer Notes'),
      nav('vehicles', 'Vehicles'),
      nav('fieldUsers', 'Drivers'),
      nav('reports', 'Reports'),
      nav('settings', 'Settings'),
    ],
    terms: {
      ...demoTerms,
      job: { singular: 'Collection', plural: 'Collections' },
      booking: { singular: 'Collection Request', plural: 'Collection Requests' },
      fieldUser: { singular: 'Driver', plural: 'Drivers' },
      document: { singular: 'Waste Transfer Note', plural: 'Waste Transfer Notes' },
      route: { singular: 'Round', plural: 'Rounds' },
    },
    units: { quantity: 'Weight (tonnes)', capacity: 'Capacity (t)' },
    features: {
      'Waste Compliance (module)': true,
      'Drop-Off Locations (module)': true,
      'Xero (integration)': true,
      'Driver App (prototype)': true,
      'Customer Portal (prototype)': true,
    },
    wasteModule: true,
  },
};

export const SUPPORTED_PRESETS = Object.keys(CLIENT_PRESETS);

/**
 * Resolves CLIENT_PRESET to preset expectations. Fails clearly on values that
 * are not supported presets — the app silently falls back to demo, but tests
 * must not pass against the wrong preset.
 */
export function resolvePreset(id: string = env.clientPreset): PresetExpectations {
  const preset = CLIENT_PRESETS[id];
  if (!preset) {
    throw new Error(
      `Unknown CLIENT_PRESET "${id}". Supported values: ${SUPPORTED_PRESETS.join(', ')}`,
    );
  }
  return preset;
}

/** The active preset expectation for this test run. */
export const preset = resolvePreset();
