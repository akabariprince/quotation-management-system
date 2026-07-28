# Quotation Management System — Frontend Documentation

## 1. Frontend Overview

- The frontend is a responsive React application for managing customers, product masters, quotation projects, approvals, users, reports and communication settings.
- It communicates with the backend through REST APIs configured using `VITE_API_URL`.

- Authentication, route protection and screen visibility are controlled using the logged-in user's role permissions.
- The Admin role receives a frontend permission bypass, while other roles use their assigned permission list.

- The interface supports desktop, tablet and mobile layouts using Tailwind CSS responsive utilities.
- Reusable layouts, dialogs, tables, filters, pagination controls and form components are shared across screens.

---

## 2. Frontend Technology Stack

| Technology | Usage |
|---|---|
| React 18 | Component-based user-interface development. |
| TypeScript 5 | Typed pages, hooks, forms and API models. |
| Vite 5 | Development server, production build and preview. |
| React Router 6 | Public, protected and permission-based routes. |
| Tailwind CSS 3 | Responsive layout, spacing, colours and typography. |
| Radix UI | Accessible dialogs, tabs, selects, tooltips, menus and switches. |
| Shadcn-style components | Reusable application UI components built over Radix UI. |
| Lucide React | Icons used in navigation, actions, forms and status displays. |
| React Hook Form | Form-state support for structured forms. |
| Zod | Frontend schema-validation support. |
| TanStack React Query | Query client configured at application level. |
| Recharts | Charts used in MIS and business reports. |
| XLSX | Excel export for report information. |
| jsPDF and html2canvas | Frontend report export to PDF. |
| Sonner | Success, warning and error toast notifications. |
| Vitest and Testing Library | Frontend test configuration. |

---

## 3. Frontend Requirements

- Node.js 18 or newer is recommended.
- npm is required to install packages and run scripts.

- The backend API must be running and accessible from the browser.
- The backend CORS configuration must include the frontend URL.

---

## 4. Installation and Run Steps

### 4.1 Open the Frontend Folder

```bash
cd quotation-management-system-main
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Create the Environment File

Windows:

```bash
copy .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

### 4.4 Configure the API URL

```env
VITE_API_URL=http://localhost:5001/api
```

- `VITE_API_URL` is used by authentication, custom API hooks, settings calls and file-download actions.
- When it is missing, the frontend falls back to `http://localhost:5001/api`.

### 4.5 Run in Development Mode

```bash
npm run dev
```

- The Vite configuration runs the application on port `8080`.
- Open `http://localhost:8080` in the browser.

### 4.6 Create a Production Build

```bash
npm run build
```

- The compiled production files are created in the `dist` directory.
- Vercel routing support is included through the project configuration.

### 4.7 Preview the Production Build

```bash
npm run preview
```

### 4.8 Quality and Test Commands

```bash
npm run lint
npm run test
```

---

## 5. Frontend Project Structure

```text
src/
├── components/
│   ├── common/       Shared dialogs, pagination, search and OTP components
│   ├── layout/       Main and administration layouts
│   ├── project/      Quotation project components
│   └── ui/           Reusable Radix/Shadcn-style UI components
├── config/           Navigation and module configuration
├── contexts/         Authentication context and session state
├── hooks/            API and business-data hooks
├── lib/              Utilities and settings API functions
├── pages/            Application screens
├── test/             Frontend test setup
├── App.tsx            Routes and application providers
└── main.tsx           Frontend entry point
```

---

## 6. Application Providers and Shared Behaviour

- `QueryClientProvider` is configured with one retry and disabled refetch-on-window-focus.
- Most business hooks currently manage data using the shared `useApi` fetch wrapper and React state.

- `AuthProvider` manages the current user, access token, refresh token and permission checks.
- Access and refresh tokens are stored in browser `localStorage`.

- `TooltipProvider`, Shadcn Toaster and Sonner are available throughout the application.
- Common success and failure messages are shown without leaving the current screen.

---

## 7. Authentication and Session Flow

- The Login screen first requests active login users and displays them in a dropdown.
- The selected user's email and entered password are submitted to the backend.

- A successful login stores the returned access token, refresh token and user profile.
- The browser is redirected to `/dashboard` after authentication.

- During application startup, the frontend calls the profile API using the saved access token.
- When the saved token is invalid, it attempts a refresh-token request before clearing the session.

- The shared API hook attaches `Authorization: Bearer <token>` to authenticated requests.
- A `401` response clears the session and redirects the user through the protected-route flow.

### Authentication APIs

| Method | Endpoint | Frontend Usage |
|---|---|---|
| GET | `/auth/login-users` | Load active users for the Login dropdown. |
| POST | `/auth/login` | Authenticate the selected user. |
| GET | `/auth/profile` | Restore the current authenticated profile. |
| POST | `/auth/refresh-token` | Request a new access and refresh token pair. |
| POST | `/auth/logout` | Clear the backend refresh-token value. |

---

## 8. Routing and Access Control

| Route | Screen | Required Frontend Permission |
|---|---|---|
| `/login` | Login | Public route. |
| `/dashboard` | Dashboard | `dashboard:view` |
| `/customers` | Customer List | `customer:view` |
| `/customers/new` | Add Customer | `customer:create` |
| `/customers/edit/:id` | Edit Customer | `customer:edit` |
| `/products` | Product Catalogue | `quotation:view` |
| `/masters` | Master Management | `master:view` |
| `/projects` | Project List | `project:view` |
| `/projects/new` | Create Project | `project:create` |
| `/projects/edit/:id` | Edit Project | `project:edit` |
| `/projects/:id` | View Project | `project:view` |
| `/projects/:id/pdf` | PDF Preview | `project:view` |
| `/reports` | MIS Reports | `report:view` |
| `/users` | Users and Roles | `user:view` or `role:view` |
| `/approvals` | Approval Management | `approval:view` |
| `/email-logs` | Notifications | `email_log:view` |
| `/settings` | Settings | `setting:manage` in the current frontend route. |

- All protected screens are rendered inside the main application layout.
- Users without the required permission are redirected to the Dashboard.

---

## 9. Main Layout and Navigation

- The main layout displays the company logo, user details, role information, navigation and logout action.
- Navigation entries are filtered using single-permission or any-permission rules.

- Available modules include Projects, Customers, Products, Masters, Approvals, Users and Roles, Notifications, Reports and Settings.
- The same navigation configuration is used to build the Dashboard module cards.

- The Dashboard excludes its own card and displays the remaining permitted modules.
- Card columns are recalculated according to the available screen height.

---

# 10. Screen-Wise Features

## 10.1 Login Screen

- Loads active users from the backend and displays each user's name and role.
- Users select an account and enter only the corresponding password.

- Validates that a user and password are provided before sending the request.
- Displays loading, empty-user and invalid-login states.

- Redirects authenticated users to the Dashboard.
- Includes a responsive two-column desktop layout and single-column mobile layout.

**Connected APIs:** `/auth/login-users`, `/auth/login`.

---

## 10.2 Dashboard Screen

- Displays permission-based module cards instead of loading business statistics.
- Each card opens its configured application module.

- Automatically arranges cards into columns based on the available height.
- Displays a “No modules available” message when no permitted module exists.

**Connected APIs:** Uses authenticated user and role information already loaded by `AuthProvider`.

---

## 10.3 Customer List Screen

- Displays customers using backend pagination with a page size of 10.
- Supports search by name, mobile, email or city.

- Supports state and region filters.
- First, previous, next and last-page controls are available.

- Displays contact information, GSTIN, location, creator and verification status.
- Mobile and email verification indicators are shown separately.

- View opens a details dialog containing billing, delivery and contact information.
- Edit and Delete depend on permissions and customer ownership.

- `customer:manage_all` allows management of every customer.
- Other permitted users can be limited to records created by their own account.

**Connected APIs:** `GET /customers`, `GET /customers/:id`, `DELETE /customers/:id`.

---

## 10.4 Add and Edit Customer Screen

- The same form supports Create and Edit modes.
- Edit mode loads the selected customer using the route ID.

- Captures name, mobile, email, contact person, GSTIN, region, state, city and pincode.
- Supports billing address, landmark and separate delivery-address fields.

- “Delivery same as billing” copies current billing values into delivery fields.
- Users can disable it and provide a different delivery location.

- Customer name and mobile are required.
- The frontend expects a valid 10-digit local mobile number.

- Email format is checked when an email is entered.
- GSTIN must contain exactly 15 characters when provided.

- Local mobile values are normalised with the Indian `+91` country code before submission.
- Verified values are tracked using backend OTP log IDs.

- Mobile verification sends and verifies a six-digit WhatsApp OTP.
- Email verification sends and verifies a six-digit Email OTP.

- Changing a verified mobile or email resets its verification state.
- The new value must complete verification again.

**Connected APIs:** customer Create, Update, Mobile OTP Request/Verify and Email OTP Request/Verify.

---

## 10.5 Product Catalogue Screen

- Displays product records as responsive cards with image, name, part code, price and status.
- Uses backend pagination with a page size of 12.

- Supports text search and Pending or Active status filtering.
- Active filters can be cleared from the screen.

- Product Details displays classification, materials, dimensions, description and timestamps.
- Pricing displays base price, discount, GST and final price including GST.

- Multiple product images are displayed as thumbnails.
- Previous, next, keyboard navigation and image zoom are supported.

- Delete is available when the frontend permission check allows it.
- Product creation and editing are handled in the Products tab of Masters.

**Connected APIs:** `GET /quotations`, `GET /quotations/:id`, `DELETE /quotations/:id`.

---

## 10.6 Master Management Screen

- Provides separate tabs for Category, Category Number, Type, Variant, Selections and Products.
- Each tab maintains independent search, filter, page and dialog state.

- Basic master tabs support Create, Edit, Delete, Pending and Active statuses.
- Lists are loaded using backend search, pagination and status parameters.

- The screen also loads Quotation Models, Wood, Polish and Fabric data for product forms.
- These supporting datasets are used in product classification and material fields.

- Admin can activate supported records directly.
- Other roles can request master activation through the OTP workflow.

- Users with approval permission can approve supported pending records.
- The screen refreshes the affected tab after a successful action.

**Connected APIs:** Categories, Category Numbers, Quotation Types, Quotation Models, Variants, Selections, Woods, Polishes, Fabrics and Quotations.

---

## 10.7 Category, Category Number, Type and Variant Tabs

- Each master stores a name and Pending or Active status.
- Search, pagination, Create, Edit and Delete actions are supported.

- These masters are combined to classify products and build product part codes.
- Active records are available for product and project selection.

- Form actions display success or failure notifications.
- Updated lists are reloaded after changes.

**Connected APIs:** standard GET, POST, PUT and DELETE endpoints for each master.

---

## 10.8 Selection Management

- Creates configurable product properties such as Wood, Fabric, Leather, Leather Rite, Metal, Glass, Stone, Polish and Paint.
- Each selection can contain multiple ordered values.

- A General selection is available without a restricted variant mapping.
- A Variant Connected selection requires at least one selected variant.

- Selecting all variants or no specific variant is handled as General in the frontend flow.
- Selecting a subset creates variant-specific mapping information.

- Values and variant mappings are submitted together with the selection.
- The backend returns values and mappings for future editing.

- Active selections are used inside Project Product Configuration.
- Applicable selections are filtered according to the chosen product variant.

**Connected APIs:** `GET/POST /selections`, `GET/PUT/DELETE /selections/:id`.

---

## 10.9 Product Management

- Creates and edits product records from Category, Category Number, Quotation Type, Model and Variant.
- Wood, Polish and Fabric references are also supported.

- Captures product name, part code, dimensions, description, base price, discount and GST.
- Dimensions are entered as length, width and height in millimetres.

- Product code is built from the selected Category, Category Number, Type and Variant values.
- Classification changes can update the product code during editing.

- New product images are submitted through multipart form data.
- Existing image paths can be retained while editing.

- Up to 10 image files can be sent in one request.
- Accepted formats are JPEG, PNG, WebP and GIF, with a 5 MB limit per image.

- Products can be stored as Pending or Active.
- Admin users receive a direct Add and Activate action.

- The default form values include 15% discount and 18% GST.
- Pricing fields are recalculated and displayed before submission.

**Connected APIs:** product list/details, multipart Create, multipart Update and image handling through `/quotations`.

---

## 10.10 Project List Screen

- Displays projects using search, status filter and backend pagination with 10 records per page.
- Search supports project number, project name and customer information.

- Supported statuses are Draft, Sent, Approved, Rejected, Expired and Purchase Order.
- Values are displayed using Indian Rupee formatting.

- Displays project number, name, customer, date, amount, status and stage information.
- Email and WhatsApp activity indicators can be included in project data.

- Users can View, Edit, Duplicate, download PDF or Delete according to permission and status.
- Purchase Order and Rejected projects are not opened in editable mode.

- Approved projects can be converted to Purchase Order.
- Duplicate creates a new project and opens it in Edit mode.

- PDF download uses an authenticated fetch request and browser file download.
- The filename returned by the backend is preserved when available.

**Connected APIs:** Project List, Duplicate, Status Update, Delete and PDF Download.

---

## 10.11 Create and Edit Project Screen

- The project form supports Create, Edit and View modes.
- Purchase Order and Rejected records use read-only behaviour.

- The workflow is divided into project/customer information and product configuration.
- A new project number is requested from the backend.

- Captures project name, project date, customer, salesperson and delivery information.
- The logged-in user is used as the default salesperson for a new project where possible.

- Customer search loads recent results and supports server-side text search.
- Add Customer and Edit Customer can be opened directly from the project workflow.

- Delivery can use the selected customer's saved address.
- A custom delivery address, landmark, city, state and pincode can be stored.

- At least one customer and one project item are required before final save.
- Save as Draft and Save and Send are available according to the current mode.

**Connected APIs:** Next Project Number, Customer Search, Salesperson List, Project Details, Create and Update.

---

## 10.12 Product Search Inside Project

- Requires Category, Category Number, Quotation Type and Variant before product matching.
- The frontend requests Active products matching the selected master IDs.

- Matching products display image, part code, description and price.
- A selected product is converted into a quotation project item.

- The same product cannot be added twice to one project.
- Users update the existing item's quantity instead.

- The screen loads General selections and selections mapped to the product variant.
- For the `SX` variant, Leather-category selections are excluded by frontend logic.

**Connected APIs:** Active quotation/product search, categories, category numbers, types, variants and selections.

---

## 10.13 Project Item Configuration

- Each item stores a snapshot of product code, name, description, images and price.
- Snapshot information protects the quotation from later product-master changes.

- Users can choose selection values applicable to the product variant.
- Empty selection values use `N.A.` in the current interface.

- Quantity starts at one and is restricted between 1 and 100.
- Editing quantity requires `quantity:edit`.

- Discount editing requires `discount:edit`.
- Role minimum and maximum discount limits control direct application.

- Users can add general notes and a special note for each product.
- Item removal immediately recalculates project totals.

- Field-level permissions separately control image, quantity and discount editing.
- These checks work in addition to general project permissions.

---

## 10.14 Pricing, Discount and GST

- Item base amount is product base price multiplied by quantity.
- Discount amount is calculated from the item base amount.

- GST is calculated using the item's GST percentage.
- The current frontend splits GST equally between CGST and SGST and keeps IGST at zero.

- Item total is base amount plus GST minus discount.
- Project totals combine subtotal, discount, CGST, SGST, IGST and grand total.

- Admin can apply a discount between 0% and 100% directly.
- Other users can apply a discount directly only inside their role range.

- A discount outside the permitted range opens the OTP approval flow.
- Successful verification applies the requested discount and recalculates totals.

- Discount input supports 0.5% increments.
- A short input delay prevents repeated OTP requests while typing.

**Connected APIs:** `/auth/otp/request`, `/auth/otp/verify`, OTP status and resend endpoints.

---

## 10.15 Save and Send Workflow

- Save as Draft stores the project and returns the user to the project list.
- Save and Send stores the project and opens notification options.

- Available Email and WhatsApp channels are loaded from notification preferences.
- Disabled channels are not offered for the related notification type.

- Customer Email requires an available email address.
- Customer WhatsApp requires an available and verified mobile number.

- Email subject and message are prepared using project and customer information.
- Available message content can be edited before sending.

- The backend generates a quotation PDF snapshot before sending.
- Each Email or WhatsApp attempt is recorded as a communication log.

- A Draft project can move to Sent through this workflow.
- Success and failure messages are displayed after the backend response.

**Connected APIs:** Settings by key and `POST /projects/:id/send-email`.

---

## 10.16 Project View and PDF Preview

- Project View displays project, customer, salesperson, delivery and quotation-item information.
- It shows quantity, selections, notes, discount, GST and totals.

- PDF Preview renders a responsive A4-style quotation inside the browser.
- The page scale changes according to the available viewport width.

- The first page contains company, customer, project and quotation-summary information.
- Product pages contain image, dimensions, selections, notes and pricing.

- A final terms-and-conditions page is included.
- Signature and salesperson areas are displayed in the quotation layout.

- Final downloadable quotation PDFs are generated by the backend.
- The frontend PDF Preview is used for visual checking before download or delivery.

**Connected APIs:** Project Details and Project PDF Download.

---

## 10.17 Approval Management Screen

- Contains Project Approvals, Pending Queue and All OTP Logs tabs.
- Project Approvals is shown when the user has project-approval permission.

- Summary cards show pending requests, approved-today count, expired/rejected count and total OTP requests.
- A sent-project count is shown for project approvers.

- Pending and All Logs support search, type, status and pagination.
- OTP types include Login, Discount and Master Activation.

- Authorised users can approve using OTP, direct approve, reject or resend.
- Expired pending requests are displayed separately from active pending requests.

- Project approval changes a Sent project to Approved or Rejected.
- Rejection supports a reason before updating the status.

**Connected APIs:** OTP Stats, Pending Logs, All Logs, Approve, Direct Approve, Reject, Resend and Project Status Update.

---

## 10.18 Reports Screen

- Contains Overview, Quotation Summary, Pending, Conversion, Sales Performance, Customer History, Product, Discounts and PDF Prints.
- Each report loads only its connected backend report operation.

- Filters include date, customer, salesperson, project, search and status where supported.
- Report controls update the current dataset without leaving the screen.

- Recharts displays summary and distribution charts.
- XLSX exports tabular report data to Excel.

- jsPDF and html2canvas export visible report sections to PDF.
- PDF Print History files are downloaded from backend storage.

### Overview

- Shows project count, customer count, project-item count and recognised revenue.
- Displays project counts and values by status.

### Quotation Summary

- Shows quotation count, total value, discount and average quotation value.
- Includes monthly value and status-distribution charts.

### Pending

- Displays Approved quotations waiting for Purchase Order conversion.
- Calculates pending days, follow-up date and overdue count.

### Conversion

- Treats Purchase Order projects as converted and Expired projects as lost.
- Shows conversion rate, converted value, pending value and lost value.

### Sales Performance

- Groups quotation count, conversion and revenue by salesperson.
- Shows converted revenue and discount values.

### Customer History

- Lists customer-level quotation summaries before a customer is selected.
- Displays complete customer and project-item history after selection.

### Product Performance

- Groups quoted quantity, usage count, revenue and discount by product.
- Displays related quotation and customer context.

### Discount Approval

- Shows discounted project items and their OTP approval records.
- Displays requester, approver and current approval status.

### PDF Print History

- Lists generated PDF snapshots with project, customer and generator details.
- Supports filtering, export and saved-file download.

**Connected APIs:** all `/reports/*` endpoints used by `useReports`, customer lookup and project-status update.

---

## 10.19 User Management Screen

- Displays users using search, role, active-status and backend pagination.
- User rows show name, email, mobile, role, verification and status.

- Create fields include name, email, password, mobile, role and active state.
- Password is required during creation and optional during editing.

- Email format, mobile length and minimum password length are validated.
- The assigned role must be selected from active backend roles.

- Mobile verification uses a six-digit WhatsApp OTP.
- Email verification uses a six-digit Email OTP.

- Changing a verified mobile or email removes the previous verification state.
- New OTP log IDs are submitted after successful verification.

- Authorised users can activate, deactivate, edit or delete user accounts.
- The interface prevents the current user from deleting their own account.

**Connected APIs:** User List, Details, Create, Update, Delete and User Mobile/Email OTP operations.

---

## 10.20 Role and Permission Management

- Roles contain internal name, display name, description, permissions and active state.
- Role names are formatted using lowercase letters and underscores.

- Role creation requires at least one permission.
- Available permissions are loaded from the backend permission metadata endpoint.

- Discount minimum and maximum values are configured per role during creation.
- Master activation can be configured to require OTP.

- System roles are protected from normal deletion.
- Roles assigned to users cannot be removed.

- The Permission Matrix groups permissions by Dashboard, Masters, Customers, Projects, Users, Roles, Reports, Approvals, Logs, OTP and Project Fields.
- Project field permissions control image, quantity and discount editing.

**Connected APIs:** Role List, Active Roles, Permission Metadata, Role Details, Create, Update and Delete.

---

## 10.21 Email and WhatsApp Logs Screen

- Displays Email and WhatsApp records from the shared backend communication log.
- Uses backend pagination with 20 records per page.

- Filters include channel, notification type, status and search text.
- Supported statuses are Queued, Pending, Sent, Delivered, Read and Failed.

- Summary cards show total messages, successful messages, failed messages and messages created today.
- Users can manually refresh the current result set.

- Each row shows date, channel, type, recipient, sender, subject and status.
- Provider delivery information and errors are retained by the backend.

- Current filtered data can be exported to CSV.
- WhatsApp webhook updates can change Sent records to Delivered, Read or Failed.

**Connected APIs:** `GET /email-logs`, `GET /email-logs/stats`.

---

## 10.22 Settings Screen

- Manages Email configuration, WhatsApp configuration, WhatsApp templates and notification preferences.
- Settings are loaded and saved as backend key-value records.

### Email Configuration

- Stores SMTP host, port, secure option, username, password and sender name.
- Leaving the password blank during an update keeps the currently stored password.

### WhatsApp Configuration

- Stores the InboundSage API key and connected WhatsApp Business information.
- Sync loads account, phone, quality, tier and usage information from the provider.

### WhatsApp Templates

- Fetches available templates and displays name, language, status, body, header and buttons.
- Templates can be assigned to supported notification types.

- The screen checks expected template-variable count against provider variables.
- Project quotation templates can include the generated PDF as a document header.

### Notification Preferences

- Email and WhatsApp can be enabled independently for supported notification types.
- Customer and User OTP default to WhatsApp, while several business notifications default to Email.

- Preferences are read during project sending and other notification workflows.
- Disabled channels are skipped by the frontend and backend flow.

**Connected APIs:** Setting Get/Update, WhatsApp Sync and WhatsApp Template Fetch.

---

## 11. Shared Components

### Customer Search Select

- Loads recent customers and performs backend search after user input.
- Fetches the selected customer directly when only an ID is available.

### Quotation Search Select

- Loads recent products and performs backend text search.
- Fetches the selected product when an existing value must be restored.

### OTP Modal

- Requests Login, Discount or Master Activation OTPs.
- Supports verification, resend and periodic status checks.

### Pagination

- Shared pagination components provide previous, next and page-number navigation.
- Several screens also provide first and last-page actions.

### Verification Field

- Combines contact input, Send OTP, OTP entry and Verify actions.
- Displays verification, loading and disabled states.

---

## 12. Frontend API Handling

- `useApi` supports GET, POST, PUT, PATCH and DELETE requests.
- JSON content type is omitted automatically for multipart form-data uploads.

- Backend error messages are converted into JavaScript errors.
- Screens display these messages using Sonner or the shared toast system.

- List hooks store returned data, loading state and pagination metadata.
- Create, Update and Delete methods return data to the calling screen for refresh and navigation.

- Authenticated file downloads use direct browser fetch with the access token.
- The PDF filename is read from the `Content-Disposition` response header where available.

---

## 13. Frontend Environment and Deployment

- Development server host is configured as `::` and port `8080`.
- The frontend can therefore be accessed from localhost and supported network interfaces.

- The project includes a Vercel rewrite configuration for client-side routing.
- All application paths must return the main frontend page in production.

- Production environments must define the correct `VITE_API_URL` before building.
- The backend must expose uploads and PDFs through publicly reachable URLs.

---

## 14. Frontend Build Outputs

- `npm run build` compiles TypeScript and application assets into `dist`.
- The output can be deployed to Vercel or another static hosting service.

- The hosting platform must support SPA route fallback.
- Environment values are embedded at build time by Vite.

---

## 15. Frontend Functional Summary

- The frontend covers authentication, permission-based navigation, customers, products, projects, approvals, reports, users, roles, logs and settings.
- Each business screen is connected to a dedicated backend API module.

- Customer and user verification use Email or WhatsApp OTP.
- Discount and master activation use the shared approval workflow.

- Project creation combines customer data, product masters, selectable options, quantity, discount, GST, notes and notification delivery.
- Reports and PDF history provide operational and management visibility.
