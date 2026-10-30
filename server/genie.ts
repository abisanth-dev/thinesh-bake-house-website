import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { dbStore, addLog } from './store.js';
import type { GeneralSettings, Order } from '../src/types.js';
import { genieChargeInLkr } from '../src/paymentMethods.js';

// Dialog Genie Business card payments, following Dialog's own WooCommerce plugin and its
// geniebiz-connect-php SDK (see genie-business-payment-gateway/ in this repo):
//  1. create a transaction for the order and send the customer to its payment page;
//  2. when Genie redirects back (or calls the webhook), fetch that transaction from Genie and
//     trust only its state - never the query string or webhook body on their own.

const ENDPOINTS = { sandbox: 'https://api.uat.geniebiz.lk/public/', live: 'https://api.geniebiz.lk/public/' } as const;
const PAID_STATES = new Set(['CONFIRMED', 'AUTHORIZED']);
const FAILED_STATES = new Set(['CANCELLED', 'FAILED']);
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

type GenieTransaction = { id?: string; url?: string; localId?: string; state?: string };
export type GeniePaymentResult = 'paid' | 'failed' | 'pending' | 'invalid';

const apiKey = () => process.env.DIALOG_GENIE_API_KEY?.trim() || '';
export const isGenieConfigured = () => apiKey() !== '';

const endpoint = (settings: GeneralSettings) => ENDPOINTS[settings.payments.dialogGenieEnvironment === 'live' ? 'live' : 'sandbox'];

// Genie amounts are in minor units (cents): Rs. 1,250.50 -> 125050.
const toMinorUnits = (total: number) => Math.round(total * 100);

async function genieRequest(settings: GeneralSettings, path: string, body?: Record<string, unknown>): Promise<GenieTransaction> {
  const response = await fetch(endpoint(settings) + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: apiKey() },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Genie API ${response.status}: ${data?.message || data?.error || response.statusText}`);
  return data || {};
}

/** The public origin Genie should send the customer back to (and post webhooks to). */
export const siteOrigin = (req: Request) => {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  return `${proto}://${req.get('host')}`;
};

export async function startGeniePayment(order: Order, settings: GeneralSettings, origin: string): Promise<string> {
  // Genie Business merchant accounts settle in rupees only; any other code gets "Transaction data invalid".
  const charge = genieChargeInLkr(order.total, settings);
  if (charge === null) throw new Error(`No ${settings.store.currency} to LKR exchange rate set for Dialog Genie.`);
  const amount = toMinorUnits(charge);
  const currency = 'LKR';
  const isPublicOrigin = !/\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(origin);
  const transaction = await genieRequest(settings, 'transactions', {
    currency,
    amount,
    localId: order.orderNumber,
    redirectUrl: `${origin}/api/payments/genie/return/${encodeURIComponent(order.id)}`,
    // Genie can't reach a local dev server, so the webhook is only sent from a deployed site.
    ...(isPublicOrigin ? { webhook: `${origin}/api/payments/genie/webhook` } : {}),
    apiVersion: '2.0',
    appVersion: 'geniebiz-connect-php',
    signMethod: 'sha1',
    signature: createHash('sha1').update(`amount=${amount}&currency=${currency}&apiKey=${apiKey()}`).digest('hex'),
  });
  if (!transaction.id || !transaction.url) throw new Error('Genie did not return a payment page.');
  await dbStore.setOrderPaymentReference(order.id, transaction.id);
  return transaction.url;
}

/** Looks the order's transaction up at Genie and records the outcome. Safe to call repeatedly. */
export async function confirmGeniePayment(orderRef: string): Promise<{ result: GeniePaymentResult; order?: Order }> {
  if (!SAFE_ID.test(orderRef)) return { result: 'invalid' };
  const order = await dbStore.getOrderById(orderRef);
  if (!order || order.paymentMethod !== 'dialog_genie' || !order.paymentReference) return { result: 'invalid', order: order ?? undefined };
  if (order.paymentStatus === 'paid') return { result: 'paid', order };

  const settings = await dbStore.getGeneralSettings();
  // Only the transaction created for this order counts, whatever id the redirect or webhook names.
  const transaction = await genieRequest(settings, `transactions/${encodeURIComponent(order.paymentReference)}`);
  if (transaction.id !== order.paymentReference || transaction.localId !== order.orderNumber) {
    console.error(`Genie: transaction ${order.paymentReference} does not match order ${order.orderNumber}.`);
    return { result: 'invalid', order };
  }

  const state = String(transaction.state || '').toUpperCase();
  if (PAID_STATES.has(state)) {
    const paid = await dbStore.markOrderPaid(order.id, transaction.id, `Card payment received via Dialog Genie (${transaction.id})`);
    await addLog(order.customerName || 'Customer', 'Payment Received', `Order ${order.orderNumber} paid by card via Dialog Genie`, 'success');
    return { result: 'paid', order: paid ?? order };
  }
  if (FAILED_STATES.has(state)) {
    if (order.status !== 'failed' && order.status !== 'cancelled') {
      await dbStore.updateOrderStatus(order.id, 'failed', state === 'CANCELLED' ? 'Card payment cancelled by the customer' : 'Card payment failed');
    }
    return { result: 'failed', order };
  }
  return { result: 'pending', order };
}
