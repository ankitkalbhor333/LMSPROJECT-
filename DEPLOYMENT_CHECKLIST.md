# Initial Enquiry Feature - Deployment Checklist

## Files Modified

### Backend
- [x] `server/models/User.js` - Added enquiry fields
- [x] `server/controllers/enquiryController.js` - Added 2 new functions
- [x] `server/controllers/courseController.js` - Added getCoursesList function
- [x] `server/routes/enquiryRoutes.js` - Added new routes
- [x] `server/routes/courseRoutes.js` - Added new route

### Frontend
- [x] `client/src/pages/InitialEnquiry.jsx` - NEW component
- [x] `client/src/pages/InitialEnquiry.css` - NEW styles
- [x] `client/src/components/InitialEnquiryGuard.jsx` - NEW guard component
- [x] `client/src/App.jsx` - Added route import and route definition
- [x] `client/src/pages/auth/Login.jsx` - Updated with enquiry check logic

---

## Steps to Deploy

### 1. Backend Deployment
```bash
# Push changes to GitHub
git add server/
git commit -m "feat: add initial enquiry form for new users"
git push origin main

# If using MongoDB Atlas, no data migration needed
# The new fields will be created on first user update
```

### 2. Frontend Deployment
```bash
# Build and deploy
npm run build
# Deploy build folder to your hosting (Vercel, Netlify, etc.)
```

### 3. Environment Variables Check
Ensure these are set in both frontend and backend:
- `VITE_API_URL` - Frontend API base URL
- Backend should be running and accessible

### 4. Manual Testing Steps
1. **Register a new account:**
   - Go to /register
   - Fill email, name, password
   - Verify email via link
   
2. **Login with new account:**
   - Go to /login
   - Enter email and password
   - Should be redirected to /initial-enquiry
   
3. **Complete enquiry form:**
   - Select a course from dropdown
   - Enter message (10+ characters)
   - Click submit
   - See success message
   - Auto-redirect to home
   
4. **Login again:**
   - Logout
   - Login with same account
   - Should go to /mybatches (NOT enquiry form)
   - Confirms form only appears once

### 5. Verification
- [ ] Courses dropdown loads correctly
- [ ] Message character counter works
- [ ] Form validation prevents submission with errors
- [ ] Success screen appears after submission
- [ ] Auto-redirect works (2 second delay)
- [ ] Form doesn't appear on second login
- [ ] Mobile responsive (test on phone browser)
- [ ] All toasts/error messages appear
- [ ] Network requests are visible in DevTools

---

## Rollback Plan (if needed)

If issues arise, you can:

1. **Quick fix - Bypass enquiry check:**
   - Comment out the enquiry check in Login.jsx
   - Users will go to dashboard instead of form

2. **Complete rollback:**
   - Revert commits for these 5 files
   - Redeploy backend and frontend
   - Database changes are backwards compatible

---

## Monitoring

After deployment, monitor:
1. Login success rate
2. Initial enquiry submissions
3. Error logs for failed API calls
4. User feedback on form UX

---

## Important Notes

⚠️ **Do NOT skip this after deployment:**
- Test with a fresh account completely
- Verify course dropdown populates correctly
- Test on mobile device

✅ **Backend must be running for frontend to work:**
- All API calls are to your backend
- If backend is down, users can't submit form
- Have fallback plan (maybe skip form on API error)

---

## Documentation
Full implementation details available in: `INITIAL_ENQUIRY_IMPLEMENTATION.md`
