# Thinesh Bake House - Implementation and WooCommerce Migration

Last verified: 2026-08-02 (Asia/Colombo)

## Outcome

The website now has a reproducible Supabase schema, a working administrator profile, and a live-tested WooCommerce importer. The migration was run from the admin dashboard in Chrome using **Keep existing items** mode.

Live result:

- 127 products imported;
- 8 categories imported;
- 254 product/category images downloaded to the public Supabase `media` bucket;
- 77 variable products imported;
- 260 individual variations preserved as structured JSON;
- all 127 products have a description, SKU, and Supabase-hosted main image;
- the WooCommerce `last_synced_at` value was updated after completion.

## Administrator Access

The administrator email is `admin@tbh.lk`. The missing `profiles` row that caused **This account has no admin profile. Access denied.** has been created with the `administrator` role.

The application intentionally cannot display or recover the existing Supabase Auth password. If the password is unknown, use the login page's password-reset flow rather than storing a password in this repository or document.

Admin authorization is enforced in two places:

1. Supabase Auth validates the signed-in user.
2. The server requires a matching `profiles` record with role `administrator` or `shop_manager` for protected admin APIs.

## Why the WooCommerce API Is Used

The WooCommerce REST API (`wc/v3`) is preferable to CSV for this catalogue because it preserves product IDs, categories, descriptions, prices, stock, images, attributes, and variations. It also supports repeatable previews and upserts.

API credentials are saved server-side in `woocommerce_settings`. Requests use HTTP Basic authentication, so the consumer secret is not placed in URL query strings. Credentials must never be committed to source control or returned to the browser after saving.

## Migration Workflow

1. Open **Admin > WooCommerce Sync**.
2. Enter the store URL, consumer key, and consumer secret, then save them.
3. Use **Test Connection** or **Preview Fetch**. Preview reads the complete paginated catalogue without changing catalogue rows.
4. Choose how existing items should be handled:
   - **Keep existing items** updates matching WooCommerce imports and preserves all other catalogue rows.
   - **Replace old catalogue** imports first, then asks for confirmation before deleting rows that are not present in WooCommerce.
5. Run **Migrate to Supabase**. Products and categories are upserted only after the image-copy stage completes.
6. Verify destination counts, variations, images, and the activity log.

Keep mode is the default and was used for the live verification. Replace mode was not executed because it can delete catalogue rows.

## Implemented Migration Features

- pagination through every WooCommerce product and category page using `X-WP-TotalPages`;
- Basic Auth without query-string secrets;
- category mapping, including WooCommerce parent IDs in the source response;
- separate variation requests for every variable product;
- variation ID, WooCommerce ID, SKU, effective/regular/sale price, stock, image, and attributes;
- product name, slug, descriptions, price range, sale state, categories, tags, SKU, stock, source ID, image, and gallery;
- bounded variation fetching;
- bounded image transfers (four workers) and a 15-second download timeout per image;
- fallback to the original image URL if one image cannot be copied;
- stable WooCommerce product IDs for repeatable upserts;
- safe keep/replace catalogue strategy;
- migration activity logging and sync timestamp.

Primary files:

- `server/woocommerce.ts` - WooCommerce pagination, variation fetching, and mapping;
- `server.ts` - connection, preview, credential, and migration endpoints;
- `server/storage.ts` - image download and Supabase Storage upload;
- `server/store.ts` - Supabase CRUD, upsert, and optional pruning;
- `src/admin/AdminDashboard.tsx` - admin migration controls;
- `supabase/migrations/001_initial_schema.sql` - complete initial database/RLS/storage schema;
- `supabase/migrations/002_product_variants.sql` - product variation JSON column.

## Database and Security

The initial migration creates the application tables, indexes, settings singleton rows, the public `media` storage bucket, RLS, and the admin profile. Public clients can read only their own profile through RLS; privileged server mutations use the Supabase service role.

Required tables verified live:

- `profiles`;
- `products`;
- `categories`;
- `hero_slides`;
- `orders`;
- `coupons`;
- `reviews`;
- `customers`;
- `activity_logs`;
- `general_settings`;
- `email_settings`;
- `sms_settings`;
- `woocommerce_settings`.

## Admin Function Smoke Test

The following sections were opened in the authenticated Chrome session and rendered without access-denied or visible runtime errors:

| Admin area | Live status | Notes |
|---|---|---|
| Login/profile authorization | Verified | Signed in as Administrator; former missing-profile error fixed. |
| Overview and activity log | Verified read/render | Dashboard and live log section load. |
| Products and gallery | Verified read/render | Imported product names and images appear. CRUD controls are wired. |
| Categories | Verified read/render | Eight imported categories are present. CRUD controls are wired. |
| Orders and invoicing | Verified read/render | Section loads; no real order mutation was made during this test. |
| Coupons | Verified read/render | Section loads; no production coupon was created or deleted. |
| Reviews | Verified read/render | Moderation section loads; no live review state was changed. |
| Hero carousel | Verified read/render | Management section loads; no production slide was changed. |
| SMS settings | Verified read/render | UI loads; current server behavior is a simulator/log unless a provider is implemented. |
| General and email settings | Verified read/render | Forms load. SMTP delivery still needs a real sender/provider integration. |
| User roles | Verified read/render | Account list loads. Add last-admin/self-demotion safeguards before wider staff use. |
| WooCommerce preview | Verified live | Returned all 127 products and 8 categories. |
| WooCommerce migration | Verified live | Imported 127 products, 8 categories, 254 images, and 260 variations. |

This smoke test deliberately avoided destructive production actions such as deleting products, changing roles, issuing coupons, or changing order status.

## Website Changes Completed

- five centered category image cards immediately below the hero slider;
- redesigned Promotions & Combos section;
- home menu limited to five featured products, with no category filter or search UI;
- coupon section moved below featured products;
- location/branch section removed from the home page;
- redesigned testimonials and footer;
- admin navigation item removed from the public navigation;
- Track Order styled consistently with Home, Menu, and Promotions;
- wishlist icon removed as requested;
- track-order icon removed.

## Remaining Production Improvements

The current importer is suitable for this completed catalogue import, but these improvements are recommended before treating it as a durable synchronization platform:

1. Add persistent `migration_jobs` and `migration_items` tables with progress, retries, warnings, and item-level failures.
2. Stage a new catalogue and publish it atomically, with a rollback snapshot.
3. Store money as database decimal/minor units instead of JavaScript floating-point numbers.
4. Add image checksum deduplication so repeat imports do not create duplicate files.
5. Preserve sanitized HTML formatting if rich WooCommerce descriptions are required.
6. Model variations in dedicated relational tables if the storefront needs database-level filtering/reporting by variation.
7. Add integration tests for every mutation: product/category CRUD, coupon rules, order transitions, review moderation, settings persistence, and role edge cases.
8. Implement real SMTP/email and SMS providers before enabling delivery-related features.
9. Add a disconnect button if administrators need to disable WooCommerce from the UI.

## Verification Commands

- `npm run lint` - TypeScript validation;
- `npm run build` - production client and server build;
- authenticated Chrome smoke test of all admin navigation sections;
- live Supabase count and field verification using the service-role server connection.

## Security Follow-up

Rotate the WooCommerce API key after testing because it was shared in a chat. Create a new read-only key, save it through the admin page, then revoke the old key in WordPress. Do not add either key to `implementation.md`, Git, screenshots, logs, or client-side environment variables.

## Current Decision

The initial live migration is complete and verified. Continue using **Keep existing items** for non-destructive re-imports. Use **Replace old catalogue** only after a database backup and explicit review of the deletion warning.

## Comprehensive Website Settings (2026-08-03)

The former basic general-settings form has been replaced by an 11-tab administrator settings manager:

1. General
2. Branding
3. Header & Footer
4. Store
5. Delivery
6. Orders
7. Payments
8. Contact & Social
9. SEO
10. Appearance
11. System

Settings are stored as structured JSON in `general_settings.config`; legacy columns remain synchronized. `general_settings.private_config` is reserved for server-only credentials and is never included in frontend responses. The public storefront reads `/api/public-settings`, which removes administrator notification destinations and update-user identifiers. Updates remain protected by Supabase administrator authentication.

Implemented behaviour includes dynamic logos, favicon, theme colour, business contacts, footer links, enabled social platforms, currency formatting, tax, product counts, delivery/pickup and area charges, payment visibility, order prefix/status/stock reduction, SEO metadata and tracking IDs, appearance variables/custom CSS, homepage visibility, and maintenance mode. Images use the existing Supabase `media` bucket with client and server validation for PNG/JPEG/WebP/GIF files up to 5 MB.

The admin manager provides per-tab Save/Reset actions, unsaved-change warnings, desktop/mobile branding previews, image preview/replacement/removal, settings import/export, cache clearing and last-update information. Product records retain individual SEO overrides.

Database migration: `supabase/migrations/003_comprehensive_site_settings.sql` (applied successfully to the live Supabase project on 2026-08-03).

## Product variants and checkout upgrade (2026-08-03)

- Product create/edit now opens in a responsive settings-style modal instead of expanding inside the product list.
- Administrators can add, edit and remove product variants with multiple attributes, SKU, regular/sale/current price, stock quantity and stock status. Existing WooCommerce variation IDs and data are preserved; manually created variants do not require a WooCommerce ID.
- Product price ranges are recalculated from saved variant prices, and imported/manual variants can be selected on the public product details modal.
- The products admin table now uses 10-row pagination with result counts and previous/next controls.
- The checkout basket suggests up to three related products, excluding items already in the basket.
- Checkout now captures required billing details and separate required delivery details, includes a “same as billing” option, country dropdowns, Sri Lankan contact-number validation, and delivery date/time validation with an earliest time of 11:00 AM.
- Checkout uses one continuous long form rather than a wizard. Billing accepts local or international contact numbers. Store pickup asks for a pickup location plus pickup-person name/contact and supports “billing person is the pickup person.” Home delivery asks for full delivery details and restricts only the delivery contact to a valid Sri Lankan number.
- Orders persist `billing_address`, `delivery_date`, and `delivery_time` in Supabase. Migration: `supabase/migrations/004_checkout_details.sql` (applied successfully to the live Supabase project on 2026-08-03).
- Pickup-person details are stored in `orders.pickup_person`. Migration: `supabase/migrations/005_pickup_person.sql` (applied successfully to the live Supabase project on 2026-08-03).
- Payment settings now include separate PayHere and Dialog Genie enable controls, merchant IDs, and sandbox/live environments. Gateway secrets remain server-only environment/private configuration and are not returned to the frontend.

Verification completed with `npm run lint`, `npm run build`, and live Chrome checks of the storefront suggestions, checkout fields, admin product pagination/modal, and payment settings. The browser console showed no errors during the tested flows.

## Prepared Food Ordering Module (2026-08-05)

The existing bakery catalogue, cart, checkout, payment and order tracker have been extended instead of creating a separate food-order system.

Implemented application behaviour:

- products can be marked as `bakery` or `food`;
- food products support their own preparation time and per-product ASAP/scheduled controls;
- food products use bulk order packages with only a person count and total package price, such as 5 people for Rs. 5,500 or 10 people for Rs. 10,000;
- food size/protein variants, spice choices and paid add-ons are no longer displayed or accepted;
- bakery products retain their existing variants and cake customization behaviour;
- the product modal records the selected bulk package, person count and server-validated package price in the cart/order;
- food-only carts support ASAP or scheduled preparation, while mixed bakery/food carts use one scheduled fulfilment time;
- cake-required dates are enforced as the earliest date for a mixed cart;
- kitchen weekdays, opening time, last-order time, preparation buffer, slot interval, capacity and temporary closure are managed in **Admin > Settings > Food Ordering**;
- checkout retains the existing billing, pickup and delivery rules; delivery phone numbers are validated as Sri Lankan numbers in both the browser and server;
- the server revalidates product/package availability, person counts, canonical package prices, kitchen hours, preparation lead time and slot capacity;
- existing `processing` and `ready_for_pickup` statuses are reused. Tracking labels become **Kitchen Preparation** or **Bakery & Kitchen Preparation**, so there is no duplicate tracking system;
- admin orders show the order type, ASAP/scheduled mode and requested fulfilment time.

Database migration: `supabase/migrations/006_food_ordering.sql`.

The eight supplied photographs are mapped in `scripts/seed-food-catalog.ts`. The importer creates provisional categories and eight **Draft** food products with their photographs, but deliberately sets every draft and its initial package to out of stock with price `0`. Names, descriptions, person counts, package prices and stock must be confirmed in the product modal before an administrator makes an item available. Run it only after applying migration 006:

```text
npm run seed:food -- --confirm
```

The importer is idempotent by stable product/category IDs, reuses uploaded images for existing draft IDs, and refuses to begin when the food schema is missing. New draft imports contain one disabled placeholder bulk package instead of size/protein or add-on options.

### Current live deployment status

Migration 006 was applied successfully to live Supabase project `akbxlcnzjcapzbskbhyv` on 2026-08-05. Because migrations 001–005 had previously been applied manually, their required live columns were verified before their migration-history entries were repaired; local and remote migration histories now match from 001 through 006.

The safe catalogue importer uploaded all eight supplied photographs to the Supabase `media` bucket and created eight food products plus six food/category records. Production verification returned 135 total products, including eight food products. Draft food items remain priced at `0` and `out_of_stock` until an administrator confirms their final names, descriptions, person-count packages, prices and stock status.

## Vercel Production Deployment (2026-08-05)

The application is deployed to the `inspiro-desk/thinesh-bake-house-website` Vercel project:

- Production URL: `https://thinesh-bake-house-website.vercel.app`
- Vercel deployment: `dpl_GYGYB1tAFDjAhnx1eXmxgp9uzdV1`
- Region: Washington, D.C. (`iad1`)
- Runtime: Vercel Node.js serverless function with the Vite frontend served by the shared Express application

Deployment support files:

- `api/index.ts` exports the shared Express application as the Vercel function;
- `vercel.json` builds the Vite frontend, includes `dist` with the function, and routes requests through Express;
- `.vercelignore` prevents local environment files, logs and development-only directories from being uploaded;
- `server.ts` exports the Express application, avoids opening a listener on Vercel, and loads Vite only during local development so Rollup native packages are not bundled into the serverless function.

Production verification returned HTTP 200 for `/`, `/api/products`, and `/api/public-settings`. Chrome rendered the production homepage and catalogue with no console errors. Required Supabase variables are stored as Vercel sensitive production variables. The local `GEMINI_API_KEY` and WooCommerce environment entries were empty; WooCommerce credentials remain stored in the application database, while Baker Buddy requires a Gemini key before its API can answer production requests.

## Compact Checkout Wizard (2026-08-05)

The checkout drawer was converted from a very tall sidebar form into a compact four-screen flow:

1. Basket review, suggestions and coupon
2. Billing details
3. Pickup or delivery fulfilment details
4. Date/time, payment method and order notes

The three checkout form stages display a persistent progress indicator, compact order total, Back/Continue controls and a final Place Order action. Existing checkout rules remain unchanged: billing accepts local or international phone numbers; delivery requires a valid Sri Lankan number; pickup supports copying the billing person; delivery supports copying the billing details; and delivery/kitchen schedule validation continues to run before order submission. Entered values are preserved while moving between stages, and the drawer scrolls to the top whenever the stage changes.

The production deployment was updated at `https://thinesh-bake-house-website.vercel.app`. Verification completed with `npm run lint`, `npm run build`, live HTTP 200 checks for the storefront and public APIs, and a Chrome walkthrough from basket to the billing stage. No test order was submitted.

## Three-Group Menu and Combo Packs (2026-08-05)

The single row of category pills was replaced by a two-level menu. Three fixed main tabs — **Bakery Items**, **Food Items** and **Combo Items** — sit above the category pills, and the pills now show only the categories belonging to the selected main tab. All three tabs are always rendered; an empty tab explains that nothing is available rather than disappearing.

Categories carry a `menu_group` value (`bakery`, `food` or `combo`) chosen in **Admin > Category Tree**, and products carry the matching `product_type`. When no category is assigned to a group, the sub tabs fall back to the categories actually used by that group's products, so existing imported catalogue data keeps working before an administrator revisits the category screen. Category deep links from the home page showcase still work: the menu jumps to whichever main tab owns the requested category.

Combos are a third product type rather than a separate entity, so they reuse the existing catalogue, cart, checkout, order and tracking paths:

- **Admin > Products & Gallery > Add Combo Pack** opens the product modal in combo mode with a catalogue search. Administrators type a product name, SKU or category, click a result, then set the quantity and unit price per line (for example 1 cake, 15 rolls and 2 doughnuts). Combos cannot contain other combos.
- The combined item value is calculated from the lines and shown to customers struck through. A separate **combo sale value** field sets the selling price, and the admin panel previews the savings badge live (2500 combined, 2200 sale, `SAVE Rs. 300`).
- The server recalculates the combined value from the saved lines, rejects a sale value that is zero, negative or not below the combined value, and stores the effective price in `price_min`/`price_max` so existing pricing code needs no special case.
- `dbStore.createOrder` revalidates the combo price against the database before an order is accepted, exactly as it already does for food variants and modifiers. Combos count towards the bakery side of `order_type`, so no new order status or tracking path was introduced.
- Combo items are snapshotted onto the order line, so an order keeps a record of what the combo contained at purchase time.

The storefront renders combos in a dedicated three-per-row grid (`src/components/ComboCard.tsx`) in a classic style: cream card with a double gold hairline frame, an ornamental divider, a quantity-chipped contents list, a struck-through combined value beside the combo price, and a green savings ribbon with the percentage saved. Cards stretch to a uniform row height with aligned price rows and calls to action. The product modal shows the same contents list with per-line totals, the combined value and the savings badge.

Database migration: `supabase/migrations/007_combo_menu.sql` — adds `products.combo_items`, extends the `product_type` check constraint with `combo`, and adds `categories.menu_group` with its own check constraint and index. Applied successfully to live Supabase project `akbxlcnzjcapzbskbhyv` on 2026-08-05 with `supabase db push`; local and remote migration histories match from 001 through 007.

Live verification after the migration returned all 14 categories defaulted to `menu_group = 'bakery'`, `combo_items` present and null on the existing 135 products, and a temporary probe row confirmed that the extended `product_type` constraint accepts `combo` and that combo lines round-trip through the JSON column. The probe row was deleted; the catalogue still holds 135 products and 14 categories.

Verification completed with `npm run lint`, `npm run build`, and a local browser walkthrough of the three main tabs, the combo sub tabs, the combo grid, the combo detail modal and adding a combo to the basket at its sale price.

## Bulk Food Packages (2026-08-05)

Prepared food ordering now follows the business's bulk-order model. In the product create/edit modal, a food product has a **Bulk order packages** section. Each package contains only:

- number of persons;
- total package price.

At least one valid package is required before a food product can be saved. The server rebuilds the package label, recalculates the product price range, removes legacy modifier data, and validates the selected package and price again when an order is submitted. Customers see person-count package cards only; food size/protein choices, spice levels, preparation add-ons and paid add-ons have been removed. Bakery variants and cake customization remain unchanged.

Existing food records that still contain the old placeholder variants must be opened in Admin and assigned real person counts and prices before customers can add them to the cart. This prevents unconfirmed pricing from being ordered.
