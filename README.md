# 🌵 CactusDashboard - Integrated CRM & Wealth Management Platform

**Next.js + FastAPI + PostgreSQL + Twenty CRM + n8n Automation**

A comprehensive wealth management platform with advanced CRM integration, real-time synchronization, and automated workflows.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cactus CRM    │◄──►│   SyncBridge     │◄──►│   Twenty CRM    │
│   (Core Logic)  │    │ (Bidirectional)  │    │ (Commercial Hub)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Next.js UI     │    │     Redis        │    │   n8n Workflows │
│   Frontend      │    │   (Sync Cache)   │    │  (Automation)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ⚠️ Known Issues

**Twenty CRM Temporary Disable**: Due to a persistent bug in the Twenty CRM Docker image (psql command malformation), the Twenty CRM service is temporarily disabled. The core CactusDashboard system (backend, frontend, SyncBridge, n8n) functions normally without it. 

- **Error**: `psql: error: could not translate host name "-p" to address: Name does not resolve`
- **Affected versions**: `latest`, `v1.0.3`, multiple other versions
- **Workaround**: Twenty CRM service commented out in `docker-compose.yml`
- **Impact**: CRM sync functionality temporarily unavailable; all other features work normally

## 🚀 Quick Start with Integrated CRM

```bash
# 1. Clone and setup
git clone <your-repo>
cd CactusDashboard

# 2. Start all services (Cactus + Twenty + SyncBridge + n8n)
./start.sh

# 3. Access the platforms
# - Cactus CRM: http://localhost:3000
# - Twenty CRM: http://localhost:3001
# - SyncBridge API: http://localhost:8001
# - n8n Workflows: http://localhost:5678
```

## 🎯 Key Features

### Core CRM (Cactus)
- ✅ **Client Management**: Full CRUD with sales pipeline tracking
- ✅ **Investment Portfolios**: Multi-asset portfolio management
- ✅ **Financial Products**: Investment accounts & insurance policies
- ✅ **Risk Profiling**: LOW/MEDIUM/HIGH investor categorization
- ✅ **Lead Source Tracking**: ORGANIC/REFERRAL/MARKETING attribution

### Twenty CRM Integration
- 🌟 **Commercial Hub**: Standardized CRM interface
- 🌟 **External Integrations**: Ready for Zapier, Make, etc.
- 🌟 **Bidirectional Sync**: Real-time data synchronization
- 🌟 **API Gateway**: Secure external access point

### Automation (n8n)
- 🤖 **Customer Onboarding**: Automated welcome sequences
- 🤖 **Sales Alerts**: Slack notifications for won deals
- 🤖 **Email Campaigns**: Personalized customer communications
- 🤖 **Webhook Processing**: Event-driven workflows

## 📋 Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Cactus Frontend | 3000 | Main dashboard UI |
| Cactus Backend | 8000 | Core API & business logic |
| Twenty CRM | 3001 | Commercial CRM interface |
| SyncBridge | 8001 | Bidirectional sync service |
| n8n Workflows | 5678 | Automation platform |
| PostgreSQL | 5432 | Cactus database |
| Twenty DB | 5433 | Twenty CRM database |
| Redis | 6379 | Sync cache & sessions |

## 🔧 Configuration

### 1. Environment Setup
```bash
# Copy and customize environment variables
cp .env-example .env

# Key variables to configure:
TWENTY_API_KEY=your-twenty-api-key-here
SLACK_WEBHOOK_URL=your-slack-webhook
GMAIL_USER=your-gmail@gmail.com
```

### 2. Twenty CRM Setup
```bash
# Use built-in setup guide
./start.sh twenty-setup

# Or manually:
# 1. Go to http://localhost:3001
# 2. Login: admin@twenty.dev / password
# 3. Settings → API & Webhooks → Create API Key
# 4. Update TWENTY_API_KEY in .env
```

### 3. n8n Workflows
```bash
# Access n8n
# URL: http://localhost:5678
# Login: admin / admin

# Import ready-made workflows:
# - Customer Onboarding: n8n-workflows/customer-onboarding.json
# - Setup Slack/Gmail credentials
# - Configure webhook URLs
```

## 🔄 Data Synchronization

### Field Mapping (Cactus ↔ Twenty)

| Cactus Field | Twenty Field | Notes |
|--------------|--------------|-------|
| `first_name` | `firstName` | Direct mapping |
| `last_name` | `lastName` | Direct mapping |
| `email` | `email` | Unique identifier |
| `status` | `stage` | Pipeline mapping |
| `risk_profile` | `customFields.riskProfile` | Custom field |
| `lead_source` | `customFields.leadSource` | Custom field |
| `notes` | `customFields.notes` | Custom field |

### Status Mapping

| Cactus Status | Twenty Stage | Description |
|---------------|--------------|-------------|
| `prospect` | `LEAD` | Initial contact |
| `contacted` | `QUALIFIED` | Qualified lead |
| `onboarding` | `PROPOSAL` | Proposal sent |
| `active_investor` | `WON` | Active customer |
| `active_insured` | `WON` | Active customer |
| `dormant` | `LOST` | Inactive |

## 🛠️ Development Commands

```bash
# Start all services
./start.sh start

# Check service status
./start.sh status

# View logs with enhanced highlighting
./start.sh logs

# Test API health
./start.sh api-test

# Test SyncBridge
./start.sh sync-test

# Twenty CRM setup guide
./start.sh twenty-setup

# Stop services
./start.sh stop

# Clean environment
./start.sh clean
```

## 🔍 Monitoring & Testing

### Health Checks
```bash
# Cactus API
curl http://localhost:8000/health

# SyncBridge
curl http://localhost:8001/health

# Sync Statistics
curl http://localhost:8001/sync-stats

# Field Mappings
curl http://localhost:8001/mappings
```

### Integration Testing
1. Create a client in Cactus CRM
2. Verify it appears in Twenty CRM
3. Update status to "active_investor" 
4. Check n8n workflow execution
5. Verify Slack/email notifications

## 🧩 Extension Points

### Adding New Workflows
```json
// n8n webhook trigger
{
  "event": "client.status_changed",
  "from": "prospect", 
  "to": "active_investor",
  "client": { ... }
}
```

### Custom Field Sync
```python
# sync-bridge/main.py
CUSTOM_FIELD_MAP = {
    "portfolio_value": "customFields.portfolioValue",
    "investment_goal": "customFields.investmentGoal"
}
```

### External Integrations
- **Zapier**: Connect via Twenty CRM webhooks
- **Make.com**: Use Twenty API endpoints
- **HubSpot**: Sync via SyncBridge extension
- **Salesforce**: Custom connector development

## 📚 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: FastAPI, SQLModel, PostgreSQL
- **CRM**: Twenty CRM (open-source)
- **Sync**: Custom FastAPI microservice
- **Automation**: n8n (self-hosted)
- **Cache**: Redis
- **Infrastructure**: Docker Compose

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Test the integration flow
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**🌵 Growing Your Financial Future with Integrated CRM Excellence** 

## 🚀 Deploy nativo en Replit

1. Crea los secrets requeridos en Replit: `DB_URL`, `JWT_SECRET`, `N8N_WEBHOOK`.
2. Ejecuta:
   ```bash
   ./scripts/cactus.sh setup
   ./scripts/cactus.sh test
   ./scripts/cactus.sh deploy
   ./scripts/cactus.sh report
   ```
3. El deploy aborta si falta algún secret crítico.
4. El log de deploy se encuentra en `deploy-log.txt`.
5. El webhook `${N8N_WEBHOOK}` recibe el status, git sha y CUs usados tras cada deploy. 

## Configuración de entorno

1. Copia el archivo `.env.example` a `.env` en la raíz del proyecto:
   
   ```bash
   cp .env.example .env
   ```

2. Completa los valores reales para cada secreto:
   - `DB_URL`: [Formato de conexión PostgreSQL](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
   - `JWT_SECRET`: [¿Qué es JWT?](https://jwt.io/introduction)
   - `N8N_WEBHOOK`: [Webhooks en n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

3. El script `cactus.sh` cargará automáticamente las variables de `.env` si existe. 