import { GeneralSettings, PaymentMethod } from './types';

// Online gateways whose payment page and payment confirmation are actually built. A gateway that is
// switched on in Settings but not listed here is never offered: without the integration the order
// would be saved unpaid while the customer believes they paid.
export const CONNECTED_ONLINE_GATEWAYS: PaymentMethod[] = ['dialog_genie'];

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = ['cod', 'bank_transfer', 'dialog_genie', 'payhere', 'stripe'];

export const isPaymentMethodAvailable = (method: PaymentMethod, payments: GeneralSettings['payments']): boolean => {
  switch (method) {
    case 'cod': return payments.cashOnDeliveryEnabled;
    case 'bank_transfer': return payments.bankTransferEnabled;
    case 'dialog_genie': return payments.dialogGenieEnabled && CONNECTED_ONLINE_GATEWAYS.includes(method);
    case 'payhere': return payments.payHereEnabled && CONNECTED_ONLINE_GATEWAYS.includes(method);
    case 'stripe': return payments.stripeEnabled && CONNECTED_ONLINE_GATEWAYS.includes(method);
    default: return false;
  }
};

// Dialog Genie charges in rupees only. Returns the LKR amount for an order total in the store
// currency, or null while a non-LKR store has no exchange rate set.
export const genieChargeInLkr = (total: number, settings: GeneralSettings): number | null => {
  if (settings.store.currency.trim().toUpperCase() === 'LKR') return total;
  const rate = Number(settings.payments.dialogGenieExchangeRate);
  return rate > 0 ? Math.round(total * rate * 100) / 100 : null;
};

export const availablePaymentMethods =(payments: GeneralSettings['payments']): PaymentMethod[] =>
  PAYMENT_METHOD_ORDER.filter(method => isPaymentMethodAvailable(method, payments));
