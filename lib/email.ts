/**
 * Transactional Email Client for Pakistani E-Commerce Platform
 * 
 * Supports both Resend and Postmark via standard REST APIs.
 * Includes mobile-friendly HTML email templates + plain-text fallbacks.
 * Gracefully simulates delivery in local development if no API key is provided.
 */

import { BRAND_NAME } from '@/lib/constants';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  phone: string;
  city: string;
  address?: string;
  totalAmount: number;
  paymentMethod?: string;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    variant?: string;
  }>;
}

/**
 * Low-level sender supporting Resend & Postmark
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address' };
  }

  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    `${BRAND_NAME} <onboarding@resend.dev>`; // Resend default for testing

  const resendApiKey = process.env.RESEND_API_KEY;
  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;

  // 1. Send via Resend
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Resend Error]', data);
        return { success: false, error: data.message || 'Resend API error' };
      }
      return { success: true, id: data.id };
    } catch (err: any) {
      console.error('[Resend Network Error]', err);
      return { success: false, error: err.message };
    }
  }

  // 2. Send via Postmark
  if (postmarkToken) {
    try {
      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': postmarkToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          From: fromAddress,
          To: to,
          Subject: subject,
          HtmlBody: html,
          TextBody: text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Postmark Error]', data);
        return { success: false, error: data.Message || 'Postmark API error' };
      }
      return { success: true, id: data.MessageID };
    } catch (err: any) {
      console.error('[Postmark Network Error]', err);
      return { success: false, error: err.message };
    }
  }

  // 3. Fallback / Local Development Logger
  console.log('------------------------------------------------------------');
  console.log(`✉️  [TRANSACTIONAL EMAIL DISPATCH] (Simulated)`);
  console.log(`To:      ${to}`);
  console.log(`From:    ${fromAddress}`);
  console.log(`Subject: ${subject}`);
  console.log('------------------------------------------------------------');
  console.log(text.slice(0, 300) + '...\n------------------------------------------------------------');

  return { success: true, id: 'simulated-' + Date.now() };
}

// =============================================================================
// EMAIL TEMPLATES & HELPERS
// =============================================================================

function baseEmailTemplate({ title, preheader, bodyContent }: { title: string; preheader: string; bodyContent: string }): string {
  const brand = BRAND_NAME || 'Brand';
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f7f7f7; padding: 20px 0; }
    .main { background-color: #ffffff; margin: 0 auto; max-width: 600px; border-radius: 16px; overflow: hidden; border: 1px solid #eaeaea; }
    .header { background: #064e3b; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
    .content { padding: 32px 24px; }
    .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 11px; color: #737373; border-top: 1px solid #eeeeee; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #064e3b; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; text-align: center; }
    .order-box { background-color: #f9fdfa; border: 1px solid #d1fae5; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .price-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .price-table td { padding: 8px 0; font-size: 13px; }
    .price-table tr.border-bottom td { border-bottom: 1px solid #eeeeee; }
    .price-table tr.total td { font-weight: 800; font-size: 16px; color: #064e3b; padding-top: 12px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
    .badge-cod { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </span>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <table align="center" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align: middle; padding-right: 12px;">
                <img src="${appUrl}/images/logo-icon.png" width="38" height="38" alt="${brand}" style="display: block; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);" />
              </td>
              <td style="vertical-align: middle;">
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">${brand}</h1>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${bodyContent}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 8px 0;">Need help with your order? Reply directly to this email or message us on WhatsApp.</p>
          <p style="margin: 0;">&copy; ${currentYear} ${brand} Pakistan. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * 1. Transactional Email: Order Received (Cash on Delivery)
 */
export async function sendOrderReceivedEmail(order: OrderEmailData): Promise<void> {
  if (!order.customerEmail) return;

  const subject = `Order Received #[${order.orderNumber}] - ${BRAND_NAME}`;
  const preheader = `We've received your order #${order.orderNumber} for Rs. ${order.totalAmount.toLocaleString()}.`;

  const itemsHtml = (order.items || [])
    .map(
      (i) => `
      <tr class="border-bottom">
        <td style="color: #171717;">
          <strong>${i.name}</strong> ${i.variant ? `<br><span style="font-size: 11px; color: #737373;">Variant: ${i.variant}</span>` : ''}
        </td>
        <td align="center" style="color: #737373;">x${i.quantity}</td>
        <td align="right" style="font-weight: 700;">Rs. ${(i.price * i.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const bodyContent = `
    <h2 style="font-size: 18px; color: #171717; margin-top: 0;">Assalam-o-Alaikum ${order.customerName},</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #404040;">
      Thank you for shopping with us! We have received your order <strong>#${order.orderNumber}</strong>.
      Our operations team is reviewing your address details. You may receive a brief confirmation call or WhatsApp message before dispatch.
    </p>

    <div class="order-box">
      <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #064e3b; margin-bottom: 8px;">
        Payment Method: <span class="badge badge-cod">Cash on Delivery (COD)</span>
      </div>
      <div style="font-size: 12px; color: #525252;">
        <strong>Delivery Destination:</strong> ${order.city}${order.address ? `, ${order.address}` : ''}
      </div>
      <div style="font-size: 12px; color: #525252; margin-top: 4px;">
        <strong>Contact Number:</strong> ${order.phone}
      </div>
    </div>

    <table class="price-table">
      ${itemsHtml}
      <tr class="total">
        <td colspan="2">Total Payable Amount (COD):</td>
        <td align="right">Rs. ${order.totalAmount.toLocaleString()}</td>
      </tr>
    </table>

    <div style="margin-top: 28px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/track" class="btn">
        Track Your Order Status &rarr;
      </a>
    </div>

    <p style="font-size: 11px; color: #737373; margin-top: 24px; text-align: center;">
      Please have the exact cash amount ready at the time of delivery to ensure a smooth courier handover.
    </p>
  `;

  const text = `Assalam-o-Alaikum ${order.customerName},

Thank you for shopping with ${BRAND_NAME}!
We have received your order #${order.orderNumber}.

Total Payable (Cash on Delivery): Rs. ${order.totalAmount.toLocaleString()}
Delivery Destination: ${order.city}
Contact Number: ${order.phone}

Items:
${(order.items || []).map((i) => `- ${i.name} x${i.quantity}: Rs. ${i.price * i.quantity}`).join('\n')}

Our team will call or WhatsApp you shortly before dispatch.
Track your parcel: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/track`;

  await sendEmail({
    to: order.customerEmail,
    subject,
    html: baseEmailTemplate({ title: subject, preheader, bodyContent }),
    text,
  });
}

/**
 * 2. Transactional Email: Order Confirmed
 */
export async function sendOrderConfirmedEmail(order: OrderEmailData): Promise<void> {
  if (!order.customerEmail) return;

  const subject = `Order Confirmed #[${order.orderNumber}] - Packing in Progress`;
  const preheader = `Your order #${order.orderNumber} has been verified and is being prepared for dispatch.`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #171717; margin-top: 0;">Order Verified & Confirmed!</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #404040;">
      Assalam-o-Alaikum ${order.customerName}, your order <strong>#${order.orderNumber}</strong> has been officially confirmed by our customer care desk.
    </p>

    <div class="order-box">
      <p style="margin: 0; font-size: 13px; color: #064e3b; font-weight: 600;">
        ✓ Your items are being hand-inspected and packed at our central fulfillment warehouse.
      </p>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #404040;">
      As soon as your package is handed over to our courier partner (PostEx / Trax / Leopards), you will receive a dispatch notice with your live tracking number.
    </p>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/track" class="btn">
        View Order Progression &rarr;
      </a>
    </div>
  `;

  const text = `Assalam-o-Alaikum ${order.customerName},

Great news! Your order #${order.orderNumber} has been confirmed.
Our warehouse is now packing your items for courier handover.

Destination: ${order.city}
Total COD: Rs. ${order.totalAmount.toLocaleString()}

Track status: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/track`;

  await sendEmail({
    to: order.customerEmail,
    subject,
    html: baseEmailTemplate({ title: subject, preheader, bodyContent }),
    text,
  });
}

/**
 * 3. Transactional Email: Order Shipped (with Tracking Number)
 */
export async function sendOrderShippedEmail(order: OrderEmailData): Promise<void> {
  if (!order.customerEmail) return;

  const courierName = order.courier || 'Courier';
  const trackingNumber = order.trackingNumber || 'Available shortly';
  const subject = `Dispatched! Your Order #[${order.orderNumber}] is on the way`;
  const preheader = `Your parcel is with ${courierName} (Tracking #${trackingNumber}).`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #171717; margin-top: 0;">Your Parcel Has Been Dispatched!</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #404040;">
      Assalam-o-Alaikum ${order.customerName}, great news! Your package for order <strong>#${order.orderNumber}</strong> has left our fulfillment facility and is in transit.
    </p>

    <div class="order-box" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="font-size: 13px; margin-bottom: 6px;">
        <strong>Courier Partner:</strong> ${courierName}
      </div>
      <div style="font-size: 13px; margin-bottom: 6px;">
        <strong>Tracking / Consignment Number:</strong> <span style="font-family: monospace; font-weight: bold; color: #064e3b;">${trackingNumber}</span>
      </div>
      <div style="font-size: 13px;">
        <strong>Payable on Delivery:</strong> Rs. ${order.totalAmount.toLocaleString()}
      </div>
    </div>

    ${
      order.trackingUrl
        ? `
      <div style="margin-top: 24px; text-align: center;">
        <a href="${order.trackingUrl}" class="btn" style="background-color: #d97706;">
          Track with ${courierName} &rarr;
        </a>
      </div>
    `
        : `
      <div style="margin-top: 24px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/track" class="btn">
          Track Live Consignment &rarr;
        </a>
      </div>
    `
    }

    <p style="font-size: 12px; color: #737373; margin-top: 24px; line-height: 1.5;">
      Standard delivery across Pakistan takes 2-4 business days. The delivery rider will call your phone number (${order.phone}) before arrival.
    </p>
  `;

  const text = `Assalam-o-Alaikum ${order.customerName},

Your order #${order.orderNumber} has been dispatched!

Courier: ${courierName}
Tracking Number: ${trackingNumber}
Total Amount (COD): Rs. ${order.totalAmount.toLocaleString()}
${order.trackingUrl ? `Direct Courier Tracking Link: ${order.trackingUrl}\n` : ''}
Track on our site: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/track`;

  await sendEmail({
    to: order.customerEmail,
    subject,
    html: baseEmailTemplate({ title: subject, preheader, bodyContent }),
    text,
  });
}

/**
 * 4. Transactional Email: Order Delivered
 */
export async function sendOrderDeliveredEmail(order: OrderEmailData): Promise<void> {
  if (!order.customerEmail) return;

  const subject = `Delivered! Your Parcel for #[${order.orderNumber}] Has Arrived`;
  const preheader = `Your order #${order.orderNumber} has been delivered. Thank you for shopping with ${BRAND_NAME}!`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #171717; margin-top: 0;">Parcel Delivered!</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #404040;">
      Assalam-o-Alaikum ${order.customerName}, our courier partner reports that your parcel for order <strong>#${order.orderNumber}</strong> has been successfully delivered.
    </p>

    <div class="order-box">
      <p style="margin: 0; font-size: 13px; color: #064e3b; font-weight: 600;">
        We hope you love your purchase!
      </p>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #525252;">
        Every piece is covered by our 7-day hassle-free exchange guarantee. If you require size alteration or support, our team is just a WhatsApp away.
      </p>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contact" class="btn">
        Contact Customer Concierge &rarr;
      </a>
    </div>
  `;

  const text = `Assalam-o-Alaikum ${order.customerName},

Your order #${order.orderNumber} has been delivered.
We hope you enjoy your purchase!

Remember, all orders are covered by our 7-day exchange guarantee.
If you need any assistance, reach out at ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contact`;

  await sendEmail({
    to: order.customerEmail,
    subject,
    html: baseEmailTemplate({ title: subject, preheader, bodyContent }),
    text,
  });
}

/**
 * 5. Staff Notification: New Contact Form Message Received
 */
export async function sendStaffSupportNotificationEmail(message: {
  name: string;
  email?: string | null;
  phone?: string | null;
  orderRef?: string | null;
  messageText: string;
}): Promise<void> {
  const staffEmail =
    process.env.STAFF_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    'support@brandname.pk';

  const subject = `[New Support Query] from ${message.name}${message.orderRef ? ` (Ref: ${message.orderRef})` : ''}`;
  const preheader = `Support message received from ${message.name}: ${message.messageText.slice(0, 50)}...`;

  const bodyContent = `
    <h2 style="font-size: 16px; color: #171717; margin-top: 0;">New Customer Inquiry</h2>
    <div class="order-box">
      <div style="font-size: 12px; margin-bottom: 4px;"><strong>Customer:</strong> ${message.name}</div>
      <div style="font-size: 12px; margin-bottom: 4px;"><strong>Phone:</strong> ${message.phone || 'N/A'}</div>
      <div style="font-size: 12px; margin-bottom: 4px;"><strong>Email:</strong> ${message.email || 'N/A'}</div>
      <div style="font-size: 12px; margin-bottom: 4px;"><strong>Order Ref:</strong> ${message.orderRef || 'None'}</div>
    </div>

    <div style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 14px; border-radius: 10px; font-size: 13px; line-height: 1.6;">
      <strong>Message:</strong><br>
      ${message.messageText.replace(/\n/g, '<br>')}
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/support" class="btn">
        Open Support Inbox in Admin &rarr;
      </a>
    </div>
  `;

  const text = `New Customer Inquiry:
Customer: ${message.name}
Phone: ${message.phone || 'N/A'}
Email: ${message.email || 'N/A'}
Order Ref: ${message.orderRef || 'None'}

Message:
${message.messageText}

Open Admin Inbox: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/support`;

  await sendEmail({
    to: staffEmail,
    subject,
    html: baseEmailTemplate({ title: subject, preheader, bodyContent }),
    text,
  });
}

/**
 * 6. Customer Support Reply Email (Sent by Admin)
 */
export async function sendSupportReplyEmail(params: {
  customerEmail: string;
  customerName: string;
  replyText: string;
  originalMessage?: string;
  orderRef?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const subject = `Re: Your Inquiry to ${BRAND_NAME}${params.orderRef ? ` (Order #${params.orderRef})` : ''}`;
  const preheader = `Our customer concierge team has responded to your inquiry.`;

  const bodyContent = `
    <h2 style="font-size: 16px; color: #171717; margin-top: 0;">Assalam-o-Alaikum ${params.customerName},</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #404040;">
      Thank you for reaching out to ${BRAND_NAME}. Our concierge specialist has reviewed your query:
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; color: #14532d; margin: 16px 0;">
      ${params.replyText.replace(/\n/g, '<br>')}
    </div>

    ${
      params.originalMessage
        ? `
      <div style="font-size: 11px; color: #737373; border-top: 1px solid #eeeeee; padding-top: 12px; margin-top: 20px;">
        <strong>Your original message:</strong><br>
        <em>"${params.originalMessage.replace(/\n/g, ' ')}"</em>
      </div>
    `
        : ''
    }
  `;

  const text = `Assalam-o-Alaikum ${params.customerName},

${params.replyText}

${params.originalMessage ? `\nYour original inquiry:\n"${params.originalMessage}"\n` : ''}
Best regards,
${BRAND_NAME} Concierge Team`;

  return await sendEmail({
    to: params.customerEmail,
    subject,
    html: baseEmailTemplate({ title: subject, preheader, bodyContent }),
    text,
  });
}

