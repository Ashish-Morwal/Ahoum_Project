# Deployment Checklist - CORS Fix

## Pre-Deployment Verification

### Code Changes Verification
- [x] Backend: settings.py updated with enhanced CORS configuration
- [x] Backend: authentication/views.py - SignupView restricted to POST/OPTIONS only
- [x] Frontend: api/axios.js - withCredentials added
- [x] All changes committed to git
- [x] Changes pushed to GitHub

### Local Testing (Optional but Recommended)
- [ ] Backend runs without errors: `python manage.py check`
- [ ] Backend migrations applied: `python manage.py migrate`
- [ ] Frontend builds successfully: `npm run build`
- [ ] Test signup flow locally
- [ ] Verify OPTIONS request works
- [ ] Verify POST request works
- [ ] Verify GET request returns 405

## Deployment Steps

### 1. Backend Deployment (Render)

**Before Deployment:**
- [ ] Verify environment variables in Render dashboard:
  - [ ] `DEBUG=False`
  - [ ] `SECRET_KEY` is set
  - [ ] `ALLOWED_HOSTS` includes backend domain
  - [ ] `DATABASE_URL` is set
  - [ ] `EMAIL_HOST_USER` is set
  - [ ] `EMAIL_HOST_PASSWORD` is set

**Deployment:**
- [ ] Navigate to Render dashboard
- [ ] Select backend service: `backend-django-cnyh`
- [ ] Trigger manual deploy OR wait for auto-deploy
- [ ] Monitor deployment logs

**After Deployment:**
- [ ] Check deployment status: Should show "Live"
- [ ] Check logs for errors
- [ ] Test health endpoint: `curl https://backend-django-cnyh.onrender.com/api/auth/signup/ -X OPTIONS -v`
- [ ] Verify CORS headers in response

### 2. Frontend Deployment (Render)

**Before Deployment:**
- [ ] Verify environment variables in Render dashboard:
  - [ ] `VITE_API_BASE_URL=https://backend-django-cnyh.onrender.com`

**Deployment:**
- [ ] Navigate to Render dashboard
- [ ] Select frontend service: `frontend-mbf2`
- [ ] Trigger manual deploy OR wait for auto-deploy
- [ ] Monitor deployment logs
- [ ] Wait for build to complete

**After Deployment:**
- [ ] Check deployment status: Should show "Live"
- [ ] Check logs for build errors
- [ ] Test frontend loads: Open https://frontend-mbf2.onrender.com

## Post-Deployment Testing

### 3. Production Testing

**Browser Testing:**
- [ ] Open frontend: https://frontend-mbf2.onrender.com
- [ ] Navigate to signup page
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Fill signup form:
  - Email: test@example.com
  - Password: TestPassword123!
  - Role: seeker
- [ ] Click "Sign Up"
- [ ] Verify in Network tab:
  - [ ] OPTIONS request to /api/auth/signup/ (Status: 200)
  - [ ] POST request to /api/auth/signup/ (Status: 201 or 400)
  - [ ] No CORS errors in console
  - [ ] Response includes CORS headers

**Expected Responses:**

OPTIONS Request Headers:
```
Access-Control-Allow-Origin: https://frontend-mbf2.onrender.com
Access-Control-Allow-Methods: POST, OPTIONS, GET, DELETE, PATCH, PUT
Access-Control-Allow-Headers: accept, accept-encoding, authorization, content-type, ...
Access-Control-Allow-Credentials: true
```

POST Request Headers:
```
Access-Control-Allow-Origin: https://frontend-mbf2.onrender.com
Access-Control-Allow-Credentials: true
Content-Type: application/json
```

POST Request Response (Success):
```json
{
  "message": "Signup successful. Please check your email for OTP verification.",
  "email": "test@example.com",
  "role": "seeker"
}
```

### 4. Error Testing

**Test GET Request (Should Fail):**
```bash
curl https://backend-django-cnyh.onrender.com/api/auth/signup/ -X GET -v
```
Expected: 405 Method Not Allowed

**Test Without Origin (Should Work):**
```bash
curl https://backend-django-cnyh.onrender.com/api/auth/signup/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","role":"seeker"}' \
  -v
```
Expected: 201 Created or 400 Bad Request (validation)

**Test With Wrong Origin (Should Fail):**
```bash
curl https://backend-django-cnyh.onrender.com/api/auth/signup/ \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://malicious-site.com" \
  -d '{"email":"test@example.com","password":"Test123!","role":"seeker"}' \
  -v
```
Expected: Request goes through but response has no CORS headers

## Troubleshooting

### Issue: CORS Error Still Appears
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Check Render logs for both services
- [ ] Verify environment variables are correct
- [ ] Ensure both services redeployed successfully
- [ ] Wait 2-3 minutes after deployment (caching)

### Issue: 500 Internal Server Error
- [ ] Check Render backend logs
- [ ] Verify DATABASE_URL is correct
- [ ] Run migrations: `python manage.py migrate` (via Render shell)
- [ ] Check DEBUG=False doesn't hide errors

### Issue: Frontend Shows Old Code
- [ ] Check Render frontend logs
- [ ] Verify build completed successfully
- [ ] Clear browser cache
- [ ] Try incognito/private browsing mode
- [ ] Verify git push was successful

### Issue: Email OTP Not Sending
- [ ] Verify EMAIL_HOST_USER is set
- [ ] Verify EMAIL_HOST_PASSWORD is set
- [ ] Check backend logs for email errors
- [ ] This is separate from CORS issue

## Success Criteria

✅ All checks passed when:
- [ ] Frontend loads without errors
- [ ] Signup form submits successfully
- [ ] Browser console shows no CORS errors
- [ ] OPTIONS request returns 200 with CORS headers
- [ ] POST request returns 201 Created
- [ ] GET request returns 405 Method Not Allowed
- [ ] Success message appears
- [ ] Redirected to OTP verification page
- [ ] No 500 errors in backend logs
- [ ] No build errors in frontend logs

## Rollback Plan (If Needed)

If deployment fails:
1. [ ] In Render dashboard, rollback to previous version
2. [ ] Or revert git commits:
   ```bash
   git revert HEAD
   git push
   ```
3. [ ] Wait for auto-deploy or trigger manual deploy
4. [ ] Review error logs to understand issue

## Sign-off

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Production testing completed
- [ ] All success criteria met
- [ ] Documentation updated
- [ ] Team notified of deployment

**Deployed by:** _________________  
**Date:** _________________  
**Time:** _________________  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
