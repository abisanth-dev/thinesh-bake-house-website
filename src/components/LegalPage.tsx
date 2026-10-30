import React from 'react';
import { ArrowLeft, FileText, RotateCcw, ShieldCheck } from 'lucide-react';

export type LegalPageType = 'privacy-policy' | 'terms-and-conditions' | 'refund-policy';

interface LegalPageProps {
  type: LegalPageType;
  onBack: () => void;
}

interface PolicySection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

const policies: Record<LegalPageType, {
  eyebrow: string;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: PolicySection[];
}> = {
  'privacy-policy': {
    eyebrow: 'Your information matters',
    title: 'Privacy Policy',
    summary: 'This policy explains what information Thinesh Bake House collects, why we use it, and the choices available to you when you browse, order, or contact us.',
    icon: ShieldCheck,
    sections: [
      { title: '1. Information we collect', paragraphs: ['We collect information you provide when placing an order, creating a customer profile, submitting a review, tracking an order, or contacting us.'], items: ['Name, email address and telephone number.', 'Delivery or billing address and order instructions.', 'Products ordered, custom cake details, order history and coupon use.', 'Messages, reviews, support enquiries and any images you choose to send.', 'Basic technical information such as browser type, device type and site activity.'] },
      { title: '2. How we use information', items: ['Process, prepare, deliver and support your order.', 'Send order confirmations, status updates and service messages.', 'Remember your basket and customer preferences.', 'Prevent fraud, protect the website and troubleshoot technical problems.', 'Improve our products, service, website and customer experience.', 'Comply with accounting, tax, legal and regulatory obligations.'] },
      { title: '3. Cookies and local storage', paragraphs: ['The website may use cookies or browser storage to keep your basket, remember preferences, maintain secure sessions and understand website performance. You can restrict these through your browser, although some features may stop working correctly.'] },
      { title: '4. When information is shared', paragraphs: ['We do not sell your personal information. We may share only what is necessary with trusted providers that help us operate the store, including hosting, database, communications, delivery and payment-service providers. We may also disclose information when required by law or to protect customers, our business or the public.'] },
      { title: '5. Data security and retention', paragraphs: ['We use reasonable administrative and technical safeguards to protect personal information. No online system can guarantee absolute security. We retain information only for as long as it is needed for orders, customer support, legitimate business records and applicable legal requirements.'] },
      { title: '6. Your choices and rights', paragraphs: ['You may ask to access, correct or delete personal information we hold about you, subject to legal record-keeping requirements. You may also opt out of promotional communications while continuing to receive essential order messages.'] },
      { title: '7. Children and external services', paragraphs: ['Our online ordering service is intended for customers able to enter a purchase agreement. Links or services operated by third parties have their own privacy practices, which we do not control.'] },
      { title: '8. Contact us', paragraphs: ['For privacy questions or requests, email info@tbh.lk or call 077 725 9245. We may ask for information needed to verify your identity before completing a request.'] },
    ],
  },
  'terms-and-conditions': {
    eyebrow: 'Ordering with confidence',
    title: 'Terms & Conditions',
    summary: 'These terms apply when you use the Thinesh Bake House website or place an order with us. By continuing, you agree to these terms.',
    icon: FileText,
    sections: [
      { title: '1. About these terms', paragraphs: ['Thinesh Bake House operates this website and provides bakery products, customised cakes and related services. You must provide accurate information and be legally able to place an order.'] },
      { title: '2. Products, images and availability', paragraphs: ['We make reasonable efforts to describe and display products accurately. Because products are handmade and screens vary, colours, decoration, size and presentation may differ slightly from photographs. All products remain subject to ingredient and production availability.'] },
      { title: '3. Prices and payment', paragraphs: ['Prices are shown in the currency displayed at checkout and may change without notice. The price confirmed when an order is accepted applies to that order. Delivery charges, taxes or other applicable fees will be shown before confirmation where relevant.'] },
      { title: '4. Orders and acceptance', paragraphs: ['Submitting an order is a request to purchase. An order is accepted when we confirm it or begin preparation. We may contact you to clarify customisation, availability, delivery details or payment. We may reject or cancel an order where information is incomplete, payment is not authorised, an item is unavailable, or accepting it would be unlawful or impractical.'] },
      { title: '5. Custom and personalised orders', items: ['Check spelling, dates, quantities, flavours, colours and design instructions before confirming.', 'Reference images are treated as inspiration unless an exact specification is expressly agreed.', 'Once ingredient purchasing or preparation begins, changes may not be possible and additional charges may apply.', 'Customers are responsible for ensuring supplied content does not infringe another person’s rights or contain unlawful material.'] },
      { title: '6. Collection and delivery', paragraphs: ['Quoted collection or delivery times are estimates and can be affected by weather, traffic, demand and events outside our reasonable control. You must provide a complete address, reachable telephone number and a person available to receive the order. Risk in the products passes to you on delivery or collection.'] },
      { title: '7. Allergens and product care', paragraphs: ['Our products may contain or come into contact with wheat, gluten, eggs, milk, nuts, peanuts, soy and other allergens. Contact us before ordering if you have an allergy. Unless we expressly confirm otherwise in writing, we cannot guarantee an allergen-free environment. Follow storage and consumption instructions and refrigerate products when advised.'] },
      { title: '8. Acceptable website use', paragraphs: ['Do not misuse the website, attempt unauthorised access, interfere with its operation, submit fraudulent orders, copy protected content without permission, or use the service for unlawful purposes.'] },
      { title: '9. Liability and governing law', paragraphs: ['Nothing in these terms limits rights or liabilities that cannot legally be excluded. To the extent permitted by law, we are not responsible for indirect loss or loss caused by incorrect customer information, improper storage, misuse, or events beyond our reasonable control. These terms are governed by the laws of Sri Lanka.'] },
      { title: '10. Contact and changes', paragraphs: ['We may update these terms and will publish the revised version on this page. Questions can be sent to info@tbh.lk or raised by calling 077 725 9245.'] },
    ],
  },
  'refund-policy': {
    eyebrow: 'Fair solutions for every order',
    title: 'Refund Policy',
    summary: 'Fresh bakery products are perishable and often made to order. This policy explains when cancellations, replacements, store credit or refunds may be available.',
    icon: RotateCcw,
    sections: [
      { title: '1. Changing or cancelling an order', paragraphs: ['Contact us as soon as possible. A full cancellation may be available if preparation and ingredient purchasing have not started. Once preparation begins, we may be unable to cancel or may deduct reasonable costs already incurred. Custom and personalised orders require additional notice because they are made specifically for you.'] },
      { title: '2. Incorrect, damaged or unsuitable products', paragraphs: ['If an item is incorrect, materially damaged on arrival, or not reasonably fit for consumption, contact us within two hours of delivery or collection whenever practical. Keep the product and provide the order number, a description of the issue and clear photographs so we can investigate promptly.'] },
      { title: '3. Available remedies', paragraphs: ['After reviewing the issue, we may offer a replacement, correction, store credit, partial refund or full refund depending on the circumstances. The appropriate remedy will reflect the affected portion of the order and your rights under applicable Sri Lankan law.'] },
      { title: '4. Situations normally not eligible', items: ['A change of mind or personal taste preference after a correctly prepared product is supplied.', 'Incorrect names, dates, colours, quantities, addresses or other details approved or supplied by the customer.', 'Minor handmade variations from website or reference photographs.', 'Damage, spoilage or quality loss caused by transport arranged by the customer, late collection, improper handling or incorrect storage after handover.', 'A failed delivery caused by an incorrect address, unavailable recipient or unreachable telephone number.', 'Custom products after preparation has started, unless the product is faulty or does not materially match the agreed order.'] },
      { title: '5. Delivery delays', paragraphs: ['Please contact us if an order is significantly delayed. A delay does not automatically qualify for a full refund, but we will assess the circumstances, the condition of the products and whether the order still serves its intended purpose.'] },
      { title: '6. Refund timing', paragraphs: ['Approved refunds are returned using the original payment method where possible. Bank or payment-provider processing may take approximately 7–14 business days after approval. Cash-order remedies may be arranged directly with the store.'] },
      { title: '7. How to request help', paragraphs: ['Email info@tbh.lk or call 077 725 9245 with your order number and supporting details. Nothing in this policy removes any mandatory consumer rights available under applicable law.'] },
    ],
  },
};

export default function LegalPage({ type, onBack }: LegalPageProps) {
  const policy = policies[type];
  const Icon = policy.icon;

  return (
    <article className="bg-stone-50">
      <section className="relative overflow-hidden bg-[#070d32] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <button type="button" onClick={onBack} className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-blue-100/70 transition hover:text-brand-gold"><ArrowLeft className="h-4 w-4" /> Back to home</button>
          <div className="flex items-center gap-3 text-brand-gold">
            <span className="rounded-2xl border border-brand-gold/25 bg-brand-gold/10 p-3"><Icon className="h-6 w-6" /></span>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em]">{policy.eyebrow}</p>
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">{policy.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-blue-100/70 sm:text-lg">{policy.summary}</p>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-blue-100/40">Last updated: 3 August 2026</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-16">
        <aside className="h-fit rounded-2xl border border-amber-200/60 bg-amber-50 p-5 lg:sticky lg:top-28">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-900/60">Need assistance?</p>
          <p className="mt-3 text-sm leading-6 text-amber-950/70">Questions about an order or these policies? Our team is happy to help.</p>
          <a href="mailto:info@tbh.lk" className="mt-5 block text-sm font-extrabold text-brand-blue hover:text-brand-gold">info@tbh.lk</a>
          <a href="tel:+94777259245" className="mt-2 block text-sm font-extrabold text-brand-blue hover:text-brand-gold">077 725 9245</a>
        </aside>

        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <div className="divide-y divide-stone-100 px-6 sm:px-10">
            {policy.sections.map(section => (
              <section key={section.title} className="py-8 sm:py-10">
                <h2 className="text-xl font-extrabold text-brand-blue sm:text-2xl">{section.title}</h2>
                {section.paragraphs?.map(paragraph => <p key={paragraph} className="mt-4 text-sm leading-7 text-stone-600 sm:text-[15px]">{paragraph}</p>)}
                {section.items && (
                  <ul className="mt-5 space-y-3">
                    {section.items.map(item => (
                      <li key={item} className="flex gap-3 text-sm leading-7 text-stone-600 sm:text-[15px]"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" /><span>{item}</span></li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
