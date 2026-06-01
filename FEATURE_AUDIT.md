# ShipD2R Feature Audit

Last checked: 2026-06-01

This audit compares the current MVP implementation against the latest ShipD2R feature brief.

## Retailer / Outlet Owner

Status: Partial

Available now:
- Retailer WhatsApp inbox surface.
- Meta WhatsApp Cloud API configuration screen.
- Webhook endpoint for WhatsApp intake.
- Text/media extraction pipeline that can create admin verification drafts.
- Retailer message classification categories for orders, payments, complaints, stock, delivery, and unclear messages.

Still pending:
- Production WhatsApp auto-replies, catalogue sharing, promotion broadcasts, delivery confirmations, and reorder nudges.
- Retailer-facing invoice copy, stock availability, return/replacement workflows.
- Payment reminder automation tied to due dates.

## Sales Executive / Field Rep

Status: Partial but usable

Available now:
- Separate Sales Executive login.
- Mobile-friendly sales app surface.
- Fast actions for visit logging, order intent capture, payment updates, and evidence upload.
- Outlet, task, order, payment, and media upload views.
- Evidence upload supports image/audio/PDF extraction and sends drafts to admin verification.

Still pending:
- Route plan, map, nearby outlets, distance, missed visit reason, and priority outlet scoring.
- SKU-wise line items on orders.
- Dedicated visit records instead of visit-as-task shortcut.
- Sales rep performance analytics by conversion, activation, missed visits, and GMV.

## ShipD2R Operations Team

Status: Strong MVP

Available now:
- Admin/operator login.
- Retailer WhatsApp inbox.
- AI/media extraction lab.
- Classification and human verification queue.
- Admin can edit outlet, brand, SKU, amount, quantity, date, and notes before approval.
- Approval can write visits, orders, bills, payments, outlets, competitor insight, or tasks.
- Task management for follow-ups and escalations.

Still pending:
- Duplicate outlet detection.
- Missing field alerts.
- Assignment of verification queue items to specific ops users.
- Average verification time and correction-rate analytics.

## Brand Manager / Brand Partner

Status: Partial

Available now:
- Separate brand partner login.
- Brand dashboard with verified partner records only.
- Brand/client master, product/SKU count, sales value, units, and status.
- Reports page scaffold.

Still pending:
- Brand-specific outlet intelligence detail pages.
- Full SKU demand, competitor intelligence, complaint analytics, and export workflows.
- Brand controls for pricing, schemes, target cities, and campaign priorities.
- CRM sync configuration by brand.

## Admin / Management

Status: Strong MVP

Available now:
- Separate Admin and Manager logins.
- Distribution command center dashboard focused on GMV, pipeline, receivables, outlet universe, territory coverage, team follow-ups, brand/SKU movement, and verification health.
- User management for admin, manager, sales executive, brand, finance, and integration users.
- Brand/client master.
- SKU/product master under brands.
- Outlet master with territory and sales rep assignment.
- Territory master.
- Sales rep management.
- Orders, bills, payments, tasks, reports, integrations, AI, and WhatsApp configuration.
- Bulk import templates for master and operational records.

Still pending:
- Financial P&L views: retainer revenue, setup fees, commission, gross margin, EBITDA, cash burn, city-level profitability.
- Attendance, route adherence, and detailed rep productivity.
- Audit analytics for ops correction rate and unresolved item age.

## Finance / Collections Team

Status: New MVP surface

Available now:
- Separate Finance login role.
- Finance / Collections dashboard.
- Receivables, collected amount, outstanding amount, promise-to-pay, and high-risk account view.
- Collection ownership by assigned sales rep.
- Payment follow-up task list.
- Add payment, create follow-up, and bulk import payment actions.

Still pending:
- Payment proof approval/rejection workflow separated from general verification.
- Settlement notes and bank reconciliation.
- Tally, Zoho Books, Razorpay, Cashfree, UPI links, and bank statement integrations.

## Integration / Enterprise CRM User

Status: New MVP surface

Available now:
- Separate Integration login role.
- CRM / ERP Sync dashboard.
- Sync object overview for outlets, SKUs, order intents, and payment status.
- Connector roadmap for Zoho, Salesforce, HubSpot, Odoo, SAP Business One, Dynamics, LeadSquared, and custom APIs.
- Current integration state for Meta WhatsApp and AI provider.

Still pending:
- Field mapping UI.
- Sync frequency controls.
- Duplicate handling controls.
- Approval-before-sync controls.
- Error logs, retry queues, and native connector implementations.

## AI / Data Intelligence

Status: Strong MVP

Available now:
- Media extraction lab.
- Sarvam/OpenAI provider selection.
- Language selector with auto-detect and major Indian language options.
- Original and normalized text handling in verification drafts.
- Classification categories and confidence scores.
- Human-in-the-loop verification.

Still pending:
- Better provider-specific OCR benchmarking.
- Unmatched SKU/brand alerting.
- Suspicious payment detection.
- More reliable multi-event draft splitting for complex messages.

## MVP Conclusion

The current product has the core MVP backbone:

- Retailer WhatsApp intake
- Sales rep login and workflows
- Admin/ops verification
- Brand dashboard
- Product/SKU master
- Outlet, territory, task, payment, order, bill management
- Finance and integration user surfaces
- AI extraction and classification

The remaining work is mostly deeper workflow fidelity, analytics, automation, and integrations rather than basic product structure.
