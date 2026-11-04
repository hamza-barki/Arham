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
  // Lahore
  { id: 'area-lhe-gulberg', cityId: 'city-lhe', name: 'Gulberg II & III', nameUr: 'گلبرگ 2 اور 3', active: true },
  { id: 'area-lhe-dha14', cityId: 'city-lhe', name: 'DHA Phase 1-4', nameUr: 'ڈی ایچ اے فیز 1 تا 4', active: true },
  { id: 'area-lhe-dha58', cityId: 'city-lhe', name: 'DHA Phase 5-8', nameUr: 'ڈی ایچ اے فیز 5 تا 8', active: true },
  { id: 'area-lhe-dha9', cityId: 'city-lhe', name: 'DHA Phase 9 Prism', nameUr: 'ڈی ایچ اے فیز 9 پرزم', active: true },
  { id: 'area-lhe-johar', cityId: 'city-lhe', name: 'Johar Town (Phases 1 & 2)', nameUr: 'جوہر ٹاؤن فیز 1 و 2', active: true },
  { id: 'area-lhe-model', cityId: 'city-lhe', name: 'Model Town', nameUr: 'ماڈل ٹاؤن', active: true },
  { id: 'area-lhe-bahria', cityId: 'city-lhe', name: 'Bahria Town Lahore', nameUr: 'بحریہ ٹاؤن لاہور', active: true },
  { id: 'area-lhe-cantt', cityId: 'city-lhe', name: 'Lahore Cantt & Saddar', nameUr: 'لاہور کینٹ و صدر', active: true },
  { id: 'area-lhe-faisal', cityId: 'city-lhe', name: 'Faisal Town', nameUr: 'فیصل ٹاؤن', active: true },
  { id: 'area-lhe-garden', cityId: 'city-lhe', name: 'Garden Town', nameUr: 'گارڈن ٹاؤن', active: true },
  { id: 'area-lhe-wapda', cityId: 'city-lhe', name: 'Wapda Town', nameUr: 'واپڈا ٹاؤن', active: true },
  { id: 'area-lhe-iqbal', cityId: 'city-lhe', name: 'Allama Iqbal Town', nameUr: 'علامہ اقبال ٹاؤن', active: true },
  { id: 'area-lhe-askari', cityId: 'city-lhe', name: 'Askari 10 & 11', nameUr: 'عسکری 10 اور 11', active: true },
  { id: 'area-lhe-valencia', cityId: 'city-lhe', name: 'Valencia Town', nameUr: 'ویلنشیا ٹاؤن', active: true },
  { id: 'area-lhe-lake', cityId: 'city-lhe', name: 'Lake City', nameUr: 'لیک سٹی', active: true },
  { id: 'area-lhe-cavalry', cityId: 'city-lhe', name: 'Cavalry Ground', nameUr: 'کیولری گراؤنڈ', active: true },
  { id: 'area-lhe-shadman', cityId: 'city-lhe', name: 'Shadman', nameUr: 'شادمان', active: true },
  { id: 'area-lhe-samanabad', cityId: 'city-lhe', name: 'Samanabad', nameUr: 'سمن آباد', active: true },

  // Karachi
  { id: 'area-khi-clifton', cityId: 'city-khi', name: 'Clifton (Blocks 1-9)', nameUr: 'کلفٹن بلاک 1 تا 9', active: true },
  { id: 'area-khi-dha', cityId: 'city-khi', name: 'DHA Defence (Phases 1-8)', nameUr: 'ڈی ایچ اے ڈیفنس فیز 1 تا 8', active: true },
  { id: 'area-khi-gulshan', cityId: 'city-khi', name: 'Gulshan-e-Iqbal', nameUr: 'گلشن اقبال', active: true },
  { id: 'area-khi-johar', cityId: 'city-khi', name: 'Gulistan-e-Johar', nameUr: 'گلستان جوہر', active: true },
  { id: 'area-khi-pechs', cityId: 'city-khi', name: 'PECHS (Blocks 1-6)', nameUr: 'پی ای سی ایچ ایس', active: true },
  { id: 'area-khi-nnazimabad', cityId: 'city-khi', name: 'North Nazimabad', nameUr: 'نارتھ ناظم آباد', active: true },
  { id: 'area-khi-nazimabad', cityId: 'city-khi', name: 'Nazimabad', nameUr: 'ناظم آباد', active: true },
  { id: 'area-khi-fbarea', cityId: 'city-khi', name: 'Federal B Area (FB Area)', nameUr: 'فیڈرل بی ایریا', active: true },
  { id: 'area-khi-saddar', cityId: 'city-khi', name: 'Saddar & Tariq Road', nameUr: 'صدر و طارق روڈ', active: true },
  { id: 'area-khi-malir', cityId: 'city-khi', name: 'Malir Cantt', nameUr: 'ملیر کینٹ', active: true },
  { id: 'area-khi-bahria', cityId: 'city-khi', name: 'Bahria Town Karachi', nameUr: 'بحریہ ٹاؤن کراچی', active: true },
  { id: 'area-khi-korangi', cityId: 'city-khi', name: 'Korangi Industrial Area', nameUr: 'کورنگی انڈسٹریل ایریا', active: true },
  { id: 'area-khi-scheme33', cityId: 'city-khi', name: 'Scheme 33', nameUr: 'اسکیم 33', active: true },
  { id: 'area-khi-dhoraji', cityId: 'city-khi', name: 'Dhoraji Colony', nameUr: 'دھوراجی کالونی', active: true },

  // Islamabad
  { id: 'area-isb-f6f7', cityId: 'city-isb', name: 'Sector F-6 & F-7', nameUr: 'سیکٹر ایف 6 اور ایف 7', active: true },
  { id: 'area-isb-f8f10', cityId: 'city-isb', name: 'Sector F-8 & F-10', nameUr: 'سیکٹر ایف 8 اور ایف 10', active: true },
  { id: 'area-isb-f11e11', cityId: 'city-isb', name: 'Sector F-11 & E-11', nameUr: 'سیکٹر ایف 11 اور ای 11', active: true },
  { id: 'area-isb-g6g8', cityId: 'city-isb', name: 'Sector G-6, G-7, G-8', nameUr: 'سیکٹر جی 6، 7، 8', active: true },
  { id: 'area-isb-g9g11', cityId: 'city-isb', name: 'Sector G-9, G-10, G-11', nameUr: 'سیکٹر جی 9، 10، 11', active: true },
  { id: 'area-isb-i8i9', cityId: 'city-isb', name: 'Sector I-8 & I-9', nameUr: 'سیکٹر آئی 8 اور آئی 9', active: true },
  { id: 'area-isb-dha', cityId: 'city-isb', name: 'DHA Islamabad (Phases 1 & 2)', nameUr: 'ڈی ایچ اے اسلام آباد فیز 1 و 2', active: true },
  { id: 'area-isb-bahria', cityId: 'city-isb', name: 'Bahria Enclave', nameUr: 'بحریہ انکلیو', active: true },
  { id: 'area-isb-pwd', cityId: 'city-isb', name: 'PWD Housing Society', nameUr: 'پی ڈبلیو ڈی ہاؤسنگ سوسائٹی', active: true },
  { id: 'area-isb-banigala', cityId: 'city-isb', name: 'Bani Gala', nameUr: 'بنی گالہ', active: true },

  // Rawalpindi
  { id: 'area-rwp-bahria', cityId: 'city-rwp', name: 'Bahria Town (Phases 1-8)', nameUr: 'بحریہ ٹاؤن فیز 1 تا 8', active: true },
  { id: 'area-rwp-saddar', cityId: 'city-rwp', name: 'Saddar Cantt', nameUr: 'صدر کینٹ راولپنڈی', active: true },
  { id: 'area-rwp-satellite', cityId: 'city-rwp', name: 'Satellite Town', nameUr: 'سیٹلائٹ ٹاؤن', active: true },
  { id: 'area-rwp-chaklala', cityId: 'city-rwp', name: 'Chaklala Scheme 3', nameUr: 'چکلالہ اسکیم 3', active: true },
  { id: 'area-rwp-westridge', cityId: 'city-rwp', name: 'Westridge', nameUr: 'ویسٹریج', active: true },
  { id: 'area-rwp-askari14', cityId: 'city-rwp', name: 'Askari 14', nameUr: 'عسکری 14', active: true },

  // Faisalabad
  { id: 'area-fsd-madina', cityId: 'city-fsd', name: 'Madina Town', nameUr: 'مدینہ ٹاؤن', active: true },
  { id: 'area-fsd-peoples', cityId: 'city-fsd', name: 'Peoples Colony No 1 & 2', nameUr: 'پیپلز کالونی نمبر 1 و 2', active: true },
  { id: 'area-fsd-dground', cityId: 'city-fsd', name: 'D Ground', nameUr: 'ڈی گراؤنڈ', active: true },
  { id: 'area-fsd-kohinoor', cityId: 'city-fsd', name: 'Kohinoor City', nameUr: 'کوہ نور سٹی', active: true },

  // Multan
  { id: 'area-mux-gulgasht', cityId: 'city-mux', name: 'Gulgasht Colony', nameUr: 'گلگشت کالونی', active: true },
  { id: 'area-mux-cantt', cityId: 'city-mux', name: 'Multan Cantt', nameUr: 'ملتان کینٹ', active: true },
  { id: 'area-mux-bosan', cityId: 'city-mux', name: 'Bosan Road', nameUr: 'بوسن روڈ', active: true },
  { id: 'area-mux-dha', cityId: 'city-mux', name: 'DHA Multan', nameUr: 'ڈی ایچ اے ملتان', active: true },

  // Peshawar
  { id: 'area-pew-hayatabad', cityId: 'city-pew', name: 'Hayatabad (Phases 1-7)', nameUr: 'حیات آباد فیز 1 تا 7', active: true },
  { id: 'area-pew-univ', cityId: 'city-pew', name: 'University Town', nameUr: 'یونیورسٹی ٹاؤن', active: true },
  { id: 'area-pew-cantt', cityId: 'city-pew', name: 'Peshawar Cantt', nameUr: 'پشاور کینٹ', active: true },
  { id: 'area-pew-dha', cityId: 'city-pew', name: 'DHA Peshawar', nameUr: 'ڈی ایچ اے پشاور', active: true },

  // Quetta
  { id: 'area-uet-cantt', cityId: 'city-uet', name: 'Quetta Cantt', nameUr: 'کوئٹہ کینٹ', active: true },
  { id: 'area-uet-jinnah', cityId: 'city-uet', name: 'Jinnah Town', nameUr: 'جناح ٹاؤن', active: true },
  { id: 'area-uet-shahbaz', cityId: 'city-uet', name: 'Shahbaz Town', nameUr: 'شہباز ٹاؤن', active: true },

  // Gujranwala
  { id: 'area-gwd-dc', cityId: 'city-gwd', name: 'DC Colony', nameUr: 'ڈی سی کالونی', active: true },
  { id: 'area-gwd-model', cityId: 'city-gwd', name: 'Model Town Gujranwala', nameUr: 'ماڈل ٹاؤن گوجرانوالہ', active: true },
  { id: 'area-gwd-master', cityId: 'city-gwd', name: 'Master City', nameUr: 'ماسٹر سٹی', active: true },

  // Sialkot
  { id: 'area-skt-cantt', cityId: 'city-skt', name: 'Sialkot Cantt', nameUr: 'سیالکوٹ کینٹ', active: true },
  { id: 'area-skt-model', cityId: 'city-skt', name: 'Model Town Sialkot', nameUr: 'ماڈل ٹاؤن سیالکوٹ', active: true },

  // Hyderabad
  { id: 'area-hyd-latifabad', cityId: 'city-hyd', name: 'Latifabad (Units 1-12)', nameUr: 'لطیف آباد یونٹس 1 تا 12', active: true },
  { id: 'area-hyd-qasimabad', cityId: 'city-hyd', name: 'Qasimabad', nameUr: 'قاسم آباد', active: true },
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
