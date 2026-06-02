# ShipD2R Login IDs

Last updated: June 2, 2026

## Login Rule

Use the user's email, phone number, or name as the login identifier.

The access code is the last 4 digits of that user's phone number.

If no admin user exists yet, use:

| Role | Login identifier | Access code | Notes |
| --- | --- | --- | --- |
| Admin | Any email or identifier | 0000 | Bootstrap-only login. Create a real admin from Access Management after logging in. |

## Seeded Demo Logins

| Role | Name | Login email | Phone | Access code | Territory / Notes |
| --- | --- | --- | --- | --- | --- |
| Manager | Ops Manager | ops.manager@example.com | +91 98888 19999 | 9999 | Operations manager workspace |
| Sales Executive | Meera S. | meera.field@example.com | +91 98888 10001 | 0001 | Pune West |
| Sales Executive | Arjun K. | arjun.field@example.com | +91 98888 10002 | 0002 | Nashik Core |
| Sales Executive | Ravi M. | ravi.field@example.com | +91 98888 10003 | 0003 | Thane Retail |

## Role Options In The App

| Login role shown on screen | Internal role records that can log in |
| --- | --- |
| Admin | Admin, Admin Operator |
| Manager | Manager |
| Sales Executive | Sales Executive |
| Brand Partner | Brand Viewer, Brand Manager |
| Finance | Finance |
| Integration | Integration |

## Creating Or Updating Logins

Admins can create or edit user logins from `Access Management`.

For each user, set:

| Field | Purpose |
| --- | --- |
| Name | User display name and optional login identifier |
| Login email | Primary login identifier |
| Phone | Used to derive the access code |
| Login role | Controls the workspace and permissions |
| Territory | Used for field execution and reporting context |
| Status | Active users can log in |

Example: if a user's phone is `+91 98765 43210`, the access code is `3210`.
