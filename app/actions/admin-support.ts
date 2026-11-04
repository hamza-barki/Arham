'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requireRole, recordAuditLog } from '@/lib/admin-auth';
import { inMemorySupportMessages, SupportMessageRecord } from '@/lib/support-store';
import { sendSupportReplyEmail } from '@/lib/email';

export interface AdminSupportMessageItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  orderRef: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'closed';
  staffReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

/**
 * Fetch all support messages with optional status and search filters
 */
export async function getSupportMessagesAction(filters?: {
  status?: string;
  search?: string;
}): Promise<{
  success: boolean;
  messages: AdminSupportMessageItem[];
  counts: { all: number; new: number; in_progress: number; closed: number };
  error?: string;
}> {
  try {
    await requireRole('staff');

    if (!isSupabaseConfigured()) {
      let list = [...inMemorySupportMessages];

      if (filters?.search) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            (m.phone && m.phone.includes(q)) ||
            (m.order_ref && m.order_ref.toLowerCase().includes(q)) ||
            m.message.toLowerCase().includes(q)
        );
      }

      const allCount = inMemorySupportMessages.length;
      const newCount = inMemorySupportMessages.filter((m) => m.status === 'new').length;
      const inProgressCount = inMemorySupportMessages.filter((m) => m.status === 'in_progress').length;
      const closedCount = inMemorySupportMessages.filter((m) => m.status === 'closed').length;

      if (filters?.status && filters.status !== 'all') {
        list = list.filter((m) => m.status === filters.status);
      }

      return {
        success: true,
        messages: list.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          orderRef: m.order_ref,
          message: m.message,
          status: m.status,
          staffReply: m.staff_reply,
          repliedAt: m.replied_at,
          createdAt: m.created_at,
        })),
        counts: {
          all: allCount,
          new: newCount,
          in_progress: inProgressCount,
          closed: closedCount,
        },
      };
    }

    const admin = getServiceRoleClient();
    let query = (admin as any).from('support_messages').select('*').order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      const q = filters.search.trim();
      query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,order_ref.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return { success: false, messages: [], counts: { all: 0, new: 0, in_progress: 0, closed: 0 }, error: error.message };

    // Get count breakdown
    const { data: allMessages } = await (admin as any).from('support_messages').select('status');
    const allRecords = allMessages || [];
    const counts = {
      all: allRecords.length,
      new: allRecords.filter((r: any) => r.status === 'new').length,
      in_progress: allRecords.filter((r: any) => r.status === 'in_progress').length,
      closed: allRecords.filter((r: any) => r.status === 'closed').length,
    };

    const messages: AdminSupportMessageItem[] = (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      orderRef: m.order_ref,
      message: m.message,
      status: m.status,
      staffReply: m.staff_reply,
      repliedAt: m.replied_at,
      createdAt: m.created_at,
    }));

    return { success: true, messages, counts };
  } catch (err: any) {
    return {
      success: false,
      messages: [],
      counts: { all: 0, new: 0, in_progress: 0, closed: 0 },
      error: err.message,
    };
  }
}

/**
 * Update message status (e.g. 'new' -> 'in_progress' -> 'closed')
 */
export async function updateSupportMessageStatusAction(
  id: string,
  newStatus: 'new' | 'in_progress' | 'closed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('staff');

    if (!isSupabaseConfigured()) {
      const found = inMemorySupportMessages.find((m) => m.id === id);
      if (found) {
        found.status = newStatus;
        await recordAuditLog({
          action: 'UPDATE_SUPPORT_STATUS',
          entity: 'support_messages',
          entityId: id,
          diff: { newStatus },
          actorId: adminUser.userId,
          actorName: adminUser.fullName,
        });
        return { success: true };
      }
      return { success: false, error: 'Message not found' };
    }

    const admin = getServiceRoleClient();
    const { error } = await (admin as any)
      .from('support_messages')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await recordAuditLog({
      action: 'UPDATE_SUPPORT_STATUS',
      entity: 'support_messages',
      entityId: id,
      diff: { newStatus },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Reply to customer by email and update message status
 */
export async function replySupportMessageAction(
  id: string,
  replyText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('staff');

    if (!replyText || replyText.trim().length < 5) {
      return { success: false, error: 'Please enter a reply message of at least 5 characters.' };
    }

    let customerEmail: string | null = null;
    let customerName = 'Valued Customer';
    let originalMessage = '';
    let orderRef: string | null = null;

    if (!isSupabaseConfigured()) {
      const found = inMemorySupportMessages.find((m) => m.id === id);
      if (!found) return { success: false, error: 'Message not found' };
      customerEmail = found.email;
      customerName = found.name;
      originalMessage = found.message;
      orderRef = found.order_ref;

      found.staff_reply = replyText.trim();
      found.replied_at = new Date().toISOString();
      found.status = 'closed';
    } else {
      const admin = getServiceRoleClient();
      const { data: record, error: fetchErr } = await (admin as any)
        .from('support_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !record) return { success: false, error: 'Message not found' };

      customerEmail = record.email;
      customerName = record.name;
      originalMessage = record.message;
      orderRef = record.order_ref;

      // Update record in Supabase
      const { error: updateErr } = await (admin as any)
        .from('support_messages')
        .update({
          staff_reply: replyText.trim(),
          replied_at: new Date().toISOString(),
          status: 'closed',
          replied_by: adminUser.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateErr) return { success: false, error: updateErr.message };
    }

    // Send email to customer if email is available
    if (customerEmail && customerEmail.includes('@')) {
      const emailRes = await sendSupportReplyEmail({
        customerEmail,
        customerName,
        replyText: replyText.trim(),
        originalMessage,
        orderRef,
      });

      if (!emailRes.success) {
        console.warn('[Support Reply Email Send Warning]', emailRes.error);
      }
    }

    await recordAuditLog({
      action: 'REPLY_SUPPORT_MESSAGE',
      entity: 'support_messages',
      entityId: id,
      diff: { customerEmail, customerName, replyPreview: replyText.slice(0, 80) },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

