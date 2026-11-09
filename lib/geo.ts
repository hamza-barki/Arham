import { supabase, isSupabaseConfigured } from './supabase';

export interface GeoProvince {
  id: string;
  name: string;
  nameUr?: string;
}

export interface GeoCity {
  id: string;
  provinceId: string;
  name: string;
  nameUr?: string;
  courierCityCode?: string;
  lat?: number;
  lng?: number;
}

export interface GeoArea {
  id: string;
  cityId: string;
  name: string;
  nameUr?: string;
  active: boolean;
}

// -----------------------------------------------------------------------------
// Embedded Starter Dataset (Always available, zero network latency)
// -----------------------------------------------------------------------------
export const STARTER_PROVINCES: GeoProvince[] = [
  { id: 'prov-punjab', name: 'Punjab', nameUr: 'پنجاب' },
  { id: 'prov-sindh', name: 'Sindh', nameUr: 'سندھ' },
  { id: 'prov-kpk', name: 'Khyber Pakhtunkhwa', nameUr: 'خیبر پختونخوا' },
  { id: 'prov-balochistan', name: 'Balochistan', nameUr: 'بلوچستان' },
  { id: 'prov-ict', name: 'Islamabad Capital Territory', nameUr: 'وفاقی دارالحکومت اسلام آباد' },
  { id: 'prov-ajk', name: 'Azad Jammu and Kashmir', nameUr: 'آزاد جموں و کشمیر' },
  { id: 'prov-gb', name: 'Gilgit-Baltistan', nameUr: 'گلگت بلتستان' },
];

export const STARTER_CITIES: GeoCity[] = [
  // Punjab
  { id: 'city-lhe', provinceId: 'prov-punjab', name: 'Lahore', nameUr: 'لاہور', courierCityCode: 'LHE', lat: 31.5204, lng: 74.3587 },
  { id: 'city-rwp', provinceId: 'prov-punjab', name: 'Rawalpindi', nameUr: 'راولپنڈی', courierCityCode: 'RWP', lat: 33.5651, lng: 73.0169 },
  { id: 'city-fsd', provinceId: 'prov-punjab', name: 'Faisalabad', nameUr: 'فیصل آباد', courierCityCode: 'FSD', lat: 31.4504, lng: 73.1350 },
  { id: 'city-mux', provinceId: 'prov-punjab', name: 'Multan', nameUr: 'ملتان', courierCityCode: 'MUX', lat: 30.1575, lng: 71.5249 },
  { id: 'city-gwd', provinceId: 'prov-punjab', name: 'Gujranwala', nameUr: 'گوجرانوالہ', courierCityCode: 'GWD', lat: 32.1877, lng: 74.1945 },
  { id: 'city-skt', provinceId: 'prov-punjab', name: 'Sialkot', nameUr: 'سیالکوٹ', courierCityCode: 'SKT', lat: 32.4945, lng: 74.5229 },
  { id: 'city-bhv', provinceId: 'prov-punjab', name: 'Bahawalpur', nameUr: 'بہاولپور', courierCityCode: 'BHV', lat: 29.3544, lng: 71.6911 },
  { id: 'city-sgd', provinceId: 'prov-punjab', name: 'Sargodha', nameUr: 'سرگودھا', courierCityCode: 'SGD', lat: 32.0836, lng: 72.6711 },
  { id: 'city-grt', provinceId: 'prov-punjab', name: 'Gujrat', nameUr: 'گجرات', courierCityCode: 'GRT', lat: 32.5742, lng: 74.0754 },
  { id: 'city-swl', provinceId: 'prov-punjab', name: 'Sahiwal', nameUr: 'ساہیوال', courierCityCode: 'SWL', lat: 30.6682, lng: 73.1114 },
  { id: 'city-skp', provinceId: 'prov-punjab', name: 'Sheikhupura', nameUr: 'شیخوپورہ', courierCityCode: 'SKP', lat: 31.7131, lng: 73.9783 },
  { id: 'city-jhm', provinceId: 'prov-punjab', name: 'Jhelum', nameUr: 'جہلم', courierCityCode: 'JHM', lat: 32.9405, lng: 73.7276 },
  { id: 'city-ryk', provinceId: 'prov-punjab', name: 'Rahim Yar Khan', nameUr: 'رحیم یار خان', courierCityCode: 'RYK', lat: 28.4195, lng: 70.3026 },

  // Sindh
  { id: 'city-khi', provinceId: 'prov-sindh', name: 'Karachi', nameUr: 'کراچی', courierCityCode: 'KHI', lat: 24.8607, lng: 67.0011 },
  { id: 'city-hyd', provinceId: 'prov-sindh', name: 'Hyderabad', nameUr: 'حیدرآباد', courierCityCode: 'HYD', lat: 25.3960, lng: 68.3578 },
  { id: 'city-skr', provinceId: 'prov-sindh', name: 'Sukkur', nameUr: 'سکھر', courierCityCode: 'SKR', lat: 27.7052, lng: 68.8574 },
  { id: 'city-lrk', provinceId: 'prov-sindh', name: 'Larkana', nameUr: 'لاڑکانہ', courierCityCode: 'LRK', lat: 27.5589, lng: 68.2120 },
  { id: 'city-wns', provinceId: 'prov-sindh', name: 'Nawabshah', nameUr: 'نواب شاہ', courierCityCode: 'WNS', lat: 26.2483, lng: 68.4096 },

  // KPK
  { id: 'city-pew', provinceId: 'prov-kpk', name: 'Peshawar', nameUr: 'پشاور', courierCityCode: 'PEW', lat: 34.0151, lng: 71.5249 },
  { id: 'city-aat', provinceId: 'prov-kpk', name: 'Abbottabad', nameUr: 'ایبٹ آباد', courierCityCode: 'AAT', lat: 34.1688, lng: 73.2215 },
  { id: 'city-mdn', provinceId: 'prov-kpk', name: 'Mardan', nameUr: 'مردان', courierCityCode: 'MDN', lat: 34.1986, lng: 72.0404 },
  { id: 'city-swt', provinceId: 'prov-kpk', name: 'Swat', nameUr: 'سوات', courierCityCode: 'SWT', lat: 35.2227, lng: 72.4258 },

  // Balochistan
  { id: 'city-uet', provinceId: 'prov-balochistan', name: 'Quetta', nameUr: 'کوئٹہ', courierCityCode: 'UET', lat: 30.1798, lng: 66.9750 },
  { id: 'city-gwd-bal', provinceId: 'prov-balochistan', name: 'Gwadar', nameUr: 'گوادر', courierCityCode: 'GWD', lat: 25.1264, lng: 62.3225 },

  // Islamabad
  { id: 'city-isb', provinceId: 'prov-ict', name: 'Islamabad', nameUr: 'اسلام آباد', courierCityCode: 'ISB', lat: 33.6844, lng: 73.0479 },

  // AJK
  { id: 'city-mir', provinceId: 'prov-ajk', name: 'Mirpur', nameUr: 'میرپور', courierCityCode: 'MIR', lat: 33.1484, lng: 73.7519 },
  { id: 'city-mzd', provinceId: 'prov-ajk', name: 'Muzaffarabad', nameUr: 'مظفر آباد', courierCityCode: 'MZD', lat: 34.3595, lng: 73.4707 },

  // Gilgit-Baltistan
  { id: 'city-glt', provinceId: 'prov-gb', name: 'Gilgit', nameUr: 'گلگت', courierCityCode: 'GLT', lat: 35.9221, lng: 74.3087 },
];

export const STARTER_AREAS: GeoArea[] = [
  { id: 'area-lhe-gulberg-i-ii-iii', cityId: 'city-lhe', name: 'Gulberg I, II & III', active: true },
  { id: 'area-lhe-gulberg-v', cityId: 'city-lhe', name: 'Gulberg V', active: true },
  { id: 'area-lhe-dha-phase-1', cityId: 'city-lhe', name: 'DHA Phase 1', active: true },
  { id: 'area-lhe-dha-phase-2', cityId: 'city-lhe', name: 'DHA Phase 2', active: true },
  { id: 'area-lhe-dha-phase-3', cityId: 'city-lhe', name: 'DHA Phase 3', active: true },
  { id: 'area-lhe-dha-phase-4', cityId: 'city-lhe', name: 'DHA Phase 4', active: true },
  { id: 'area-lhe-dha-phase-5', cityId: 'city-lhe', name: 'DHA Phase 5', active: true },
  { id: 'area-lhe-dha-phase-6', cityId: 'city-lhe', name: 'DHA Phase 6', active: true },
  { id: 'area-lhe-dha-phase-7', cityId: 'city-lhe', name: 'DHA Phase 7', active: true },
  { id: 'area-lhe-dha-phase-8', cityId: 'city-lhe', name: 'DHA Phase 8', active: true },
  { id: 'area-lhe-dha-phase-9-prism', cityId: 'city-lhe', name: 'DHA Phase 9 Prism', active: true },
  { id: 'area-lhe-dha-phase-11-rahbar', cityId: 'city-lhe', name: 'DHA Phase 11 Rahbar', active: true },
  { id: 'area-lhe-johar-town-phase-1', cityId: 'city-lhe', name: 'Johar Town (Phase 1)', active: true },
  { id: 'area-lhe-johar-town-phase-2', cityId: 'city-lhe', name: 'Johar Town (Phase 2)', active: true },
  { id: 'area-lhe-model-town-blocks-a-', cityId: 'city-lhe', name: 'Model Town (Blocks A-H)', active: true },
  { id: 'area-lhe-model-town-blocks-j-', cityId: 'city-lhe', name: 'Model Town (Blocks J-M)', active: true },
  { id: 'area-lhe-bahria-town-sectors-', cityId: 'city-lhe', name: 'Bahria Town (Sectors A-C)', active: true },
  { id: 'area-lhe-bahria-town-sectors-', cityId: 'city-lhe', name: 'Bahria Town (Sectors D-F)', active: true },
  { id: 'area-lhe-lahore-cantt-saddar', cityId: 'city-lhe', name: 'Lahore Cantt & Saddar', active: true },
  { id: 'area-lhe-sarwar-colony-cantt', cityId: 'city-lhe', name: 'Sarwar Colony Cantt', active: true },
  { id: 'area-lhe-cavalry-ground', cityId: 'city-lhe', name: 'Cavalry Ground', active: true },
  { id: 'area-lhe-faisal-town', cityId: 'city-lhe', name: 'Faisal Town', active: true },
  { id: 'area-lhe-garden-town', cityId: 'city-lhe', name: 'Garden Town', active: true },
  { id: 'area-lhe-wapda-town', cityId: 'city-lhe', name: 'Wapda Town', active: true },
  { id: 'area-lhe-allama-iqbal-town', cityId: 'city-lhe', name: 'Allama Iqbal Town', active: true },
  { id: 'area-lhe-askari-10-11', cityId: 'city-lhe', name: 'Askari 10 & 11', active: true },
  { id: 'area-lhe-askari-1-5', cityId: 'city-lhe', name: 'Askari 1-5', active: true },
  { id: 'area-lhe-valencia-town', cityId: 'city-lhe', name: 'Valencia Town', active: true },
  { id: 'area-lhe-lake-city', cityId: 'city-lhe', name: 'Lake City', active: true },
  { id: 'area-lhe-shadman-1-2', cityId: 'city-lhe', name: 'Shadman 1 & 2', active: true },
  { id: 'area-lhe-samanabad', cityId: 'city-lhe', name: 'Samanabad', active: true },
  { id: 'area-lhe-township-sector-a-b', cityId: 'city-lhe', name: 'Township (Sector A & B)', active: true },
  { id: 'area-lhe-gulshan-e-ravi', cityId: 'city-lhe', name: 'Gulshan-e-Ravi', active: true },
  { id: 'area-lhe-sabzazar', cityId: 'city-lhe', name: 'Sabzazar', active: true },
  { id: 'area-lhe-mughalpura', cityId: 'city-lhe', name: 'Mughalpura', active: true },
  { id: 'area-lhe-harbanspura', cityId: 'city-lhe', name: 'Harbanspura', active: true },
  { id: 'area-lhe-tajpura', cityId: 'city-lhe', name: 'Tajpura', active: true },
  { id: 'area-lhe-shahdara', cityId: 'city-lhe', name: 'Shahdara', active: true },
  { id: 'area-lhe-green-town', cityId: 'city-lhe', name: 'Green Town', active: true },
  { id: 'area-lhe-pcsir-housing-societ', cityId: 'city-lhe', name: 'PCSIR Housing Society', active: true },
  { id: 'area-lhe-state-life-housing-s', cityId: 'city-lhe', name: 'State Life Housing Society', active: true },
  { id: 'area-lhe-sui-gas-housing-soci', cityId: 'city-lhe', name: 'Sui Gas Housing Society', active: true },
  { id: 'area-lhe-paragon-city', cityId: 'city-lhe', name: 'Paragon City', active: true },
  { id: 'area-lhe-eden-city-boulevard', cityId: 'city-lhe', name: 'Eden City & Boulevard', active: true },
  { id: 'area-lhe-badami-bagh', cityId: 'city-lhe', name: 'Badami Bagh', active: true },
  { id: 'area-lhe-misri-shah', cityId: 'city-lhe', name: 'Misri Shah', active: true },
  { id: 'area-lhe-islampura-krishan-na', cityId: 'city-lhe', name: 'Islampura / Krishan Nagar', active: true },
  { id: 'area-lhe-walled-city-androon-', cityId: 'city-lhe', name: 'Walled City (Androon Lahore)', active: true },
  { id: 'area-lhe-chinar-bagh', cityId: 'city-lhe', name: 'Chinar Bagh', active: true },
  { id: 'area-khi-clifton-blocks-1-4', cityId: 'city-khi', name: 'Clifton (Blocks 1-4)', active: true },
  { id: 'area-khi-clifton-blocks-5-9', cityId: 'city-khi', name: 'Clifton (Blocks 5-9)', active: true },
  { id: 'area-khi-dha-phase-1-2', cityId: 'city-khi', name: 'DHA Phase 1 & 2', active: true },
  { id: 'area-khi-dha-phase-3-4', cityId: 'city-khi', name: 'DHA Phase 3 & 4', active: true },
  { id: 'area-khi-dha-phase-5-6', cityId: 'city-khi', name: 'DHA Phase 5 & 6', active: true },
  { id: 'area-khi-dha-phase-7-8', cityId: 'city-khi', name: 'DHA Phase 7 & 8', active: true },
  { id: 'area-khi-dha-phase-8-extensio', cityId: 'city-khi', name: 'DHA Phase 8 Extension', active: true },
  { id: 'area-khi-gulshan-e-iqbal-bloc', cityId: 'city-khi', name: 'Gulshan-e-Iqbal (Blocks 1-10)', active: true },
  { id: 'area-khi-gulshan-e-iqbal-bloc', cityId: 'city-khi', name: 'Gulshan-e-Iqbal (Blocks 11-19)', active: true },
  { id: 'area-khi-gulistan-e-johar-blo', cityId: 'city-khi', name: 'Gulistan-e-Johar (Blocks 1-10)', active: true },
  { id: 'area-khi-gulistan-e-johar-blo', cityId: 'city-khi', name: 'Gulistan-e-Johar (Blocks 11-20)', active: true },
  { id: 'area-khi-pechs-blocks-1-3', cityId: 'city-khi', name: 'PECHS (Blocks 1-3)', active: true },
  { id: 'area-khi-pechs-blocks-4-6', cityId: 'city-khi', name: 'PECHS (Blocks 4-6)', active: true },
  { id: 'area-khi-north-nazimabad-bloc', cityId: 'city-khi', name: 'North Nazimabad (Blocks A-J)', active: true },
  { id: 'area-khi-north-nazimabad-bloc', cityId: 'city-khi', name: 'North Nazimabad (Blocks K-T)', active: true },
  { id: 'area-khi-nazimabad-blocks-1-5', cityId: 'city-khi', name: 'Nazimabad (Blocks 1-5)', active: true },
  { id: 'area-khi-federal-b-area-block', cityId: 'city-khi', name: 'Federal B Area (Blocks 1-10)', active: true },
  { id: 'area-khi-federal-b-area-block', cityId: 'city-khi', name: 'Federal B Area (Blocks 11-21)', active: true },
  { id: 'area-khi-saddar-regal', cityId: 'city-khi', name: 'Saddar & Regal', active: true },
  { id: 'area-khi-tariq-road-commercia', cityId: 'city-khi', name: 'Tariq Road & Commercial Area', active: true },
  { id: 'area-khi-bahadurabad', cityId: 'city-khi', name: 'Bahadurabad', active: true },
  { id: 'area-khi-dhoraji-colony', cityId: 'city-khi', name: 'Dhoraji Colony', active: true },
  { id: 'area-khi-malir-cantt', cityId: 'city-khi', name: 'Malir Cantt', active: true },
  { id: 'area-khi-malir-city', cityId: 'city-khi', name: 'Malir City', active: true },
  { id: 'area-khi-bahria-town-karachi-', cityId: 'city-khi', name: 'Bahria Town Karachi (Precincts 1-15)', active: true },
  { id: 'area-khi-bahria-town-karachi-', cityId: 'city-khi', name: 'Bahria Town Karachi (Precincts 16-35)', active: true },
  { id: 'area-khi-korangi-industrial-a', cityId: 'city-khi', name: 'Korangi Industrial Area', active: true },
  { id: 'area-khi-korangi-township', cityId: 'city-khi', name: 'Korangi Township', active: true },
  { id: 'area-khi-landhi', cityId: 'city-khi', name: 'Landhi', active: true },
  { id: 'area-khi-scheme-33-saadi-town', cityId: 'city-khi', name: 'Scheme 33 (Saadi Town & Kaneez Fatima)', active: true },
  { id: 'area-khi-scheme-33-lawyers-te', cityId: 'city-khi', name: 'Scheme 33 (Lawyers & Teachers Society)', active: true },
  { id: 'area-khi-gulshan-e-maymar', cityId: 'city-khi', name: 'Gulshan-e-Maymar', active: true },
  { id: 'area-khi-defence-view-phases-', cityId: 'city-khi', name: 'Defence View (Phases 1-3)', active: true },
  { id: 'area-khi-mehmoodabad', cityId: 'city-khi', name: 'Mehmoodabad', active: true },
  { id: 'area-khi-shah-faisal-colony', cityId: 'city-khi', name: 'Shah Faisal Colony', active: true },
  { id: 'area-khi-buffer-zone-15a-15b', cityId: 'city-khi', name: 'Buffer Zone (15A & 15B)', active: true },
  { id: 'area-khi-north-karachi-sector', cityId: 'city-khi', name: 'North Karachi (Sectors 1-6)', active: true },
  { id: 'area-khi-north-karachi-sector', cityId: 'city-khi', name: 'North Karachi (Sectors 7-11)', active: true },
  { id: 'area-khi-surjani-town', cityId: 'city-khi', name: 'Surjani Town', active: true },
  { id: 'area-khi-orangi-town', cityId: 'city-khi', name: 'Orangi Town', active: true },
  { id: 'area-khi-lyari', cityId: 'city-khi', name: 'Lyari', active: true },
  { id: 'area-khi-keamari', cityId: 'city-khi', name: 'Keamari', active: true },
  { id: 'area-khi-site-industrial-area', cityId: 'city-khi', name: 'SITE Industrial Area', active: true },
  { id: 'area-khi-gulzar-e-hijri', cityId: 'city-khi', name: 'Gulzar-e-Hijri', active: true },
  { id: 'area-khi-delhi-colony', cityId: 'city-khi', name: 'Delhi Colony', active: true },
  { id: 'area-khi-punjab-colony', cityId: 'city-khi', name: 'Punjab Colony', active: true },
  { id: 'area-khi-boat-basin', cityId: 'city-khi', name: 'Boat Basin', active: true },
  { id: 'area-khi-baloch-colony', cityId: 'city-khi', name: 'Baloch Colony', active: true },
  { id: 'area-khi-jamshed-road', cityId: 'city-khi', name: 'Jamshed Road', active: true },
  { id: 'area-khi-soldier-bazaar', cityId: 'city-khi', name: 'Soldier Bazaar', active: true },
  { id: 'area-khi-gulshan-e-hadeed', cityId: 'city-khi', name: 'Gulshan-e-Hadeed', active: true },
  { id: 'area-khi-steel-town', cityId: 'city-khi', name: 'Steel Town', active: true },
  { id: 'area-isb-sector-f-6-super-mar', cityId: 'city-isb', name: 'Sector F-6 (Super Market)', active: true },
  { id: 'area-isb-sector-f-7-jinnah-su', cityId: 'city-isb', name: 'Sector F-7 (Jinnah Super)', active: true },
  { id: 'area-isb-sector-f-8-markaz', cityId: 'city-isb', name: 'Sector F-8 (Markaz)', active: true },
  { id: 'area-isb-sector-f-10-markaz', cityId: 'city-isb', name: 'Sector F-10 (Markaz)', active: true },
  { id: 'area-isb-sector-f-11-markaz', cityId: 'city-isb', name: 'Sector F-11 (Markaz)', active: true },
  { id: 'area-isb-sector-e-7', cityId: 'city-isb', name: 'Sector E-7', active: true },
  { id: 'area-isb-sector-e-11-mpchs-mu', cityId: 'city-isb', name: 'Sector E-11 (MPCHS & Multi Gardens)', active: true },
  { id: 'area-isb-sector-g-6-melody', cityId: 'city-isb', name: 'Sector G-6 (Melody)', active: true },
  { id: 'area-isb-sector-g-7-sitara-ma', cityId: 'city-isb', name: 'Sector G-7 (Sitara Market)', active: true },
  { id: 'area-isb-sector-g-8-markaz', cityId: 'city-isb', name: 'Sector G-8 (Markaz)', active: true },
  { id: 'area-isb-sector-g-9-karachi-c', cityId: 'city-isb', name: 'Sector G-9 (Karachi Company)', active: true },
  { id: 'area-isb-sector-g-10-markaz', cityId: 'city-isb', name: 'Sector G-10 (Markaz)', active: true },
  { id: 'area-isb-sector-g-11-markaz', cityId: 'city-isb', name: 'Sector G-11 (Markaz)', active: true },
  { id: 'area-isb-sector-g-13', cityId: 'city-isb', name: 'Sector G-13', active: true },
  { id: 'area-isb-sector-g-14', cityId: 'city-isb', name: 'Sector G-14', active: true },
  { id: 'area-isb-sector-g-15', cityId: 'city-isb', name: 'Sector G-15', active: true },
  { id: 'area-isb-sector-h-8-h-9', cityId: 'city-isb', name: 'Sector H-8 & H-9', active: true },
  { id: 'area-isb-sector-h-11-h-12', cityId: 'city-isb', name: 'Sector H-11 & H-12', active: true },
  { id: 'area-isb-sector-i-8-markaz', cityId: 'city-isb', name: 'Sector I-8 (Markaz)', active: true },
  { id: 'area-isb-sector-i-9-industria', cityId: 'city-isb', name: 'Sector I-9 (Industrial Area)', active: true },
  { id: 'area-isb-sector-i-10-markaz', cityId: 'city-isb', name: 'Sector I-10 (Markaz)', active: true },
  { id: 'area-isb-sector-i-14', cityId: 'city-isb', name: 'Sector I-14', active: true },
  { id: 'area-isb-dha-phase-1-2', cityId: 'city-isb', name: 'DHA Phase 1 & 2', active: true },
  { id: 'area-isb-dha-phase-3-5', cityId: 'city-isb', name: 'DHA Phase 3 & 5', active: true },
  { id: 'area-isb-bahria-enclave', cityId: 'city-isb', name: 'Bahria Enclave', active: true },
  { id: 'area-isb-bahria-town-phase-7-', cityId: 'city-isb', name: 'Bahria Town (Phase 7 & 8)', active: true },
  { id: 'area-isb-pwd-housing-society', cityId: 'city-isb', name: 'PWD Housing Society', active: true },
  { id: 'area-isb-pakistan-town', cityId: 'city-isb', name: 'Pakistan Town', active: true },
  { id: 'area-isb-soan-gardens', cityId: 'city-isb', name: 'Soan Gardens', active: true },
  { id: 'area-isb-cbr-town', cityId: 'city-isb', name: 'CBR Town', active: true },
  { id: 'area-isb-national-police-foun', cityId: 'city-isb', name: 'National Police Foundation (O-9)', active: true },
  { id: 'area-isb-bani-gala', cityId: 'city-isb', name: 'Bani Gala', active: true },
  { id: 'area-isb-chak-shahzad', cityId: 'city-isb', name: 'Chak Shahzad', active: true },
  { id: 'area-isb-bhara-kahu', cityId: 'city-isb', name: 'Bhara Kahu', active: true },
  { id: 'area-isb-gulberg-greens', cityId: 'city-isb', name: 'Gulberg Greens', active: true },
  { id: 'area-isb-naval-anchorage', cityId: 'city-isb', name: 'Naval Anchorage', active: true },
  { id: 'area-isb-park-view-city', cityId: 'city-isb', name: 'Park View City', active: true },
  { id: 'area-isb-b-17-multi-gardens', cityId: 'city-isb', name: 'B-17 Multi Gardens', active: true },
  { id: 'area-isb-sector-d-12', cityId: 'city-isb', name: 'Sector D-12', active: true },
  { id: 'area-isb-top-city-1-mumtaz-ci', cityId: 'city-isb', name: 'Top City-1 & Mumtaz City', active: true },
  { id: 'area-isb-diplomatic-enclave', cityId: 'city-isb', name: 'Diplomatic Enclave', active: true },
  { id: 'area-rwp-bahria-town-phases-1', cityId: 'city-rwp', name: 'Bahria Town (Phases 1-4)', active: true },
  { id: 'area-rwp-bahria-town-phases-5', cityId: 'city-rwp', name: 'Bahria Town (Phases 5-8)', active: true },
  { id: 'area-rwp-safari-villas-1-2-3', cityId: 'city-rwp', name: 'Safari Villas (1, 2, 3)', active: true },
  { id: 'area-rwp-saddar-cantt', cityId: 'city-rwp', name: 'Saddar Cantt', active: true },
  { id: 'area-rwp-satellite-town-block', cityId: 'city-rwp', name: 'Satellite Town (Blocks A-C)', active: true },
  { id: 'area-rwp-satellite-town-block', cityId: 'city-rwp', name: 'Satellite Town (Blocks D-F)', active: true },
  { id: 'area-rwp-commercial-market', cityId: 'city-rwp', name: 'Commercial Market', active: true },
  { id: 'area-rwp-chaklala-scheme-1-2', cityId: 'city-rwp', name: 'Chaklala Scheme 1 & 2', active: true },
  { id: 'area-rwp-chaklala-scheme-3', cityId: 'city-rwp', name: 'Chaklala Scheme 3', active: true },
  { id: 'area-rwp-chaklala-cantt', cityId: 'city-rwp', name: 'Chaklala Cantt', active: true },
  { id: 'area-rwp-westridge-1-2-3', cityId: 'city-rwp', name: 'Westridge (1, 2, 3)', active: true },
  { id: 'area-rwp-askari-1-5', cityId: 'city-rwp', name: 'Askari (1-5)', active: true },
  { id: 'area-rwp-askari-7-13', cityId: 'city-rwp', name: 'Askari 7 & 13', active: true },
  { id: 'area-rwp-askari-14', cityId: 'city-rwp', name: 'Askari 14', active: true },
  { id: 'area-rwp-peshawar-road', cityId: 'city-rwp', name: 'Peshawar Road', active: true },
  { id: 'area-rwp-adyala-road', cityId: 'city-rwp', name: 'Adyala Road', active: true },
  { id: 'area-rwp-dhamial-road', cityId: 'city-rwp', name: 'Dhamial Road', active: true },
  { id: 'area-rwp-gulraiz-housing-soci', cityId: 'city-rwp', name: 'Gulraiz Housing Society', active: true },
  { id: 'area-rwp-morgah', cityId: 'city-rwp', name: 'Morgah', active: true },
  { id: 'area-rwp-gulshan-e-abad', cityId: 'city-rwp', name: 'Gulshan-e-Abad', active: true },
  { id: 'area-rwp-rawal-town', cityId: 'city-rwp', name: 'Rawal Town', active: true },
  { id: 'area-rwp-shamsabad', cityId: 'city-rwp', name: 'Shamsabad', active: true },
  { id: 'area-rwp-tench-bhata', cityId: 'city-rwp', name: 'Tench Bhata', active: true },
  { id: 'area-rwp-lalazar-harley-stree', cityId: 'city-rwp', name: 'Lalazar & Harley Street', active: true },
  { id: 'area-rwp-afshan-colony', cityId: 'city-rwp', name: 'Afshan Colony', active: true },
  { id: 'area-rwp-tulsa-road', cityId: 'city-rwp', name: 'Tulsa Road', active: true },
  { id: 'area-rwp-airport-housing-soci', cityId: 'city-rwp', name: 'Airport Housing Society', active: true },
  { id: 'area-rwp-gulzar-e-quaid', cityId: 'city-rwp', name: 'Gulzar-e-Quaid', active: true },
  { id: 'area-rwp-dhok-kashmirian', cityId: 'city-rwp', name: 'Dhok Kashmirian', active: true },
  { id: 'area-fsd-madina-town', cityId: 'city-fsd', name: 'Madina Town', active: true },
  { id: 'area-fsd-peoples-colony-no-1', cityId: 'city-fsd', name: 'Peoples Colony No 1', active: true },
  { id: 'area-fsd-peoples-colony-no-2', cityId: 'city-fsd', name: 'Peoples Colony No 2', active: true },
  { id: 'area-fsd-d-ground-commercial', cityId: 'city-fsd', name: 'D Ground Commercial', active: true },
  { id: 'area-fsd-kohinoor-city', cityId: 'city-fsd', name: 'Kohinoor City', active: true },
  { id: 'area-fsd-civil-lines', cityId: 'city-fsd', name: 'Civil Lines', active: true },
  { id: 'area-fsd-ghulam-muhammad-abad', cityId: 'city-fsd', name: 'Ghulam Muhammad Abad', active: true },
  { id: 'area-fsd-samanabad', cityId: 'city-fsd', name: 'Samanabad', active: true },
  { id: 'area-fsd-millat-town', cityId: 'city-fsd', name: 'Millat Town', active: true },
  { id: 'area-fsd-gulberg-faisalabad', cityId: 'city-fsd', name: 'Gulberg Faisalabad', active: true },
  { id: 'area-fsd-canal-road-express-w', cityId: 'city-fsd', name: 'Canal Road / Express Way', active: true },
  { id: 'area-fsd-fda-city', cityId: 'city-fsd', name: 'FDA City', active: true },
  { id: 'area-fsd-mansoorabad', cityId: 'city-fsd', name: 'Mansoorabad', active: true },
  { id: 'area-fsd-batala-colony', cityId: 'city-fsd', name: 'Batala Colony', active: true },
  { id: 'area-fsd-saeedabad', cityId: 'city-fsd', name: 'Saeedabad', active: true },
  { id: 'area-fsd-warispura', cityId: 'city-fsd', name: 'Warispura', active: true },
  { id: 'area-fsd-sargodha-road', cityId: 'city-fsd', name: 'Sargodha Road', active: true },
  { id: 'area-fsd-jaranwala-road', cityId: 'city-fsd', name: 'Jaranwala Road', active: true },
  { id: 'area-fsd-eden-valley', cityId: 'city-fsd', name: 'Eden Valley', active: true },
  { id: 'area-fsd-susan-road', cityId: 'city-fsd', name: 'Susan Road', active: true },
  { id: 'area-fsd-saeed-colony', cityId: 'city-fsd', name: 'Saeed Colony', active: true },
  { id: 'area-mux-gulgasht-colony', cityId: 'city-mux', name: 'Gulgasht Colony', active: true },
  { id: 'area-mux-multan-cantt', cityId: 'city-mux', name: 'Multan Cantt', active: true },
  { id: 'area-mux-bosan-road', cityId: 'city-mux', name: 'Bosan Road', active: true },
  { id: 'area-mux-dha-multan', cityId: 'city-mux', name: 'DHA Multan', active: true },
  { id: 'area-mux-new-multan', cityId: 'city-mux', name: 'New Multan', active: true },
  { id: 'area-mux-shah-rukn-e-alam-col', cityId: 'city-mux', name: 'Shah Rukn-e-Alam Colony', active: true },
  { id: 'area-mux-model-town-multan', cityId: 'city-mux', name: 'Model Town Multan', active: true },
  { id: 'area-mux-mda-officers-colony', cityId: 'city-mux', name: 'MDA Officers Colony', active: true },
  { id: 'area-mux-zakariya-town', cityId: 'city-mux', name: 'Zakariya Town', active: true },
  { id: 'area-mux-wapda-town-multan', cityId: 'city-mux', name: 'Wapda Town Multan', active: true },
  { id: 'area-mux-shamasabad', cityId: 'city-mux', name: 'Shamasabad', active: true },
  { id: 'area-mux-northern-bypass', cityId: 'city-mux', name: 'Northern Bypass', active: true },
  { id: 'area-mux-suraj-miani', cityId: 'city-mux', name: 'Suraj Miani', active: true },
  { id: 'area-mux-garden-town', cityId: 'city-mux', name: 'Garden Town', active: true },
  { id: 'area-mux-officers-colony', cityId: 'city-mux', name: 'Officers Colony', active: true },
  { id: 'area-mux-qasim-bela', cityId: 'city-mux', name: 'Qasim Bela', active: true },
  { id: 'area-gwd-dc-colony', cityId: 'city-gwd', name: 'DC Colony', active: true },
  { id: 'area-gwd-model-town-gujranwal', cityId: 'city-gwd', name: 'Model Town Gujranwala', active: true },
  { id: 'area-gwd-master-city', cityId: 'city-gwd', name: 'Master City', active: true },
  { id: 'area-gwd-cantt-gujranwala', cityId: 'city-gwd', name: 'Cantt Gujranwala', active: true },
  { id: 'area-gwd-wapda-town-gujranwal', cityId: 'city-gwd', name: 'Wapda Town Gujranwala', active: true },
  { id: 'area-gwd-satellite-town-block', cityId: 'city-gwd', name: 'Satellite Town (Blocks A-D)', active: true },
  { id: 'area-gwd-citi-housing-society', cityId: 'city-gwd', name: 'Citi Housing Society (Phase 1 & 2)', active: true },
  { id: 'area-gwd-rahwali-cantt', cityId: 'city-gwd', name: 'Rahwali Cantt', active: true },
  { id: 'area-gwd-peoples-colony', cityId: 'city-gwd', name: 'Peoples Colony', active: true },
  { id: 'area-gwd-g-magnolia-park', cityId: 'city-gwd', name: 'G Magnolia Park', active: true },
  { id: 'area-gwd-shalimar-town', cityId: 'city-gwd', name: 'Shalimar Town', active: true },
  { id: 'area-gwd-sialkot-road', cityId: 'city-gwd', name: 'Sialkot Road', active: true },
  { id: 'area-gwd-garden-town', cityId: 'city-gwd', name: 'Garden Town', active: true },
  { id: 'area-gwd-fazaia-housing-schem', cityId: 'city-gwd', name: 'Fazaia Housing Scheme', active: true },
  { id: 'area-skt-sialkot-cantt', cityId: 'city-skt', name: 'Sialkot Cantt', active: true },
  { id: 'area-skt-model-town-sialkot', cityId: 'city-skt', name: 'Model Town Sialkot', active: true },
  { id: 'area-skt-kashmir-road', cityId: 'city-skt', name: 'Kashmir Road', active: true },
  { id: 'area-skt-paris-road', cityId: 'city-skt', name: 'Paris Road', active: true },
  { id: 'area-skt-defense-homes', cityId: 'city-skt', name: 'Defense Homes', active: true },
  { id: 'area-skt-citi-housing-sialkot', cityId: 'city-skt', name: 'Citi Housing Sialkot', active: true },
  { id: 'area-skt-daska-road', cityId: 'city-skt', name: 'Daska Road', active: true },
  { id: 'area-skt-rangpura', cityId: 'city-skt', name: 'Rangpura', active: true },
  { id: 'area-skt-shahabpura', cityId: 'city-skt', name: 'Shahabpura', active: true },
  { id: 'area-skt-ugoki', cityId: 'city-skt', name: 'Ugoki', active: true },
  { id: 'area-skt-gohadpur', cityId: 'city-skt', name: 'Gohadpur', active: true },
  { id: 'area-skt-mubarak-pura', cityId: 'city-skt', name: 'Mubarak Pura', active: true },
  { id: 'area-skt-cantt-view', cityId: 'city-skt', name: 'Cantt View', active: true },
  { id: 'area-skt-khadim-ali-road', cityId: 'city-skt', name: 'Khadim Ali Road', active: true },
  { id: 'area-hyd-latifabad-units-1-4', cityId: 'city-hyd', name: 'Latifabad (Units 1-4)', active: true },
  { id: 'area-hyd-latifabad-units-5-8', cityId: 'city-hyd', name: 'Latifabad (Units 5-8)', active: true },
  { id: 'area-hyd-latifabad-units-9-12', cityId: 'city-hyd', name: 'Latifabad (Units 9-12)', active: true },
  { id: 'area-hyd-qasimabad-phase-1-2', cityId: 'city-hyd', name: 'Qasimabad (Phase 1 & 2)', active: true },
  { id: 'area-hyd-qasimabad-phase-3', cityId: 'city-hyd', name: 'Qasimabad (Phase 3)', active: true },
  { id: 'area-hyd-auto-bhan-road', cityId: 'city-hyd', name: 'Auto Bhan Road', active: true },
  { id: 'area-hyd-saddar-hyderabad', cityId: 'city-hyd', name: 'Saddar Hyderabad', active: true },
  { id: 'area-hyd-defence-housing-sche', cityId: 'city-hyd', name: 'Defence Housing Scheme', active: true },
  { id: 'area-hyd-gulshan-e-hali', cityId: 'city-hyd', name: 'Gulshan-e-Hali', active: true },
  { id: 'area-hyd-citizen-colony', cityId: 'city-hyd', name: 'Citizen Colony', active: true },
  { id: 'area-hyd-nasim-nagar', cityId: 'city-hyd', name: 'Nasim Nagar', active: true },
  { id: 'area-hyd-wadhu-wah-road', cityId: 'city-hyd', name: 'Wadhu Wah Road', active: true },
  { id: 'area-hyd-hirabad', cityId: 'city-hyd', name: 'Hirabad', active: true },
  { id: 'area-hyd-cantt-hyderabad', cityId: 'city-hyd', name: 'Cantt Hyderabad', active: true },
  { id: 'area-pew-hayatabad-phases-1-3', cityId: 'city-pew', name: 'Hayatabad (Phases 1-3)', active: true },
  { id: 'area-pew-hayatabad-phases-4-7', cityId: 'city-pew', name: 'Hayatabad (Phases 4-7)', active: true },
  { id: 'area-pew-university-town', cityId: 'city-pew', name: 'University Town', active: true },
  { id: 'area-pew-peshawar-cantt', cityId: 'city-pew', name: 'Peshawar Cantt', active: true },
  { id: 'area-pew-dha-peshawar', cityId: 'city-pew', name: 'DHA Peshawar', active: true },
  { id: 'area-pew-regi-model-town', cityId: 'city-pew', name: 'Regi Model Town', active: true },
  { id: 'area-pew-warsak-road', cityId: 'city-pew', name: 'Warsak Road', active: true },
  { id: 'area-pew-dalazak-road', cityId: 'city-pew', name: 'Dalazak Road', active: true },
  { id: 'area-pew-kohat-road', cityId: 'city-pew', name: 'Kohat Road', active: true },
  { id: 'area-pew-gulbahar-1-4', cityId: 'city-pew', name: 'Gulbahar (1-4)', active: true },
  { id: 'area-pew-saddar-peshawar', cityId: 'city-pew', name: 'Saddar Peshawar', active: true },
  { id: 'area-pew-ring-road', cityId: 'city-pew', name: 'Ring Road', active: true },
  { id: 'area-pew-shami-road', cityId: 'city-pew', name: 'Shami Road', active: true },
  { id: 'area-pew-charsadda-road', cityId: 'city-pew', name: 'Charsadda Road', active: true },
  { id: 'area-pew-board-bazaar', cityId: 'city-pew', name: 'Board Bazaar', active: true },
  { id: 'area-pew-tehkal', cityId: 'city-pew', name: 'Tehkal', active: true },
  { id: 'area-uet-quetta-cantt', cityId: 'city-uet', name: 'Quetta Cantt', active: true },
  { id: 'area-uet-jinnah-town', cityId: 'city-uet', name: 'Jinnah Town', active: true },
  { id: 'area-uet-shahbaz-town', cityId: 'city-uet', name: 'Shahbaz Town', active: true },
  { id: 'area-uet-samungli-road', cityId: 'city-uet', name: 'Samungli Road', active: true },
  { id: 'area-uet-model-town-quetta', cityId: 'city-uet', name: 'Model Town Quetta', active: true },
  { id: 'area-uet-brewery-road', cityId: 'city-uet', name: 'Brewery Road', active: true },
  { id: 'area-uet-zarghoon-road', cityId: 'city-uet', name: 'Zarghoon Road', active: true },
  { id: 'area-uet-satellite-town-quett', cityId: 'city-uet', name: 'Satellite Town Quetta', active: true },
  { id: 'area-uet-chiltan-housing-soci', cityId: 'city-uet', name: 'Chiltan Housing Society', active: true },
  { id: 'area-uet-nawan-killi', cityId: 'city-uet', name: 'Nawan Killi', active: true },
  { id: 'area-uet-airport-road', cityId: 'city-uet', name: 'Airport Road', active: true },
  { id: 'area-uet-spiny-road', cityId: 'city-uet', name: 'Spiny Road', active: true },
  { id: 'area-uet-alamdar-road', cityId: 'city-uet', name: 'Alamdar Road', active: true },
  { id: 'area-bhv-model-town-a', cityId: 'city-bhv', name: 'Model Town A', active: true },
  { id: 'area-bhv-model-town-b', cityId: 'city-bhv', name: 'Model Town B', active: true },
  { id: 'area-bhv-bahawalpur-cantt', cityId: 'city-bhv', name: 'Bahawalpur Cantt', active: true },
  { id: 'area-bhv-satellite-town', cityId: 'city-bhv', name: 'Satellite Town', active: true },
  { id: 'area-bhv-dha-bahawalpur', cityId: 'city-bhv', name: 'DHA Bahawalpur', active: true },
  { id: 'area-bhv-hashmi-garden', cityId: 'city-bhv', name: 'Hashmi Garden', active: true },
  { id: 'area-bhv-cheema-town', cityId: 'city-bhv', name: 'Cheema Town', active: true },
  { id: 'area-bhv-shadman-city', cityId: 'city-bhv', name: 'Shadman City', active: true },
  { id: 'area-bhv-baghdad-road', cityId: 'city-bhv', name: 'Baghdad Road', active: true },
  { id: 'area-bhv-one-unit-staff-colon', cityId: 'city-bhv', name: 'One Unit Staff Colony', active: true },
  { id: 'area-bhv-university-town-baha', cityId: 'city-bhv', name: 'University Town Bahawalpur', active: true },
  { id: 'area-sgd-satellite-town-block', cityId: 'city-sgd', name: 'Satellite Town (Blocks A-D)', active: true },
  { id: 'area-sgd-sargodha-cantt', cityId: 'city-sgd', name: 'Sargodha Cantt', active: true },
  { id: 'area-sgd-university-town', cityId: 'city-sgd', name: 'University Town', active: true },
  { id: 'area-sgd-paf-colony', cityId: 'city-sgd', name: 'PAF Colony', active: true },
  { id: 'area-sgd-mujahid-colony', cityId: 'city-sgd', name: 'Mujahid Colony', active: true },
  { id: 'area-sgd-fatima-jinnah-colony', cityId: 'city-sgd', name: 'Fatima Jinnah Colony', active: true },
  { id: 'area-sgd-farooq-colony', cityId: 'city-sgd', name: 'Farooq Colony', active: true },
  { id: 'area-sgd-queens-road', cityId: 'city-sgd', name: 'Queens Road', active: true },
  { id: 'area-sgd-sillanwali-road', cityId: 'city-sgd', name: 'Sillanwali Road', active: true },
  { id: 'area-sgd-stadium-road', cityId: 'city-sgd', name: 'Stadium Road', active: true },
  { id: 'area-grt-model-town-gujrat', cityId: 'city-grt', name: 'Model Town Gujrat', active: true },
  { id: 'area-grt-cantt-gujrat', cityId: 'city-grt', name: 'Cantt Gujrat', active: true },
  { id: 'area-grt-servis-mor', cityId: 'city-grt', name: 'Servis Mor', active: true },
  { id: 'area-grt-shadman-colony', cityId: 'city-grt', name: 'Shadman Colony', active: true },
  { id: 'area-grt-court-road', cityId: 'city-grt', name: 'Court Road', active: true },
  { id: 'area-grt-jalalpur-road', cityId: 'city-grt', name: 'Jalalpur Road', active: true },
  { id: 'area-grt-marghzar-colony', cityId: 'city-grt', name: 'Marghzar Colony', active: true },
  { id: 'area-grt-rehman-shaheed-road', cityId: 'city-grt', name: 'Rehman Shaheed Road', active: true },
  { id: 'area-grt-gts-chowk', cityId: 'city-grt', name: 'GTS Chowk', active: true },
  { id: 'area-grt-bhimbher-road', cityId: 'city-grt', name: 'Bhimbher Road', active: true },
  { id: 'area-swl-farid-town', cityId: 'city-swl', name: 'Farid Town', active: true },
  { id: 'area-swl-tariq-bin-ziad-colon', cityId: 'city-swl', name: 'Tariq Bin Ziad Colony', active: true },
  { id: 'area-swl-model-town-sahiwal', cityId: 'city-swl', name: 'Model Town Sahiwal', active: true },
  { id: 'area-swl-civil-lines', cityId: 'city-swl', name: 'Civil Lines', active: true },
  { id: 'area-swl-fateh-sher-colony', cityId: 'city-swl', name: 'Fateh Sher Colony', active: true },
  { id: 'area-swl-high-street', cityId: 'city-swl', name: 'High Street', active: true },
  { id: 'area-swl-noor-shah-road', cityId: 'city-swl', name: 'Noor Shah Road', active: true },
  { id: 'area-swl-bilal-colony', cityId: 'city-swl', name: 'Bilal Colony', active: true },
  { id: 'area-swl-pakpattan-road', cityId: 'city-swl', name: 'Pakpattan Road', active: true },
  { id: 'area-skp-housing-colony', cityId: 'city-skp', name: 'Housing Colony', active: true },
  { id: 'area-skp-civil-lines', cityId: 'city-skp', name: 'Civil Lines', active: true },
  { id: 'area-skp-stadium-road', cityId: 'city-skp', name: 'Stadium Road', active: true },
  { id: 'area-skp-lahore-road', cityId: 'city-skp', name: 'Lahore Road', active: true },
  { id: 'area-skp-tariq-road', cityId: 'city-skp', name: 'Tariq Road', active: true },
  { id: 'area-skp-batti-chowk', cityId: 'city-skp', name: 'Batti Chowk', active: true },
  { id: 'area-skp-farooqabad-road', cityId: 'city-skp', name: 'Farooqabad Road', active: true },
  { id: 'area-skp-hiran-minar-road', cityId: 'city-skp', name: 'Hiran Minar Road', active: true },
  { id: 'area-jhm-jhelum-cantt', cityId: 'city-jhm', name: 'Jhelum Cantt', active: true },
  { id: 'area-jhm-civil-lines', cityId: 'city-jhm', name: 'Civil Lines', active: true },
  { id: 'area-jhm-machine-mohalla-1-3', cityId: 'city-jhm', name: 'Machine Mohalla (1-3)', active: true },
  { id: 'area-jhm-bilal-town', cityId: 'city-jhm', name: 'Bilal Town', active: true },
  { id: 'area-jhm-model-town-jhelum', cityId: 'city-jhm', name: 'Model Town Jhelum', active: true },
  { id: 'area-jhm-kala-gujran', cityId: 'city-jhm', name: 'Kala Gujran', active: true },
  { id: 'area-jhm-g-t-road-jhelum', cityId: 'city-jhm', name: 'G.T. Road Jhelum', active: true },
  { id: 'area-jhm-river-view-colony', cityId: 'city-jhm', name: 'River View Colony', active: true },
  { id: 'area-ryk-model-town', cityId: 'city-ryk', name: 'Model Town', active: true },
  { id: 'area-ryk-gulshan-e-iqbal', cityId: 'city-ryk', name: 'Gulshan-e-Iqbal', active: true },
  { id: 'area-ryk-abbasia-town', cityId: 'city-ryk', name: 'Abbasia Town', active: true },
  { id: 'area-ryk-ryk-cantt', cityId: 'city-ryk', name: 'RYK Cantt', active: true },
  { id: 'area-ryk-kanju-town', cityId: 'city-ryk', name: 'Kanju Town', active: true },
  { id: 'area-ryk-trust-colony', cityId: 'city-ryk', name: 'Trust Colony', active: true },
  { id: 'area-ryk-shahbaz-pur-road', cityId: 'city-ryk', name: 'Shahbaz Pur Road', active: true },
  { id: 'area-ryk-abu-dhabi-road', cityId: 'city-ryk', name: 'Abu Dhabi Road', active: true },
  { id: 'area-skr-military-road', cityId: 'city-skr', name: 'Military Road', active: true },
  { id: 'area-skr-minara-road', cityId: 'city-skr', name: 'Minara Road', active: true },
  { id: 'area-skr-barrage-colony', cityId: 'city-skr', name: 'Barrage Colony', active: true },
  { id: 'area-skr-queens-road', cityId: 'city-skr', name: 'Queens Road', active: true },
  { id: 'area-skr-workshop-road', cityId: 'city-skr', name: 'Workshop Road', active: true },
  { id: 'area-skr-shalimar', cityId: 'city-skr', name: 'Shalimar', active: true },
  { id: 'area-skr-new-pind', cityId: 'city-skr', name: 'New Pind', active: true },
  { id: 'area-skr-old-sukkur', cityId: 'city-skr', name: 'Old Sukkur', active: true },
  { id: 'area-lrk-vip-road', cityId: 'city-lrk', name: 'VIP Road', active: true },
  { id: 'area-lrk-lahori-mohalla', cityId: 'city-lrk', name: 'Lahori Mohalla', active: true },
  { id: 'area-lrk-sachal-colony', cityId: 'city-lrk', name: 'Sachal Colony', active: true },
  { id: 'area-lrk-station-road', cityId: 'city-lrk', name: 'Station Road', active: true },
  { id: 'area-lrk-murad-wahan', cityId: 'city-lrk', name: 'Murad Wahan', active: true },
  { id: 'area-lrk-shaikh-zayed-colony', cityId: 'city-lrk', name: 'Shaikh Zayed Colony', active: true },
  { id: 'area-lrk-resham-gali', cityId: 'city-lrk', name: 'Resham Gali', active: true },
  { id: 'area-wns-society-area', cityId: 'city-wns', name: 'Society Area', active: true },
  { id: 'area-wns-taj-colony', cityId: 'city-wns', name: 'Taj Colony', active: true },
  { id: 'area-wns-line-par', cityId: 'city-wns', name: 'Line Par', active: true },
  { id: 'area-wns-manuabad', cityId: 'city-wns', name: 'Manuabad', active: true },
  { id: 'area-wns-housing-society', cityId: 'city-wns', name: 'Housing Society', active: true },
  { id: 'area-wns-court-road', cityId: 'city-wns', name: 'Court Road', active: true },
  { id: 'area-wns-kazi-ahmed-road', cityId: 'city-wns', name: 'Kazi Ahmed Road', active: true },
  { id: 'area-aat-mandian', cityId: 'city-aat', name: 'Mandian', active: true },
  { id: 'area-aat-supply-bazaar', cityId: 'city-aat', name: 'Supply Bazaar', active: true },
  { id: 'area-aat-abbottabad-cantt', cityId: 'city-aat', name: 'Abbottabad Cantt', active: true },
  { id: 'area-aat-pma-kakul-road', cityId: 'city-aat', name: 'PMA Kakul Road', active: true },
  { id: 'area-aat-jinnahabad', cityId: 'city-aat', name: 'Jinnahabad', active: true },
  { id: 'area-aat-link-road', cityId: 'city-aat', name: 'Link Road', active: true },
  { id: 'area-aat-nawan-shehr', cityId: 'city-aat', name: 'Nawan Shehr', active: true },
  { id: 'area-aat-murree-road', cityId: 'city-aat', name: 'Murree Road', active: true },
  { id: 'area-mdn-mardan-cantt', cityId: 'city-mdn', name: 'Mardan Cantt', active: true },
  { id: 'area-mdn-sheikh-maltoon-town-', cityId: 'city-mdn', name: 'Sheikh Maltoon Town (Sectors A-E)', active: true },
  { id: 'area-mdn-sheikh-maltoon-town-', cityId: 'city-mdn', name: 'Sheikh Maltoon Town (Sectors F-K)', active: true },
  { id: 'area-mdn-baghdada', cityId: 'city-mdn', name: 'Baghdada', active: true },
  { id: 'area-mdn-shamsi-road', cityId: 'city-mdn', name: 'Shamsi Road', active: true },
  { id: 'area-mdn-bank-road', cityId: 'city-mdn', name: 'Bank Road', active: true },
  { id: 'area-mdn-nowshera-road', cityId: 'city-mdn', name: 'Nowshera Road', active: true },
  { id: 'area-swt-mingora-city', cityId: 'city-swt', name: 'Mingora City', active: true },
  { id: 'area-swt-saidu-sharif', cityId: 'city-swt', name: 'Saidu Sharif', active: true },
  { id: 'area-swt-fizagat', cityId: 'city-swt', name: 'Fizagat', active: true },
  { id: 'area-swt-makan-bagh', cityId: 'city-swt', name: 'Makan Bagh', active: true },
  { id: 'area-swt-haji-baba', cityId: 'city-swt', name: 'Haji Baba', active: true },
  { id: 'area-swt-rahimabad', cityId: 'city-swt', name: 'Rahimabad', active: true },
  { id: 'area-swt-gulkada', cityId: 'city-swt', name: 'Gulkada', active: true },
  { id: 'area-swt-airport-road-mingora', cityId: 'city-swt', name: 'Airport Road Mingora', active: true },
  { id: 'area-gwd-bal-new-town-phases-1-2', cityId: 'city-gwd-bal', name: 'New Town (Phases 1-2)', active: true },
  { id: 'area-gwd-bal-new-town-phases-3-4', cityId: 'city-gwd-bal', name: 'New Town (Phases 3-4)', active: true },
  { id: 'area-gwd-bal-marine-drive', cityId: 'city-gwd-bal', name: 'Marine Drive', active: true },
  { id: 'area-gwd-bal-sangar-housing-proje', cityId: 'city-gwd-bal', name: 'Sangar Housing Project', active: true },
  { id: 'area-gwd-bal-airport-road-gwadar', cityId: 'city-gwd-bal', name: 'Airport Road Gwadar', active: true },
  { id: 'area-gwd-bal-gwadar-cantt', cityId: 'city-gwd-bal', name: 'Gwadar Cantt', active: true },
  { id: 'area-mir-sector-f-1-f-2', cityId: 'city-mir', name: 'Sector F-1 & F-2', active: true },
  { id: 'area-mir-sector-f-3-f-4', cityId: 'city-mir', name: 'Sector F-3 & F-4', active: true },
  { id: 'area-mir-sector-c-1-to-c-4', cityId: 'city-mir', name: 'Sector C-1 to C-4', active: true },
  { id: 'area-mir-sector-b-1-to-b-3', cityId: 'city-mir', name: 'Sector B-1 to B-3', active: true },
  { id: 'area-mir-new-city-mirpur', cityId: 'city-mir', name: 'New City Mirpur', active: true },
  { id: 'area-mir-allama-iqbal-road', cityId: 'city-mir', name: 'Allama Iqbal Road', active: true },
  { id: 'area-mir-chowk-shaheedan', cityId: 'city-mir', name: 'Chowk Shaheedan', active: true },
  { id: 'area-mzd-upper-chattar', cityId: 'city-mzd', name: 'Upper Chattar', active: true },
  { id: 'area-mzd-lower-chattar', cityId: 'city-mzd', name: 'Lower Chattar', active: true },
  { id: 'area-mzd-plate', cityId: 'city-mzd', name: 'Plate', active: true },
  { id: 'area-mzd-medina-market', cityId: 'city-mzd', name: 'Medina Market', active: true },
  { id: 'area-mzd-cmh-road', cityId: 'city-mzd', name: 'CMH Road', active: true },
  { id: 'area-mzd-tariqabad', cityId: 'city-mzd', name: 'Tariqabad', active: true },
  { id: 'area-mzd-gojra', cityId: 'city-mzd', name: 'Gojra', active: true },
  { id: 'area-mzd-naluchi', cityId: 'city-mzd', name: 'Naluchi', active: true },
  { id: 'area-glt-jutial', cityId: 'city-glt', name: 'Jutial', active: true },
  { id: 'area-glt-gilgit-cantt', cityId: 'city-glt', name: 'Gilgit Cantt', active: true },
  { id: 'area-glt-river-view-road', cityId: 'city-glt', name: 'River View Road', active: true },
  { id: 'area-glt-zulfiqarabad', cityId: 'city-glt', name: 'Zulfiqarabad', active: true },
  { id: 'area-glt-kashrote', cityId: 'city-glt', name: 'Kashrote', active: true },
  { id: 'area-glt-amphary', cityId: 'city-glt', name: 'Amphary', active: true },
  { id: 'area-glt-sonikot', cityId: 'city-glt', name: 'Sonikot', active: true },
  { id: 'area-glt-airport-road-gilgit', cityId: 'city-glt', name: 'Airport Road Gilgit', active: true },
];

// -----------------------------------------------------------------------------
// Geo Query Services (Supabase with Local Fallback)
// -----------------------------------------------------------------------------
export async function getProvinces(): Promise<GeoProvince[]> {
  if (!isSupabaseConfigured()) {
    return STARTER_PROVINCES;
  }

  try {
    const { data, error } = await (supabase as any)
      .from('provinces')
      .select('id, name, name_ur')
      .order('name');

    if (error || !data || data.length === 0) {
      return STARTER_PROVINCES;
    }

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      nameUr: p.name_ur || undefined,
    }));
  } catch {
    return STARTER_PROVINCES;
  }
}

export async function getCitiesForProvince(provinceNameOrId: string): Promise<GeoCity[]> {
  const matchingProvince = STARTER_PROVINCES.find(
    (p) => p.id === provinceNameOrId || p.name.toLowerCase() === provinceNameOrId.toLowerCase()
  );

  const fallbackCities = STARTER_CITIES.filter(
    (c) => matchingProvince ? c.provinceId === matchingProvince.id : true
  );

  if (!isSupabaseConfigured()) {
    return fallbackCities;
  }

  try {
    // Check if provinceNameOrId is a UUID or a name
    let query = (supabase as any).from('cities').select('id, province_id, name, name_ur, courier_city_code');

    if (provinceNameOrId.includes('-') && provinceNameOrId.length > 20) {
      query = query.eq('province_id', provinceNameOrId);
    } else {
      // Find province by name first
      const { data: provData } = await (supabase as any)
        .from('provinces')
        .select('id')
        .ilike('name', provinceNameOrId)
        .maybeSingle();

      if (provData) {
        query = query.eq('province_id', provData.id);
      }
    }

    const { data, error } = await query.order('name');
    if (error || !data || data.length === 0) {
      return fallbackCities;
    }

    return data.map((c: any) => {
      const fallback = STARTER_CITIES.find(sc => sc.name.toLowerCase() === c.name.toLowerCase());
      return {
        id: c.id,
        provinceId: c.province_id,
        name: c.name,
        nameUr: c.name_ur || fallback?.nameUr,
        courierCityCode: c.courier_city_code || fallback?.courierCityCode,
        lat: fallback?.lat,
        lng: fallback?.lng,
      };
    });
  } catch {
    return fallbackCities;
  }
}

// In-memory dynamic additions for offline development & immediate UI responsiveness
const inMemoryAddedAreas: GeoArea[] = [];

export async function getAreasForCity(cityNameOrId: string): Promise<GeoArea[]> {
  const matchingCity = STARTER_CITIES.find(
    (c) => c.id === cityNameOrId || c.name.toLowerCase() === cityNameOrId.toLowerCase()
  );

  const fallbackStarter = STARTER_AREAS.filter(
    (a) => matchingCity ? a.cityId === matchingCity.id : true
  );

  const dynamicForCity = inMemoryAddedAreas.filter(
    (a) => a.cityId === cityNameOrId || (matchingCity && a.cityId === matchingCity.id) || a.cityId === matchingCity?.name
  );

  const combinedFallback = [...fallbackStarter, ...dynamicForCity.filter(d => !fallbackStarter.some(f => f.name.toLowerCase() === d.name.toLowerCase()))];

  if (!isSupabaseConfigured()) {
    return combinedFallback;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cityNameOrId);
    let cityId = cityNameOrId;

    if (!isUuid) {
      const { data: cityData } = await (supabase as any)
        .from('cities')
        .select('id')
        .ilike('name', cityNameOrId)
        .maybeSingle();
      if (cityData?.id) {
        cityId = cityData.id;
      }
    }

    const { data, error } = await (supabase as any)
      .from('areas')
      .select('id, city_id, name, name_ur, active')
      .eq('city_id', cityId)
      .eq('active', true)
      .order('name');

    if (error || !data || data.length === 0) {
      return combinedFallback;
    }

    return data.map((a: any) => ({
      id: a.id,
      cityId: a.city_id,
      name: a.name,
      nameUr: a.name_ur || undefined,
      active: a.active ?? true,
    }));
  } catch {
    return combinedFallback;
  }
}

/**
 * Filter areas with Urdu and English search support
 */
export function filterAreas(areas: GeoArea[], query: string): GeoArea[] {
  const q = query.trim().toLowerCase();
  if (!q) return areas;

  return areas.filter((area) => {
    const matchEn = area.name.toLowerCase().includes(q);
    const matchUr = area.nameUr ? area.nameUr.includes(q) : false;
    return matchEn || matchUr;
  });
}

/**
 * Look up courier code for a city
 */
export function getCourierCityCode(cityName: string): string | null {
  const found = STARTER_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  return found?.courierCityCode || null;
}

/**
 * Look up city coordinates for map centering
 */
export function getCityCoordinates(cityName: string): [number, number] {
  const found = STARTER_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (found && found.lat && found.lng) {
    return [found.lat, found.lng];
  }
  // Default to Pakistan center
  return [31.5204, 74.3587]; // Lahore center
}

// -----------------------------------------------------------------------------
// Admin Area Management & CSV Importer Functions
// -----------------------------------------------------------------------------
export interface AdminAreaItem extends GeoArea {
  cityName?: string;
  provinceName?: string;
  courierCityCode?: string;
}

/**
 * Fetch all areas for Admin management screen with optional filters
 */
export async function getAllAdminAreas(filters?: {
  provinceName?: string;
  cityName?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<AdminAreaItem[]> {
  const query = filters?.search?.trim().toLowerCase() || '';

  if (!isSupabaseConfigured()) {
    // Return all starter areas + in-memory areas
    const allStarter: AdminAreaItem[] = [...STARTER_AREAS, ...inMemoryAddedAreas].map((a) => {
      const city = STARTER_CITIES.find((c) => c.id === a.cityId || c.name === a.cityId);
      const prov = city ? STARTER_PROVINCES.find((p) => p.id === city.provinceId) : undefined;
      return {
        ...a,
        cityName: city?.name || 'Lahore',
        provinceName: prov?.name || 'Punjab',
        courierCityCode: city?.courierCityCode || undefined,
      };
    });

    return allStarter.filter((item) => {
      if (filters?.provinceName && item.provinceName?.toLowerCase() !== filters.provinceName.toLowerCase()) {
        return false;
      }
      if (filters?.cityName && item.cityName?.toLowerCase() !== filters.cityName.toLowerCase()) {
        return false;
      }
      if (filters?.activeOnly && !item.active) {
        return false;
      }
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesUr = item.nameUr?.toLowerCase().includes(query);
        const matchesCity = item.cityName?.toLowerCase().includes(query);
        return matchesName || matchesUr || matchesCity;
      }
      return true;
    });
  }

  try {
    let dbQuery = (supabase as any)
      .from('areas')
      .select(`
        id,
        name,
        name_ur,
        active,
        city_id,
        cities (
          id,
          name,
          courier_city_code,
          provinces (
            id,
            name
          )
        )
      `)
      .order('name');

    if (filters?.activeOnly) {
      dbQuery = dbQuery.eq('active', true);
    }

    const { data, error } = await dbQuery;

    if (error || !data || data.length === 0) {
      return getAllAdminAreas({ ...filters, activeOnly: false });
    }

    let items: AdminAreaItem[] = data.map((d: any) => ({
      id: d.id,
      cityId: d.city_id,
      name: d.name,
      nameUr: d.name_ur || undefined,
      active: d.active ?? true,
      cityName: d.cities?.name || 'Unknown',
      courierCityCode: d.cities?.courier_city_code || undefined,
      provinceName: d.cities?.provinces?.name || 'Unknown',
    }));

    if (filters?.provinceName) {
      items = items.filter(
        (i) => i.provinceName?.toLowerCase() === filters.provinceName?.toLowerCase()
      );
    }
    if (filters?.cityName) {
      items = items.filter(
        (i) => i.cityName?.toLowerCase() === filters.cityName?.toLowerCase()
      );
    }
    if (query) {
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          (i.nameUr && i.nameUr.includes(query)) ||
          (i.cityName && i.cityName.toLowerCase().includes(query))
      );
    }

    return items;
  } catch (e) {
    console.warn('getAllAdminAreas fallback:', e);
    return [];
  }
}

/**
 * Add a new area (used by Admin screen)
 */
export async function addAreaRecord(input: {
  cityId: string;
  cityName?: string;
  name: string;
  nameUr?: string;
  active?: boolean;
}): Promise<{ success: boolean; area?: GeoArea; error?: string }> {
  const newArea: GeoArea = {
    id: 'area-custom-' + Date.now(),
    cityId: input.cityId,
    name: input.name.trim(),
    nameUr: input.nameUr?.trim() || undefined,
    active: input.active ?? true,
  };

  inMemoryAddedAreas.push(newArea);

  if (!isSupabaseConfigured()) {
    return { success: true, area: newArea };
  }

  try {
    const { data, error } = await (supabase as any)
      .from('areas')
      .insert({
        city_id: input.cityId,
        name: input.name.trim(),
        name_ur: input.nameUr?.trim() || null,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      area: {
        id: data.id,
        cityId: data.city_id,
        name: data.name,
        nameUr: data.name_ur || undefined,
        active: data.active,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add area' };
  }
}

/**
 * Toggle an area's active status (disable/enable without deleting)
 */
export async function toggleAreaRecordActive(
  areaId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback list
  const foundMem = inMemoryAddedAreas.find((a) => a.id === areaId);
  if (foundMem) {
    foundMem.active = active;
  }
  const foundStarter = STARTER_AREAS.find((a) => a.id === areaId);
  if (foundStarter) {
    foundStarter.active = active;
  }

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await (supabase as any)
      .from('areas')
      .update({ active })
      .eq('id', areaId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing area's name, urdu name, or active status
 */
export async function updateAreaRecord(
  areaId: string,
  updates: { name?: string; nameUr?: string; active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  // Update in-memory fallback list
  const foundMem = inMemoryAddedAreas.find((a) => a.id === areaId);
  if (foundMem) {
    if (updates.name !== undefined) foundMem.name = updates.name;
    if (updates.nameUr !== undefined) foundMem.nameUr = updates.nameUr;
    if (updates.active !== undefined) foundMem.active = updates.active;
  }

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.nameUr !== undefined) payload.name_ur = updates.nameUr.trim() || null;
    if (updates.active !== undefined) payload.active = updates.active;

    const { error } = await (supabase as any)
      .from('areas')
      .update(payload)
      .eq('id', areaId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete an area record
 */
export async function deleteAreaRecord(areaId: string): Promise<{ success: boolean; error?: string }> {
  const memIdx = inMemoryAddedAreas.findIndex((a) => a.id === areaId);
  if (memIdx !== -1) {
    inMemoryAddedAreas.splice(memIdx, 1);
  }

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await (supabase as any)
      .from('areas')
      .delete()
      .eq('id', areaId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Parse CSV text into validated area rows
 * Format: province,city,area,courier_city_code[,area_ur]
 */
export function parseAreaCsv(csvText: string): {
  rows: Array<{
    province: string;
    city: string;
    area: string;
    courier_city_code?: string;
    area_ur?: string;
  }>;
  errors: string[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ['CSV content is empty.'] };
  }

  const errors: string[] = [];
  const rows: Array<{
    province: string;
    city: string;
    area: string;
    courier_city_code?: string;
    area_ur?: string;
  }> = [];

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));

  const provinceIdx = headers.findIndex((h) => h === 'province' || h === 'prov' || h === 'province_name');
  const cityIdx = headers.findIndex((h) => h === 'city' || h === 'city_name');
  const areaIdx = headers.findIndex((h) => h === 'area' || h === 'area_name' || h === 'sector');
  const codeIdx = headers.findIndex((h) => h === 'courier_city_code' || h === 'courier_code' || h === 'code');
  const urIdx = headers.findIndex((h) => h === 'area_ur' || h === 'name_ur' || h === 'urdu');

  if (provinceIdx === -1 || cityIdx === -1 || areaIdx === -1) {
    return {
      rows: [],
      errors: [
        'Invalid CSV headers. Required columns: "province", "city", "area" (optional: "courier_city_code", "area_ur"). Received: ' +
          headers.join(', '),
      ],
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split on comma while respecting quotes
    const cells = rawLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
      c.trim().replace(/^["']|["']$/g, '').trim()
    );

    const province = cells[provinceIdx] || '';
    const city = cells[cityIdx] || '';
    const area = cells[areaIdx] || '';
    const courier_city_code = codeIdx !== -1 ? cells[codeIdx] : undefined;
    const area_ur = urIdx !== -1 ? cells[urIdx] : undefined;

    if (!province || !city || !area) {
      errors.push(`Row ${i + 1}: Missing required fields (province, city, and area are required). Line: "${rawLine}"`);
      continue;
    }

    rows.push({
      province,
      city,
      area,
      courier_city_code: courier_city_code || undefined,
      area_ur: area_ur || undefined,
    });
  }

  return { rows, errors };
}
