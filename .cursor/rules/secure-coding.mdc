# 🔐 Secure Coding

## Purpose
Implement OWASP Top-10 security practices for financial data protection.

## Scope
Authentication, authorization, data validation, API security.

## Guidelines

### 🛡️ Input Validation
```python
# ✅ Always validate and sanitize
from pydantic import validator, Field

class ClientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., regex=r'^\+?1?\d{9,15}$')
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
```

### 🔑 Authentication & Authorization
```python
# ✅ Always verify user permissions
@router.get("/clients/{client_id}")
async def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user)
):
    # Verify user can access this client
    if not can_access_client(current_user, client_id):
        raise HTTPException(status_code=403, detail="Access denied")
```

### 💉 SQL Injection Prevention
```python
# ✅ Always use parameterized queries
async def get_clients_by_advisor(advisor_id: int):
    return await db.execute(
        select(Client).where(Client.advisor_id == advisor_id)
    )

# ❌ Never concatenate SQL strings
# query = f"SELECT * FROM clients WHERE advisor_id = {advisor_id}"
```

### 🔒 Sensitive Data Handling
```python
# ✅ Never log sensitive data
logger.info(f"Processing transaction for client {client.id}")  # ✅ ID only
logger.info(f"Client {client.name} updated")  # ❌ PII in logs

# ✅ Environment variables for secrets
DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET_KEY")
```

### 🌐 CORS & Headers
```python
# ✅ Secure headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.cactuswealth.com"],  # Specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## Anti-patterns
- ❌ SQL string concatenation
- ❌ Logging sensitive data
- ❌ Hardcoded secrets
- ❌ Missing authorization checks
- ❌ Trusting client input

## Examples

```python
# ✅ Secure password handling
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

```tsx
// ✅ Secure frontend practices
const ClientForm: React.FC = () => {
  const [formData, setFormData] = useState({});
  
  // Validate on client, but never trust client validation alone
  const handleSubmit = async (data: ClientFormData) => {
    try {
      // Server will re-validate all data
      await clientService.createClient(data);
    } catch (error) {
      // Never expose internal error details
      setError("Unable to create client. Please try again.");
    }
  };
};
```
description:
globs:
alwaysApply: false
---
