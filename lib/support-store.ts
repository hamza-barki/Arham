export interface SupportMessageRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  order_ref: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'closed';
  staff_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export let inMemorySupportMessages: SupportMessageRecord[] = [
  {
    id: 'msg-1',
    name: 'Sanaullah Tariq',
    email: 'sanaullah@gmail.com',
    phone: '03001234567',
    order_ref: 'PK-10001',
    message: 'Can you please confirm if this kurta has extra stitching margin for alteration?',
    status: 'new',
    staff_reply: null,
    replied_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-2',
    name: 'Zainab Bibi',
    email: 'zainab.b@yahoo.com',
    phone: '03219876543',
    order_ref: 'PK-99119',
    message: 'I need to update my shipping address in Clifton Karachi before parcel dispatch.',
    status: 'new',
    staff_reply: null,
    replied_at: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

