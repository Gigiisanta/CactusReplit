# CactusDashboard Project Brief

## Core Mission
Financial wealth management platform reducing administrative burden for financial advisors.

## Domain Entities
- **User/Advisor**: ADMIN, SENIOR_ADVISOR, JUNIOR_ADVISOR, COMPLIANCE roles
- **Client**: End customers managed by advisors  
- **Portfolio**: Investment containers with assets/positions
- **Asset**: Individual investments (stocks, bonds, funds)
- **PortfolioSnapshot**: Historical performance data

## Key Business Rules
- RBAC-based data isolation (users see only authorized data)
- Real-time portfolio tracking and performance monitoring
- Automated compliance reporting and audit trails
- Multi-tenant architecture with advisor-client relationships

## Primary Workflows
1. Client onboarding and KYC
2. Portfolio creation and asset allocation
3. Performance monitoring and reporting
4. Rebalancing and trade execution
5. Compliance monitoring and alerts

## Success Metrics
- Reduced advisor administrative time by 40%
- Real-time data accuracy >99.9%
- Sub-200ms API response times
- Zero security incidents
- 95%+ advisor satisfaction scores 