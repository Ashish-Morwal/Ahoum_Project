# CORS Configuration Fix - Complete Guide

## Problem Summary
The Django REST Framework backend deployed on Render was experiencing CORS (Cross-Origin Resource Sharing) errors when the React frontend tried to make POST requests to the `/api/auth/signup/` endpoint. The browser was blocking requests due to missing or incorrect CORS headers.

## Root Causes
1. **CORS Configuration**: While django-cors-headers was installed and configured, the configuration needed to be more explicit for production deployment
2. **Missing withCredentials**: The Axios client wasn't configured to send credentials with CORS requests
3. **Implicit HTTP Methods**: The SignupView didn't explicitly define allowed HTTP methods
4. **CSRF Configuration**: Backend domain wasn't in CSRF_TRUSTED_ORIGINS

## Solutions Implemented

### 1. Backend - Enhanced CORS Configuration (`backend/config/settings.py`)

#### Changes Made:
```python
# CORS CONFIGURATION
# Properly configured for production deployment on Render

CORS_ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    # Production frontend on Render
    "https://frontend-mbf2.onrender.com",
]

# Allow credentials (cookies, authorization headers, etc.)
CORS_ALLOW_CREDENTIALS = True

# Explicitly allow necessary headers for CORS requests
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Explicitly allow HTTP methods (OPTIONS required for preflight)
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",  # Required for CORS preflight requests
    "PATCH",
    "POST",
    "PUT",
]

# CSRF trusted origins for production
CSRF_TRUSTED_ORIGINS = [
    "https://frontend-mbf2.onrender.com",
    "https://backend-django-cnyh.onrender.com",
]
```

#### Why These Changes?
- **CORS_ALLOWED_ORIGINS**: Explicitly lists all domains that can make cross-origin requests
- **CORS_ALLOW_CREDENTIALS**: Allows sending cookies and authorization headers
- **CORS_ALLOW_HEADERS**: Lists all headers that the browser can include in requests
- **CORS_ALLOW_METHODS**: Includes OPTIONS for CORS preflight requests
- **CSRF_TRUSTED_ORIGINS**: Added backend domain to prevent CSRF validation issues

### 2. Backend - Explicit HTTP Method Restriction (`backend/authentication/views.py`)

#### Changes Made:
```python
class SignupView(APIView):
    permission_classes = [AllowAny]
    http_method_names = ['post', 'options']  # Explicitly allow only POST and OPTIONS

    def post(self, request):
        # ... existing logic
```

#### Why This Change?
- **http_method_names**: Explicitly restricts the view to POST and OPTIONS only
- **POST**: For user signup submissions
- **OPTIONS**: Required for CORS preflight requests
- **Result**: GET requests now return 405 Method Not Allowed (as required)

### 3. Frontend - Axios Configuration with Credentials (`frontend/src/api/axios.js`)

#### Changes Made:
```javascript
// Axios instance with CORS support
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for CORS with credentials
});
```

#### Why This Change?
- **withCredentials: true**: Tells Axios to include credentials in CORS requests
- **Required When**: CORS_ALLOW_CREDENTIALS is True on the backend
- **Effect**: Browser includes cookies and authorization headers in cross-origin requests

## How CORS Works (Technical Explanation)

### Preflight Request (OPTIONS)
When your browser makes a cross-origin POST request with custom headers:
1. Browser first sends an OPTIONS request (preflight) to check if the actual request is allowed
2. Server responds with CORS headers indicating what's allowed
3. If allowed, browser sends the actual POST request
4. Server responds with data and CORS headers

### Required Headers Flow:
```
Client Request (OPTIONS):
  - Origin: https://frontend-mbf2.onrender.com
  - Access-Control-Request-Method: POST
  - Access-Control-Request-Headers: content-type, authorization

Server Response (OPTIONS):
  - Access-Control-Allow-Origin: https://frontend-mbf2.onrender.com
  - Access-Control-Allow-Methods: POST, OPTIONS
  - Access-Control-Allow-Headers: content-type, authorization
  - Access-Control-Allow-Credentials: true

Client Request (POST):
  - Origin: https://frontend-mbf2.onrender.com
  - Content-Type: application/json
  - Body: { email, password, role }

Server Response (POST):
  - Access-Control-Allow-Origin: https://frontend-mbf2.onrender.com
  - Access-Control-Allow-Credentials: true
  - Content-Type: application/json
  - Body: { message, email, role }
```

## Verification Checklist

### Backend Verification:
- [x] django-cors-headers installed (requirement.txt includes django-cors-headers==4.3.1)
- [x] 'corsheaders' in INSTALLED_APPS
- [x] 'corsheaders.middleware.CorsMiddleware' in MIDDLEWARE (positioned correctly)
- [x] CORS_ALLOWED_ORIGINS includes frontend domain
- [x] CORS_ALLOW_CREDENTIALS = True
- [x] CORS_ALLOW_METHODS includes OPTIONS, POST
- [x] CSRF_TRUSTED_ORIGINS includes both frontend and backend domains
- [x] SignupView has http_method_names = ['post', 'options']
- [x] SignupView only implements post() method (no get() method)

### Frontend Verification:
- [x] Axios instance has withCredentials: true
- [x] Content-Type header set to application/json
- [x] POST request to /api/auth/signup/
- [x] Request body is JSON formatted

### Django Configuration Check:
```bash
cd backend
python manage.py check
# Should show: System check identified no issues (0 silenced).
```

## Testing Locally

### 1. Start Backend:
```bash
cd backend
python manage.py runserver
```

### 2. Start Frontend:
```bash
cd frontend
npm run dev
```

### 3. Test Signup:
1. Open browser to http://localhost:5173
2. Navigate to signup page
3. Fill in email, password, and role
4. Submit form
5. Check browser console - should not see CORS errors
6. Should receive success message and redirect to OTP verification

### 4. Verify OPTIONS Request:
```bash
curl -X OPTIONS http://localhost:8000/api/auth/signup/ \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

Expected response should include:
- `Access-Control-Allow-Origin: http://localhost:5173`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Credentials: true`

## Deployment Requirements

### ⚠️ CRITICAL: Both Services Must Be Redeployed

#### Backend Redeployment (Render):
1. **Why**: Settings.py changes need to be deployed
2. **What Changed**: CORS configuration, CSRF_TRUSTED_ORIGINS
3. **How**: 
   - Push changes to GitHub
   - Render will auto-deploy if connected to GitHub
   - Or manually trigger redeploy in Render dashboard
4. **Verify**: Check Render logs for successful deployment

#### Frontend Redeployment (Render):
1. **Why**: Axios configuration changes need to be deployed
2. **What Changed**: withCredentials: true added
3. **How**:
   - Push changes to GitHub
   - Render will auto-deploy if connected to GitHub
   - Or manually trigger redeploy in Render dashboard
4. **Verify**: Check Render logs for successful build and deployment

### Environment Variables Check:
Ensure these are set on Render:

**Backend**:
- `DEBUG=False`
- `SECRET_KEY=<your-secret-key>`
- `ALLOWED_HOSTS=backend-django-cnyh.onrender.com,localhost,127.0.0.1`
- `DATABASE_URL=<your-database-url>`
- `EMAIL_HOST_USER=<your-email>`
- `EMAIL_HOST_PASSWORD=<your-email-password>`

**Frontend**:
- `VITE_API_BASE_URL=https://backend-django-cnyh.onrender.com`

## Common Issues and Solutions

### Issue 1: Still Getting CORS Errors After Deployment
**Solution**: 
- Clear browser cache
- Check Render deployment logs
- Verify environment variables are set correctly
- Check that both services redeployed successfully

### Issue 2: GET Request Returns 405
**Expected Behavior**: This is correct! SignupView only allows POST.
- POST: ✅ 201 Created (success) or 400 Bad Request (validation error)
- GET: ❌ 405 Method Not Allowed
- OPTIONS: ✅ 200 OK (for CORS preflight)

### Issue 3: Credentials Not Being Sent
**Solution**:
- Verify withCredentials: true in axios.js
- Verify CORS_ALLOW_CREDENTIALS = True in settings.py
- Both must be set for credentials to work

### Issue 4: CSRF Verification Failed
**Solution**:
- Ensure CSRF_TRUSTED_ORIGINS includes both domains
- For API-only endpoints with JWT, CSRF isn't needed
- Our setup uses JWT, so CSRF is handled at the middleware level

## Best Practices Followed

1. **Security**:
   - ✅ Explicit origin whitelist (no CORS_ORIGIN_ALLOW_ALL)
   - ✅ Credentials only from trusted origins
   - ✅ CSRF protection enabled
   - ✅ Only necessary HTTP methods allowed

2. **Django REST Framework**:
   - ✅ Used APIView with explicit http_method_names
   - ✅ AllowAny permission for public endpoint
   - ✅ No existing auth logic modified

3. **Frontend**:
   - ✅ Single axios instance with consistent configuration
   - ✅ Proper error handling maintained
   - ✅ Existing interceptor logic preserved

## References

- [Django CORS Headers Documentation](https://github.com/adamchainz/django-cors-headers)
- [Django CSRF Protection](https://docs.djangoproject.com/en/4.2/ref/csrf/)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Axios Configuration](https://axios-http.com/docs/req_config)

## Support

If you encounter issues:
1. Check browser console for specific error messages
2. Check Render logs for both frontend and backend
3. Verify all environment variables are set
4. Ensure both services have been redeployed
5. Test locally first to isolate deployment issues
