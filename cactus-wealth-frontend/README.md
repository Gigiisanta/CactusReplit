# Cactus Wealth Frontend

A modern, professional dashboard for financial advisors built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication**: Secure JWT-based authentication with persistent sessions
- **Client Management**: Complete CRUD operations for client data
- **Portfolio Valuation**: Real-time portfolio valuation with market data
- **PDF Reports**: Generate and download professional portfolio reports
- **Responsive Design**: Mobile-first design with Cactus Wealth branding
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Cactus Wealth theme
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **Icons**: Lucide React
- **HTTP Client**: Native fetch API with custom client

## 📋 Prerequisites

- Node.js 18+ and npm
- Cactus Wealth Backend API running on `http://localhost:8000`

## 🏃‍♂️ Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🔐 Authentication

The application uses JWT token authentication. Demo credentials:

- Email: `demo@cactuswealth.com`
- Password: `demo123`

## 📁 Project Structure

```
cactus-wealth-frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Protected dashboard routes
│   ├── login/              # Authentication page
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx           # Root redirect page
├── components/
│   └── ui/                # Reusable UI components (shadcn/ui)
├── context/               # React Context providers
│   └── AuthContext.tsx   # Authentication state management
├── lib/                   # Utilities and API client
│   ├── api.ts            # Centralized API client
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🎨 Design System

The application implements Cactus Wealth's brand identity:

- **Primary Green**: `#2d8f2d` (cactus-500)
- **Secondary Sage**: `#5f6b5f` (sage-500)
- **Accent Sand**: `#d4b896` (sand-500)

Custom CSS classes:

- `.cactus-gradient`: Brand gradient background
- `.card-hover`: Interactive card hover effects
- `.brand-shadow`: Branded drop shadows

## 🔗 API Integration

The frontend integrates with the following backend endpoints:

- `POST /api/v1/login/access-token` - User authentication
- `GET /api/v1/clients/` - List clients
- `GET /api/v1/clients/{id}` - Get client details
- `GET /api/v1/portfolios/{id}/valuation` - Portfolio valuation
- `GET /api/v1/portfolios/{id}/report/download` - Download PDF report

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Features Implementation

#### 1. Authentication Flow

- JWT tokens stored in localStorage
- Automatic token inclusion in API requests
- Route protection with redirects
- Session persistence across browser refreshes

#### 2. Client Management

- Responsive data tables with search and filters
- CRUD operations with optimistic updates
- Risk profile visualization
- Client statistics dashboard

#### 3. Portfolio Integration

- Real-time portfolio valuation display
- Performance metrics with visual indicators
- PDF report generation and download
- Client portfolio overview

## 🚀 Deployment

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL

### Tailwind Configuration

The Tailwind config includes custom Cactus Wealth colors and theme extensions. Modify `tailwind.config.ts` to adjust the design system.

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Follow the established code style
2. Use TypeScript for all new code
3. Maintain responsive design principles
4. Test all API integrations
5. Follow the component structure patterns

## 📄 License

Proprietary - Cactus Wealth Management

---

Built with ❤️ by the Cactus Wealth team

## 🚀 Deploy en Replit

1. Define la variable de entorno `NEXT_PUBLIC_API_URL` en el panel de Secrets de Replit, apuntando a la URL pública de tu backend (por ejemplo, `https://<tu-backend-replit-url>/api/v1`).
2. Si usas autenticación o endpoints protegidos, asegúrate de que CORS esté configurado correctamente en el backend.
3. Inicia la app normalmente en Replit.

## Quality & Testing

- `npm run lint` — Lint all frontend code
- `npm run type-check` — Type-check all TypeScript code
- `npm run test` — Run all unit tests
- `npm run e2e` — Run all Playwright E2E tests
