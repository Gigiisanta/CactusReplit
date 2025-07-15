# 🎨 UI/UX Patterns

## Purpose
Consistent, professional fintech interface design.

## Scope
Component styling, color usage, financial data presentation.

## Guidelines

### 🎨 Brand Colors
```css
--primary-green: #2E5339;    /* CTAs, headers */
--sage-green: #587B7F;       /* Secondary elements */
--cactus-bloom: #D4AC0D;     /* Success, positive metrics */
--desert-sand: #F5F0E1;      /* Backgrounds, cards */
--charcoal: #343a40;         /* Primary text */
```

### 💰 Financial Data
```tsx
// ✅ Currency formatting
const formatCurrency = (value: number) => 
  value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2 
  });

// ✅ Performance indicators
<div className={`${isPositive ? 'text-cactus-bloom' : 'text-red-500'}`}>
  {isPositive ? '↗' : '↘'} {changePercent}%
</div>
```

### 📊 Card Structure
```tsx
<Card className="bg-desert-sand border-sage-green">
  <CardHeader>
    <h3 className="text-charcoal font-semibold">Title</h3>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-primary-green">
      {formatCurrency(value)}
    </div>
  </CardContent>
</Card>
```

### ⚡ Loading States
- Use `<Skeleton />` for content loading
- Loading buttons: `disabled` + spinner
- Progressive disclosure for complex forms

## Anti-patterns
- ❌ Raw numbers without formatting
- ❌ Colors outside brand palette
- ❌ Missing loading states
- ❌ Inconsistent card layouts

## Examples

```tsx
// ✅ Portfolio metric display
const PortfolioCard: React.FC<{ portfolio: Portfolio }> = ({ portfolio }) => (
  <Card className="bg-desert-sand">
    <CardContent className="p-6">
      <h3 className="font-semibold text-charcoal mb-2">{portfolio.name}</h3>
      <div className="text-2xl font-bold text-primary-green">
        {formatCurrency(portfolio.totalValue)}
      </div>
      <div className={`text-sm ${portfolio.changePercent >= 0 ? 'text-cactus-bloom' : 'text-red-500'}`}>
        {portfolio.changePercent >= 0 ? '↗' : '↘'} {Math.abs(portfolio.changePercent)}%
      </div>
    </CardContent>
  </Card>
);
```

4. **Body**: Regular content and descriptions
5. **Caption**: Data sources, timestamps, disclaimers
