#!/usr/bin/env node
/**
 * Comprehensive Pakistan Areas Seeder
 * 
 * Seeds 400+ real delivery areas across all 28 major cities in Pakistan.
 * 
 * Usage:
 *   node scripts/seed-pakistan-areas.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Supabase URL and service role key required in .env.local');
  process.exit(1);
}

const client = createClient(url, serviceKey);

export const AREAS_DATA = {
  'Lahore': [
    'Gulberg I, II & III', 'Gulberg V', 'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'DHA Phase 4',
    'DHA Phase 5', 'DHA Phase 6', 'DHA Phase 7', 'DHA Phase 8', 'DHA Phase 9 Prism', 'DHA Phase 11 Rahbar',
    'Johar Town (Phase 1)', 'Johar Town (Phase 2)', 'Model Town (Blocks A-H)', 'Model Town (Blocks J-M)',
    'Bahria Town (Sectors A-C)', 'Bahria Town (Sectors D-F)', 'Lahore Cantt & Saddar', 'Sarwar Colony Cantt',
    'Cavalry Ground', 'Faisal Town', 'Garden Town', 'Wapda Town', 'Allama Iqbal Town',
    'Askari 10 & 11', 'Askari 1-5', 'Valencia Town', 'Lake City', 'Shadman 1 & 2', 'Samanabad',
    'Township (Sector A & B)', 'Gulshan-e-Ravi', 'Sabzazar', 'Mughalpura', 'Harbanspura',
    'Tajpura', 'Shahdara', 'Green Town', 'PCSIR Housing Society', 'State Life Housing Society',
    'Sui Gas Housing Society', 'Paragon City', 'Eden City & Boulevard', 'Badami Bagh',
    'Misri Shah', 'Islampura / Krishan Nagar', 'Walled City (Androon Lahore)', 'Chinar Bagh'
  ],
  'Karachi': [
    'Clifton (Blocks 1-4)', 'Clifton (Blocks 5-9)', 'DHA Phase 1 & 2', 'DHA Phase 3 & 4',
    'DHA Phase 5 & 6', 'DHA Phase 7 & 8', 'DHA Phase 8 Extension', 'Gulshan-e-Iqbal (Blocks 1-10)',
    'Gulshan-e-Iqbal (Blocks 11-19)', 'Gulistan-e-Johar (Blocks 1-10)', 'Gulistan-e-Johar (Blocks 11-20)',
    'PECHS (Blocks 1-3)', 'PECHS (Blocks 4-6)', 'North Nazimabad (Blocks A-J)', 'North Nazimabad (Blocks K-T)',
    'Nazimabad (Blocks 1-5)', 'Federal B Area (Blocks 1-10)', 'Federal B Area (Blocks 11-21)',
    'Saddar & Regal', 'Tariq Road & Commercial Area', 'Bahadurabad', 'Dhoraji Colony',
    'Malir Cantt', 'Malir City', 'Bahria Town Karachi (Precincts 1-15)', 'Bahria Town Karachi (Precincts 16-35)',
    'Korangi Industrial Area', 'Korangi Township', 'Landhi', 'Scheme 33 (Saadi Town & Kaneez Fatima)',
    'Scheme 33 (Lawyers & Teachers Society)', 'Gulshan-e-Maymar', 'Defence View (Phases 1-3)',
    'Mehmoodabad', 'Shah Faisal Colony', 'Buffer Zone (15A & 15B)', 'North Karachi (Sectors 1-6)',
    'North Karachi (Sectors 7-11)', 'Surjani Town', 'Orangi Town', 'Lyari', 'Keamari',
    'SITE Industrial Area', 'Gulzar-e-Hijri', 'Delhi Colony', 'Punjab Colony', 'Boat Basin',
    'Baloch Colony', 'Jamshed Road', 'Soldier Bazaar', 'Gulshan-e-Hadeed', 'Steel Town'
  ],
  'Islamabad': [
    'Sector F-6 (Super Market)', 'Sector F-7 (Jinnah Super)', 'Sector F-8 (Markaz)',
    'Sector F-10 (Markaz)', 'Sector F-11 (Markaz)', 'Sector E-7', 'Sector E-11 (MPCHS & Multi Gardens)',
    'Sector G-6 (Melody)', 'Sector G-7 (Sitara Market)', 'Sector G-8 (Markaz)', 'Sector G-9 (Karachi Company)',
    'Sector G-10 (Markaz)', 'Sector G-11 (Markaz)', 'Sector G-13', 'Sector G-14', 'Sector G-15',
    'Sector H-8 & H-9', 'Sector H-11 & H-12', 'Sector I-8 (Markaz)', 'Sector I-9 (Industrial Area)',
    'Sector I-10 (Markaz)', 'Sector I-14', 'DHA Phase 1 & 2', 'DHA Phase 3 & 5',
    'Bahria Enclave', 'Bahria Town (Phase 7 & 8)', 'PWD Housing Society', 'Pakistan Town',
    'Soan Gardens', 'CBR Town', 'National Police Foundation (O-9)', 'Bani Gala',
    'Chak Shahzad', 'Bhara Kahu', 'Gulberg Greens', 'Naval Anchorage', 'Park View City',
    'B-17 Multi Gardens', 'Sector D-12', 'Top City-1 & Mumtaz City', 'Diplomatic Enclave'
  ],
  'Rawalpindi': [
    'Bahria Town (Phases 1-4)', 'Bahria Town (Phases 5-8)', 'Safari Villas (1, 2, 3)',
    'Saddar Cantt', 'Satellite Town (Blocks A-C)', 'Satellite Town (Blocks D-F)',
    'Commercial Market', 'Chaklala Scheme 1 & 2', 'Chaklala Scheme 3', 'Chaklala Cantt',
    'Westridge (1, 2, 3)', 'Askari (1-5)', 'Askari 7 & 13', 'Askari 14',
    'Peshawar Road', 'Adyala Road', 'Dhamial Road', 'Gulraiz Housing Society',
    'Morgah', 'Gulshan-e-Abad', 'Rawal Town', 'Shamsabad', 'Tench Bhata',
    'Lalazar & Harley Street', 'Afshan Colony', 'Tulsa Road', 'Airport Housing Society',
    'Gulzar-e-Quaid', 'Dhok Kashmirian'
  ],
  'Faisalabad': [
    'Madina Town', 'Peoples Colony No 1', 'Peoples Colony No 2', 'D Ground Commercial',
    'Kohinoor City', 'Civil Lines', 'Ghulam Muhammad Abad', 'Samanabad', 'Millat Town',
    'Gulberg Faisalabad', 'Canal Road / Express Way', 'FDA City', 'Mansoorabad',
    'Batala Colony', 'Saeedabad', 'Warispura', 'Sargodha Road', 'Jaranwala Road',
    'Eden Valley', 'Susan Road', 'Saeed Colony'
  ],
  'Multan': [
    'Gulgasht Colony', 'Multan Cantt', 'Bosan Road', 'DHA Multan', 'New Multan',
    'Shah Rukn-e-Alam Colony', 'Model Town Multan', 'MDA Officers Colony', 'Zakariya Town',
    'Wapda Town Multan', 'Shamasabad', 'Northern Bypass', 'Suraj Miani', 'Garden Town',
    'Officers Colony', 'Qasim Bela'
  ],
  'Gujranwala': [
    'DC Colony', 'Model Town Gujranwala', 'Master City', 'Cantt Gujranwala',
    'Wapda Town Gujranwala', 'Satellite Town (Blocks A-D)', 'Citi Housing Society (Phase 1 & 2)',
    'Rahwali Cantt', 'Peoples Colony', 'G Magnolia Park', 'Shalimar Town', 'Sialkot Road',
    'Garden Town', 'Fazaia Housing Scheme'
  ],
  'Sialkot': [
    'Sialkot Cantt', 'Model Town Sialkot', 'Kashmir Road', 'Paris Road', 'Defense Homes',
    'Citi Housing Sialkot', 'Daska Road', 'Rangpura', 'Shahabpura', 'Ugoki',
    'Gohadpur', 'Mubarak Pura', 'Cantt View', 'Khadim Ali Road'
  ],
  'Hyderabad': [
    'Latifabad (Units 1-4)', 'Latifabad (Units 5-8)', 'Latifabad (Units 9-12)',
    'Qasimabad (Phase 1 & 2)', 'Qasimabad (Phase 3)', 'Auto Bhan Road', 'Saddar Hyderabad',
    'Defence Housing Scheme', 'Gulshan-e-Hali', 'Citizen Colony', 'Nasim Nagar',
    'Wadhu Wah Road', 'Hirabad', 'Cantt Hyderabad'
  ],
  'Peshawar': [
    'Hayatabad (Phases 1-3)', 'Hayatabad (Phases 4-7)', 'University Town', 'Peshawar Cantt',
    'DHA Peshawar', 'Regi Model Town', 'Warsak Road', 'Dalazak Road', 'Kohat Road',
    'Gulbahar (1-4)', 'Saddar Peshawar', 'Ring Road', 'Shami Road', 'Charsadda Road',
    'Board Bazaar', 'Tehkal'
  ],
  'Quetta': [
    'Quetta Cantt', 'Jinnah Town', 'Shahbaz Town', 'Samungli Road', 'Model Town Quetta',
    'Brewery Road', 'Zarghoon Road', 'Satellite Town Quetta', 'Chiltan Housing Society',
    'Nawan Killi', 'Airport Road', 'Spiny Road', 'Alamdar Road'
  ],
  'Bahawalpur': [
    'Model Town A', 'Model Town B', 'Bahawalpur Cantt', 'Satellite Town',
    'DHA Bahawalpur', 'Hashmi Garden', 'Cheema Town', 'Shadman City',
    'Baghdad Road', 'One Unit Staff Colony', 'University Town Bahawalpur'
  ],
  'Sargodha': [
    'Satellite Town (Blocks A-D)', 'Sargodha Cantt', 'University Town', 'PAF Colony',
    'Mujahid Colony', 'Fatima Jinnah Colony', 'Farooq Colony', 'Queens Road',
    'Sillanwali Road', 'Stadium Road'
  ],
  'Gujrat': [
    'Model Town Gujrat', 'Cantt Gujrat', 'Servis Mor', 'Shadman Colony',
    'Court Road', 'Jalalpur Road', 'Marghzar Colony', 'Rehman Shaheed Road',
    'GTS Chowk', 'Bhimbher Road'
  ],
  'Sahiwal': [
    'Farid Town', 'Tariq Bin Ziad Colony', 'Model Town Sahiwal', 'Civil Lines',
    'Fateh Sher Colony', 'High Street', 'Noor Shah Road', 'Bilal Colony', 'Pakpattan Road'
  ],
  'Sheikhupura': [
    'Housing Colony', 'Civil Lines', 'Stadium Road', 'Lahore Road',
    'Tariq Road', 'Batti Chowk', 'Farooqabad Road', 'Hiran Minar Road'
  ],
  'Jhelum': [
    'Jhelum Cantt', 'Civil Lines', 'Machine Mohalla (1-3)', 'Bilal Town',
    'Model Town Jhelum', 'Kala Gujran', 'G.T. Road Jhelum', 'River View Colony'
  ],
  'Rahim Yar Khan': [
    'Model Town', 'Gulshan-e-Iqbal', 'Abbasia Town', 'RYK Cantt',
    'Kanju Town', 'Trust Colony', 'Shahbaz Pur Road', 'Abu Dhabi Road'
  ],
  'Sukkur': [
    'Military Road', 'Minara Road', 'Barrage Colony', 'Queens Road',
    'Workshop Road', 'Shalimar', 'New Pind', 'Old Sukkur'
  ],
  'Larkana': [
    'VIP Road', 'Lahori Mohalla', 'Sachal Colony', 'Station Road',
    'Murad Wahan', 'Shaikh Zayed Colony', 'Resham Gali'
  ],
  'Nawabshah': [
    'Society Area', 'Taj Colony', 'Line Par', 'Manuabad',
    'Housing Society', 'Court Road', 'Kazi Ahmed Road'
  ],
  'Abbottabad': [
    'Mandian', 'Supply Bazaar', 'Abbottabad Cantt', 'PMA Kakul Road',
    'Jinnahabad', 'Link Road', 'Nawan Shehr', 'Murree Road'
  ],
  'Mardan': [
    'Mardan Cantt', 'Sheikh Maltoon Town (Sectors A-E)', 'Sheikh Maltoon Town (Sectors F-K)',
    'Baghdada', 'Shamsi Road', 'Bank Road', 'Nowshera Road'
  ],
  'Swat': [
    'Mingora City', 'Saidu Sharif', 'Fizagat', 'Makan Bagh',
    'Haji Baba', 'Rahimabad', 'Gulkada', 'Airport Road Mingora'
  ],
  'Gwadar': [
    'New Town (Phases 1-2)', 'New Town (Phases 3-4)', 'Marine Drive',
    'Sangar Housing Project', 'Airport Road Gwadar', 'Gwadar Cantt'
  ],
  'Mirpur': [
    'Sector F-1 & F-2', 'Sector F-3 & F-4', 'Sector C-1 to C-4',
    'Sector B-1 to B-3', 'New City Mirpur', 'Allama Iqbal Road', 'Chowk Shaheedan'
  ],
  'Muzaffarabad': [
    'Upper Chattar', 'Lower Chattar', 'Plate', 'Medina Market',
    'CMH Road', 'Tariqabad', 'Gojra', 'Naluchi'
  ],
  'Gilgit': [
    'Jutial', 'Gilgit Cantt', 'River View Road', 'Zulfiqarabad',
    'Kashrote', 'Amphary', 'Sonikot', 'Airport Road Gilgit'
  ]
};

async function run() {
  console.log('🚀 Syncing Pakistan Areas to database...');
  const { data: dbCities, error: cErr } = await client.from('cities').select('id, name');
  if (cErr || !dbCities) {
    console.error('Failed to fetch cities:', cErr);
    return;
  }

  const cityMap = {};
  dbCities.forEach(c => {
    cityMap[c.name.toLowerCase()] = c.id;
  });

  for (const [cityName, list] of Object.entries(AREAS_DATA)) {
    const cityId = cityMap[cityName.toLowerCase()];
    if (!cityId) continue;

    const payload = list.map(name => ({
      city_id: cityId,
      name,
      active: true,
    }));

    await client.from('areas').upsert(payload, { onConflict: 'city_id,name' });
  }

  const { count } = await client.from('areas').select('*', { count: 'exact', head: true });
  console.log(`✅ Finished! Total delivery areas active in database: ${count}`);
}

run();
