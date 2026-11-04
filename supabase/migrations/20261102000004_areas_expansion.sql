-- ==============================================================================
-- PHASE 4: PAKISTAN GEOGRAPHIC HIERARCHY EXPANSION & AREAS SEED
-- Migration: 20261102000004_areas_expansion.sql
-- ==============================================================================

-- 1. Ensure columns exist on orders and addresses
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS requires_area_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_custom_area       BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS is_custom_area       BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_area_review ON public.orders(requires_area_review) WHERE requires_area_review = true;

-- 2. Seed All 7 Administrative Territories / Provinces of Pakistan
INSERT INTO public.provinces (id, name, name_ur) VALUES
  ('prov0000-0000-0000-0000-000000000001', 'Punjab',                         'پنجاب'),
  ('prov0000-0000-0000-0000-000000000002', 'Sindh',                          'سندھ'),
  ('prov0000-0000-0000-0000-000000000003', 'Khyber Pakhtunkhwa',             'خیبر پختونخوا'),
  ('prov0000-0000-0000-0000-000000000004', 'Balochistan',                    'بلوچستان'),
  ('prov0000-0000-0000-0000-000000000005', 'Islamabad Capital Territory',    'وفاقی دارالحکومت اسلام آباد'),
  ('prov0000-0000-0000-0000-000000000006', 'Azad Jammu and Kashmir',         'آزاد جموں و کشمیر'),
  ('prov0000-0000-0000-0000-000000000007', 'Gilgit-Baltistan',               'گلگت بلتستان')
ON CONFLICT (name) DO UPDATE SET name_ur = EXCLUDED.name_ur;

-- 3. Seed Major Cities with Official Courier Codes (PostEx, Leopards, TCS compatible)
INSERT INTO public.cities (id, province_id, name, name_ur, courier_city_code) VALUES
  -- Punjab
  ('city0000-0000-0000-0000-000000000001', 'prov0000-0000-0000-0000-000000000001', 'Lahore',       'لاہور',         'LHE'),
  ('city0000-0000-0000-0000-000000000002', 'prov0000-0000-0000-0000-000000000001', 'Faisalabad',   'فیصل آباد',     'FSD'),
  ('city0000-0000-0000-0000-000000000007', 'prov0000-0000-0000-0000-000000000001', 'Rawalpindi',   'راولپنڈی',       'RWP'),
  ('city0000-0000-0000-0000-000000000008', 'prov0000-0000-0000-0000-000000000001', 'Multan',       'ملتان',         'MUX'),
  ('city0000-0000-0000-0000-000000000009', 'prov0000-0000-0000-0000-000000000001', 'Gujranwala',   'گوجرانوالہ',     'GWD'),
  ('city0000-0000-0000-0000-000000000010', 'prov0000-0000-0000-0000-000000000001', 'Sialkot',      'سیالکوٹ',       'SKT'),
  ('city0000-0000-0000-0000-000000000011', 'prov0000-0000-0000-0000-000000000001', 'Bahawalpur',   'بہاولپور',       'BHV'),
  ('city0000-0000-0000-0000-000000000012', 'prov0000-0000-0000-0000-000000000001', 'Sargodha',     'سرگودھا',       'SGD'),
  ('city0000-0000-0000-0000-000000000013', 'prov0000-0000-0000-0000-000000000001', 'Gujrat',       'گجرات',         'GRT'),
  ('city0000-0000-0000-0000-000000000014', 'prov0000-0000-0000-0000-000000000001', 'Sahiwal',      'ساہیوال',       'SWL'),
  ('city0000-0000-0000-0000-000000000015', 'prov0000-0000-0000-0000-000000000001', 'Sheikhupura',  'شیخوپورہ',      'SKP'),
  ('city0000-0000-0000-0000-000000000016', 'prov0000-0000-0000-0000-000000000001', 'Jhelum',       'جہلم',          'JHM'),
  ('city0000-0000-0000-0000-000000000017', 'prov0000-0000-0000-0000-000000000001', 'Rahim Yar Khan','رحیم یار خان',   'RYK'),

  -- Sindh
  ('city0000-0000-0000-0000-000000000003', 'prov0000-0000-0000-0000-000000000002', 'Karachi',      'کراچی',         'KHI'),
  ('city0000-0000-0000-0000-000000000004', 'prov0000-0000-0000-0000-000000000002', 'Hyderabad',    'حیدرآباد',       'HYD'),
  ('city0000-0000-0000-0000-000000000018', 'prov0000-0000-0000-0000-000000000002', 'Sukkur',       'سکھر',          'SKR'),
  ('city0000-0000-0000-0000-000000000019', 'prov0000-0000-0000-0000-000000000002', 'Larkana',      'لاڑکانہ',        'LRK'),
  ('city0000-0000-0000-0000-000000000020', 'prov0000-0000-0000-0000-000000000002', 'Nawabshah',    'نواب شاہ',       'WNS'),

  -- Khyber Pakhtunkhwa
  ('city0000-0000-0000-0000-000000000005', 'prov0000-0000-0000-0000-000000000003', 'Peshawar',     'پشاور',         'PEW'),
  ('city0000-0000-0000-0000-000000000021', 'prov0000-0000-0000-0000-000000000003', 'Abbottabad',   'ایبٹ آباد',     'AAT'),
  ('city0000-0000-0000-0000-000000000022', 'prov0000-0000-0000-0000-000000000003', 'Mardan',       'مردان',         'MDN'),
  ('city0000-0000-0000-0000-000000000023', 'prov0000-0000-0000-0000-000000000003', 'Swat',         'سوات',          'SWT'),

  -- Balochistan
  ('city0000-0000-0000-0000-000000000006', 'prov0000-0000-0000-0000-000000000004', 'Quetta',       'کوئٹہ',         'UET'),
  ('city0000-0000-0000-0000-000000000024', 'prov0000-0000-0000-0000-000000000004', 'Gwadar',       'گوادر',         'GWD'),

  -- Islamabad Capital Territory
  ('city0000-0000-0000-0000-000000000025', 'prov0000-0000-0000-0000-000000000005', 'Islamabad',    'اسلام آباد',     'ISB'),

  -- Azad Jammu and Kashmir
  ('city0000-0000-0000-0000-000000000026', 'prov0000-0000-0000-0000-000000000006', 'Mirpur',       'میرپور',        'MIR'),
  ('city0000-0000-0000-0000-000000000027', 'prov0000-0000-0000-0000-000000000006', 'Muzaffarabad', 'مظفر آباد',     'MZD'),

  -- Gilgit-Baltistan
  ('city0000-0000-0000-0000-000000000028', 'prov0000-0000-0000-0000-000000000007', 'Gilgit',       'گلگت',          'GLT')
ON CONFLICT (province_id, name) DO UPDATE SET
  courier_city_code = EXCLUDED.courier_city_code,
  name_ur = EXCLUDED.name_ur;

-- 4. Seed Well-Known Areas for Major Cities with English & Urdu Names
-- Lahore Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000001', 'Gulberg II & III',       'گلبرگ 2 اور 3',          true),
  ('city0000-0000-0000-0000-000000000001', 'DHA Phase 1-4',          'ڈی ایچ اے فیز 1 تا 4',    true),
  ('city0000-0000-0000-0000-000000000001', 'DHA Phase 5-8',          'ڈی ایچ اے فیز 5 تا 8',    true),
  ('city0000-0000-0000-0000-000000000001', 'DHA Phase 9 Prism',      'ڈی ایچ اے فیز 9 پرزم',    true),
  ('city0000-0000-0000-0000-000000000001', 'Johar Town (Phase 1 & 2)','جوہر ٹاؤن فیز 1 و 2',    true),
  ('city0000-0000-0000-0000-000000000001', 'Model Town',              'ماڈل ٹاؤن',              true),
  ('city0000-0000-0000-0000-000000000001', 'Bahria Town',            'بحریہ ٹاؤن',             true),
  ('city0000-0000-0000-0000-000000000001', 'Lahore Cantt',           'لاہور کینٹ',             true),
  ('city0000-0000-0000-0000-000000000001', 'Faisal Town',            'فیصل ٹاؤن',              true),
  ('city0000-0000-0000-0000-000000000001', 'Garden Town',            'گارڈن ٹاؤن',             true),
  ('city0000-0000-0000-0000-000000000001', 'Wapda Town',             'واپڈا ٹاؤن',             true),
  ('city0000-0000-0000-0000-000000000001', 'Allama Iqbal Town',      'علامہ اقبال ٹاؤن',       true),
  ('city0000-0000-0000-0000-000000000001', 'Askari 10 & 11',         'عسکری 10 اور 11',        true),
  ('city0000-0000-0000-0000-000000000001', 'Cavalry Ground',         'کیولری گراؤنڈ',          true),
  ('city0000-0000-0000-0000-000000000001', 'Valencia Town',          'ویلنشیا ٹاؤن',           true),
  ('city0000-0000-0000-0000-000000000001', 'Lake City',              'لیک سٹی',                true),
  ('city0000-0000-0000-0000-000000000001', 'Shadman',                'شادمان',                 true),
  ('city0000-0000-0000-0000-000000000001', 'Samanabad',              'سمن آباد',               true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Karachi Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000003', 'Clifton (Blocks 1-9)',   'کلفٹن بلاک 1 تا 9',      true),
  ('city0000-0000-0000-0000-000000000003', 'DHA Defence (Phase 1-8)','ڈی ایچ اے ڈیفنس فیز 1-8',true),
  ('city0000-0000-0000-0000-000000000003', 'Gulshan-e-Iqbal',        'گلشن اقبال',             true),
  ('city0000-0000-0000-0000-000000000003', 'Gulistan-e-Johar',       'گلستان جوہر',            true),
  ('city0000-0000-0000-0000-000000000003', 'PECHS (Blocks 1-6)',     'پی ای سی ایچ ایس',       true),
  ('city0000-0000-0000-0000-000000000003', 'North Nazimabad',        'نارتھ ناظم آباد',        true),
  ('city0000-0000-0000-0000-000000000003', 'Nazimabad',              'ناظم آباد',              true),
  ('city0000-0000-0000-0000-000000000003', 'Federal B Area (FB Area)','فیڈرل بی ایریا',         true),
  ('city0000-0000-0000-0000-000000000003', 'Saddar & Tariq Road',    'صدر و طارق روڈ',         true),
  ('city0000-0000-0000-0000-000000000003', 'Malir Cantt',            'ملیر کینٹ',              true),
  ('city0000-0000-0000-0000-000000000003', 'Bahria Town Karachi',    'بحریہ ٹاؤن کراچی',       true),
  ('city0000-0000-0000-0000-000000000003', 'Korangi Industrial Area','کورنگی انڈسٹریل ایریا',  true),
  ('city0000-0000-0000-0000-000000000003', 'Scheme 33',              'اسکیم 33',               true),
  ('city0000-0000-0000-0000-000000000003', 'Dhoraji Colony',         'دھوراجی کالونی',         true),
  ('city0000-0000-0000-0000-000000000003', 'Jamshed Road',           'جمشید روڈ',              true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Islamabad Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000025', 'Sector F-6 & F-7',       'سیکٹر ایف 6 اور ایف 7',  true),
  ('city0000-0000-0000-0000-000000000025', 'Sector F-8 & F-10',      'سیکٹر ایف 8 اور ایف 10', true),
  ('city0000-0000-0000-0000-000000000025', 'Sector F-11 & E-11',     'سیکٹر ایف 11 اور ای 11', true),
  ('city0000-0000-0000-0000-000000000025', 'Sector G-6, G-7, G-8',   'سیکٹر جی 6، 7، 8',       true),
  ('city0000-0000-0000-0000-000000000025', 'Sector G-9, G-10, G-11', 'سیکٹر جی 9، 10، 11',     true),
  ('city0000-0000-0000-0000-000000000025', 'Sector I-8 & I-9',       'سیکٹر آئی 8 اور آئی 9',  true),
  ('city0000-0000-0000-0000-000000000025', 'DHA Phase 1 & 2',        'ڈی ایچ اے فیز 1 و 2',    true),
  ('city0000-0000-0000-0000-000000000025', 'Bahria Enclave',         'بحریہ انکلیو',           true),
  ('city0000-0000-0000-0000-000000000025', 'Bani Gala',              'بنی گالہ',               true),
  ('city0000-0000-0000-0000-000000000025', 'PWD Housing Society',    'پی ڈبلیو ڈی ہاؤسنگ سوسائٹی',true),
  ('city0000-0000-0000-0000-000000000025', 'Soan Gardens',           'سواں گارڈنز',            true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Rawalpindi Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000007', 'Bahria Town (Phase 1-8)','بحریہ ٹاؤن فیز 1 تا 8',  true),
  ('city0000-0000-0000-0000-000000000007', 'Saddar Cantt',           'صدر کینٹ',               true),
  ('city0000-0000-0000-0000-000000000007', 'Satellite Town',         'سیٹلائٹ ٹاؤن',           true),
  ('city0000-0000-0000-0000-000000000007', 'Chaklala Scheme 3',      'چکلالہ اسکیم 3',         true),
  ('city0000-0000-0000-0000-000000000007', 'Westridge',              'ویسٹریج',                true),
  ('city0000-0000-0000-0000-000000000007', 'Askari 14',              'عسکری 14',               true),
  ('city0000-0000-0000-0000-000000000007', 'Gulraiz Housing Scheme', 'گلریز ہاؤسنگ اسکیم',     true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Faisalabad Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000002', 'Madina Town',            'مدینہ ٹاؤن',             true),
  ('city0000-0000-0000-0000-000000000002', 'Peoples Colony No 1 & 2','پیپلز کالونی نمبر 1 و 2',true),
  ('city0000-0000-0000-0000-000000000002', 'D Ground',               'ڈی گراؤنڈ',              true),
  ('city0000-0000-0000-0000-000000000002', 'Samanabad',              'سمن آباد فیصل آباد',      true),
  ('city0000-0000-0000-0000-000000000002', 'Ghulam Muhammad Abad',   'غلام محمد آباد',         true),
  ('city0000-0000-0000-0000-000000000002', 'Kohinoor City',          'کوہ نور سٹی',            true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Multan Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000008', 'Gulgasht Colony',        'گلگشت کالونی',           true),
  ('city0000-0000-0000-0000-000000000008', 'Multan Cantt',           'ملتان کینٹ',             true),
  ('city0000-0000-0000-0000-000000000008', 'Bosan Road',             'بوسن روڈ',               true),
  ('city0000-0000-0000-0000-000000000008', 'Shah Rukn-e-Alam Colony','شاہ رکن عالم کالونی',    true),
  ('city0000-0000-0000-0000-000000000008', 'DHA Multan',             'ڈی ایچ اے ملتان',        true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Peshawar Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000005', 'Hayatabad (Phases 1-7)', 'حیات آباد فیز 1 تا 7',   true),
  ('city0000-0000-0000-0000-000000000005', 'University Town',        'یونیورسٹی ٹاؤن',         true),
  ('city0000-0000-0000-0000-000000000005', 'Peshawar Cantt',         'پشاور کینٹ',             true),
  ('city0000-0000-0000-0000-000000000005', 'Gulbahar',               'گل بہار',                true),
  ('city0000-0000-0000-0000-000000000005', 'DHA Peshawar',           'ڈی ایچ اے پشاور',        true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Quetta Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000006', 'Quetta Cantt',           'کوئٹہ کینٹ',             true),
  ('city0000-0000-0000-0000-000000000006', 'Jinnah Town',            'جناح ٹاؤن',              true),
  ('city0000-0000-0000-0000-000000000006', 'Shahbaz Town',           'شہباز ٹاؤن',             true),
  ('city0000-0000-0000-0000-000000000006', 'Samungli Road',          'سمونگلی روڈ',            true),
  ('city0000-0000-0000-0000-000000000006', 'Zarghoon Road',          'زرغون روڈ',              true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Gujranwala Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000009', 'DC Colony',              'ڈی سی کالونی',           true),
  ('city0000-0000-0000-0000-000000000009', 'Model Town Gujranwala',  'ماڈل ٹاؤن گوجرانوالہ',   true),
  ('city0000-0000-0000-0000-000000000009', 'Master City',            'ماسٹر سٹی',              true),
  ('city0000-0000-0000-0000-000000000009', 'Wapda Town Gujranwala',  'واپڈا ٹاؤن گوجرانوالہ',   true),
  ('city0000-0000-0000-0000-000000000009', 'Satellite Town',         'سیٹلائٹ ٹاؤن گوجرانوالہ',true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Sialkot Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000010', 'Sialkot Cantt',          'سیالکوٹ کینٹ',           true),
  ('city0000-0000-0000-0000-000000000010', 'Model Town Sialkot',     'ماڈل ٹاؤن سیالکوٹ',      true),
  ('city0000-0000-0000-0000-000000000010', 'Paris Road',             'پیرس روڈ',               true),
  ('city0000-0000-0000-0000-000000000010', 'Kashmir Road',           'کشمیر روڈ',              true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Hyderabad Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000004', 'Latifabad (Units 1-12)', 'لطیف آباد یونٹس 1 تا 12', true),
  ('city0000-0000-0000-0000-000000000004', 'Qasimabad',              'قاسم آباد',              true),
  ('city0000-0000-0000-0000-000000000004', 'Hyderabad Cantt',        'حیدرآباد کینٹ',          true),
  ('city0000-0000-0000-0000-000000000004', 'Autobhan Road',          'آٹوبھان روڈ',            true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;
