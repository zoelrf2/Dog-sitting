import { supabase } from './supabaseClient';
import { SitterProfile, Booking, Review } from './types';

export interface AppState {
  sitters: SitterProfile[];
  bookings: Booking[];
  reviews: Review[];
  customPups: any[];
  registeredOwner: any;
}

// Discovered payload column name (e.g., 'value', 'content', 'data')
let discoveredPayloadColumn: string | null = null;

/**
 * Loads the complete app state from the Supabase "Entries" table.
 * Fallbacks gracefully to localStorage if Supabase has no data or throws an error.
 */
export async function loadStateFromSupabase(): Promise<Partial<AppState>> {
  try {
    const { data, error } = await supabase
      .from('Entries')
      .select('*');

    if (error) {
      console.warn('Supabase loading returned an error, falling back to local state:', error.message);
      return {};
    }

    if (!data || data.length === 0) {
      return {};
    }

    const state: Partial<AppState> = {};

    for (const row of data) {
      // Dynamically discover a stored JSON payload column (excluding metadata fields)
      const colName = Object.keys(row).find(k => k !== 'id' && k !== 'created_at');
      if (colName) {
        discoveredPayloadColumn = colName;
        const val = row[colName];
        if (val !== undefined && val !== null) {
          try {
            const parsed = typeof val === 'string' ? JSON.parse(val) : val;
            const idVal = Number(row.id);
            if (idVal === 1) {
              state.sitters = parsed;
            } else if (idVal === 2) {
              state.bookings = parsed;
            } else if (idVal === 3) {
              state.reviews = parsed;
            } else if (idVal === 4) {
              state.customPups = parsed;
            } else if (idVal === 5) {
              state.registeredOwner = parsed;
            }
          } catch (e) {
            console.error('Error parsing row payload for ID:', row.id, e);
          }
        }
      }
    }

    return state;
  } catch (err: any) {
    console.error('Failed to load state from Supabase:', err.message);
    return {};
  }
}

/**
 * Saves a state pool segment (sitters, bookings, etc.) as a row in the Supabase "Entries" table.
 * If Supabase fails due to RLS, missing columns, or database offline, it falls back gracefully.
 */
export async function saveStateToSupabase(id: number, val: any) {
  try {
    // We prefer the dynamically discovered column name, defaulting to a standard 'value' fallback
    const colName = discoveredPayloadColumn || 'value';
    const payload: Record<string, any> = {
      id: id,
      [colName]: typeof val === 'object' ? JSON.stringify(val) : val
    };

    const { error } = await supabase
      .from('Entries')
      .upsert(payload);

    if (error) {
      console.warn(`Supabase write issue for section ${id} (falling back to local):`, error.message);
    }
  } catch (err: any) {
    console.error(`Failed saving section ${id} to Supabase:`, err.message);
  }
}
