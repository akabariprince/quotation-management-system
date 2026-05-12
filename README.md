# Ecstatics Quotation Management System

Welcome to the **Ecstatics Quotation Management System**. This project is a comprehensive tool designed to streamline the process of creating, managing, and tracking quotations, projects, and customer interactions.

## 🚀 Getting Started

To get this project running locally on your machine, follow these simple steps:

### Prerequisites
Make sure you have **Node.js** (v18+) or **Bun** installed.

### Installation
1. Clone the repository to your local machine.
2. Install the dependencies:
   ```bash
   # Using Bun (Recommended)
   bun install

   # Or using NPM
   npm install
   ```

### Running the App
Start the development server:
```bash
bun dev
# or
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to see the application.

---

## 🛠 Tech Stack

This project is built with modern, high-performance tools:
- **Frontend Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Routing**: [React Router](https://reactrouter.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Exporting**: [jsPDF](https://github.com/parallax/jsPDF) and [html2canvas](https://html2canvas.hertzen.com/) for PDF generation, [XLSX](https://github.com/SheetJS/sheetjs) for Excel reports.

---

## ✨ Key Features

- **Dashboard**: High-level overview of system metrics and activities.
- **Quotation Management**: Full lifecycle management of quotes, from creation to approval.
- **Project Tracking**: Manage project-specific details linked to quotations.
- **Customer CRM**: Maintain a database of customers and their history.
- **Approval Workflow**: Integrated system for managing quotation approvals.
- **Master Data**: Centralized management of core data (Masters).
- **User & Role Management**: Control access levels and user permissions.
- **Reporting**: Generate detailed Excel reports and visual analytics.
- **PDF Generation**: Live preview and download of quotations as PDFs.
- **Email Logs**: Track communications sent through the system.

---

## 🔑 Login Credentials

For testing and demonstration, you can use the following default accounts (all passwords are `password123`):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@esipl.in` | `password123` |
| **Master** | `master@esipl.in` | `password123` |
| **Creator** | `creator@esipl.in` | `password123` |
| **Data Entry** | `dataentry@esipl.in` | `password123` |

---

## 📂 Project Structure

- `src/components`: Reusable UI components (buttons, inputs, layouts, etc.).
- `src/pages`: Main application views/screens.
- `src/hooks`: Custom React hooks for shared logic.
- `src/lib`: Third-party library configurations (e.g., utils for shadcn).
- `src/contexts`: React Context providers for global state.
- `src/utils`: Helper functions and formatting utilities.

---

## 📝 Handover Notes

- **Environment Variables**: Ensure you have a `.env` file based on the project requirements (check `.env` for existing keys).
- **Deployment**: The project is pre-configured for **Vercel** deployment (`vercel.json` included).
- **Testing**: Unit tests can be run using `bun test` or `npm test` (Vitest).
- **Name Change**: The project name in `package.json` has been updated to `ecstatics-quotation-management-system`.

---

Happy coding! If you have any questions during the handover, feel free to reach out.
