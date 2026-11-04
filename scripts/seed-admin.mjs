/**
 * Admin Seed Script for Arham Collection E-Commerce
 * 
 * Usage:
 *   node scripts/seed-admin.mjs admin@brandname.pk "StrongPassword123!" "super_admin"
 * 
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env.local or environment
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
  process.exit(1);
}

const email = process.argv[2] || 'admin@brandname.pk';
const password = process.argv[3] || 'AdminPK@2026!';
const role = process.argv[4] || 'super_admin';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAdmin() {
  console.log(`🚀 Provisioning admin user: ${email} (${role})...`);

  // 1. Check if user already exists in auth.users
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  let user = usersData.users.find((u) => u.email === email);

  if (!user) {
    console.log(`Creating auth user ${email}...`);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name: 'Store Super Admin' },
    });

    if (createError || !createData.user) {
      console.error('❌ Failed to create auth user:', createError?.message);
      process.exit(1);
    }
    user = createData.user;
    console.log(`✅ Auth user created with ID: ${user.id}`);
  } else {
    console.log(`ℹ️ Auth user already exists with ID: ${user.id}`);
  }

  // 2. Insert into public.admins table
  const { data: adminRecord, error: adminError } = await supabaseAdmin
    .from('admins')
    .upsert(
      {
        user_id: user.id,
        role: role,
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (adminError) {
    console.error('❌ Failed to assign admin role in public.admins:', adminError.message);
    process.exit(1);
  }

  console.log(`🎉 SUCCESS! Admin user provisioned:`);
  console.log(`   Email: ${email}`);
  console.log(`   Role:  ${adminRecord.role}`);
  console.log(`   ID:    ${adminRecord.id}`);
}

seedAdmin();
