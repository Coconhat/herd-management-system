# Testing Guide - Milking CRUD Functionality

## 🧪 Manual Testing Checklist

### ✅ **CREATE** - Add New Record

1. [ ] Navigate to `/record/milking`
2. [ ] Click "Add Milking Record" button
3. [ ] Search for an animal in the dropdown
4. [ ] Select an animal
5. [ ] Pick today's date
6. [ ] Enter milk yield (e.g., 25.5)
7. [ ] Optionally add fat %, protein %, SCC
8. [ ] Add notes
9. [ ] Click "Add Record"
10. [ ] Verify success toast appears
11. [ ] Verify record appears in the table
12. [ ] Verify record shows correct data

**Expected Result**: Record is created and visible in the list

---

### ✅ **READ** - View Records

#### Desktop View

1. [ ] Navigate to `/record/milking`
2. [ ] Verify table displays all records
3. [ ] Check columns: Animal, Date, Milk Yield, Notes
4. [ ] Verify sorting works
5. [ ] Verify empty state if no records

#### Mobile View

1. [ ] Open on mobile device or resize browser
2. [ ] Verify cards display correctly
3. [ ] Check all information is visible
4. [ ] Verify dropdown menu works
5. [ ] Test scrolling

#### Excel View

1. [ ] Switch to "Excel View" tab
2. [ ] Verify weekly grid displays
3. [ ] Check daily totals
4. [ ] Test week navigation (Previous/Next)
5. [ ] Verify totals calculation

**Expected Result**: All records visible in appropriate format

---

### ✅ **UPDATE** - Edit Existing Record (NEW!)

#### Test 1: Edit All Fields

1. [ ] Find any record in the table
2. [ ] Click ⋮ (three dots) menu
3. [ ] Select "Edit"
4. [ ] Verify modal opens
5. [ ] Verify animal name is displayed
6. [ ] Verify all fields are pre-filled with current data
7. [ ] Change milk yield (e.g., 25.5 → 26.0)
8. [ ] Change fat percentage (e.g., 3.5 → 3.7)
9. [ ] Change protein percentage (e.g., 3.2 → 3.3)
10. [ ] Change somatic cell count (e.g., 200000 → 180000)
11. [ ] Update notes
12. [ ] Click "Update Record"
13. [ ] Verify success toast appears
14. [ ] Verify table updates with new values
15. [ ] Refresh page and verify changes persisted

**Expected Result**: Record is updated with new values

#### Test 2: Edit Partial Fields

1. [ ] Click edit on another record
2. [ ] Only change the date
3. [ ] Leave other fields as-is
4. [ ] Click "Update Record"
5. [ ] Verify only date changed

**Expected Result**: Only modified fields are updated

#### Test 3: Cancel Edit

1. [ ] Click edit on a record
2. [ ] Make some changes
3. [ ] Click "Cancel" button
4. [ ] Verify modal closes
5. [ ] Verify no changes were saved
6. [ ] Verify record remains unchanged

**Expected Result**: Changes are discarded

#### Test 4: Edit Validation

1. [ ] Click edit on a record
2. [ ] Clear the milk yield field (make it empty)
3. [ ] Try to submit
4. [ ] Verify validation error appears
5. [ ] Verify form doesn't submit
6. [ ] Enter valid milk yield
7. [ ] Verify error clears
8. [ ] Submit successfully

**Expected Result**: Validation prevents invalid data

#### Test 5: Edit Date Picker

1. [ ] Click edit on a record
2. [ ] Click on the date field
3. [ ] Verify calendar opens
4. [ ] Try to select future date
5. [ ] Verify it's disabled
6. [ ] Select valid date
7. [ ] Verify it updates
8. [ ] Submit successfully

**Expected Result**: Date validation works correctly

#### Test 6: Edit on Mobile

1. [ ] Open on mobile device
2. [ ] Find a record card
3. [ ] Tap ⋮ menu
4. [ ] Tap "Edit"
5. [ ] Verify modal is scrollable
6. [ ] Make changes
7. [ ] Tap "Update Record"
8. [ ] Verify success

**Expected Result**: Edit works on mobile devices

#### Test 7: Edit Multiple Records

1. [ ] Edit record #1, change milk yield to 25.0
2. [ ] Submit and verify
3. [ ] Edit record #2, change milk yield to 26.0
4. [ ] Submit and verify
5. [ ] Edit record #3, change milk yield to 24.5
6. [ ] Submit and verify
7. [ ] Verify all records show correct values

**Expected Result**: Multiple edits work consecutively

---

### ✅ **DELETE** - Remove Record

#### Test 1: Delete Single Record

1. [ ] Note the record count
2. [ ] Click ⋮ on any record
3. [ ] Select "Delete" (red text)
4. [ ] Verify button shows "Deleting..."
5. [ ] Verify success toast appears
6. [ ] Verify record is removed from list
7. [ ] Verify record count decreased by 1
8. [ ] Refresh page
9. [ ] Verify record is still deleted (not just hidden)

**Expected Result**: Record is permanently deleted

#### Test 2: Delete Multiple Records

1. [ ] Delete record #1
2. [ ] Delete record #2
3. [ ] Delete record #3
4. [ ] Verify all are removed
5. [ ] Verify toasts appear for each

**Expected Result**: Multiple deletes work

#### Test 3: Delete on Mobile

1. [ ] Open on mobile
2. [ ] Tap ⋮ on a card
3. [ ] Tap "Delete"
4. [ ] Verify it deletes

**Expected Result**: Delete works on mobile

---

## 🔍 Edge Cases Testing

### Empty States

- [ ] Delete all records
- [ ] Verify "No milking records found" message
- [ ] Add new record
- [ ] Verify it appears

### Large Numbers

- [ ] Enter milk yield: 999.9 liters
- [ ] Enter SCC: 999999999
- [ ] Verify they save and display correctly

### Decimal Precision

- [ ] Enter milk yield: 25.12345
- [ ] Verify it displays as 25.1 (rounded)
- [ ] Edit and change to 25.67890
- [ ] Verify it displays as 25.7

### Special Characters in Notes

- [ ] Enter notes with special chars: `Test "quotes" & symbols <>`
- [ ] Verify they save correctly
- [ ] Edit and verify they display correctly
- [ ] Verify no XSS vulnerabilities

### Date Edge Cases

- [ ] Try editing date to Jan 1, 1900 (should work)
- [ ] Try editing date to Dec 31, 2099 (should work)
- [ ] Try editing date to future (should be disabled)

### Concurrent Editing

- [ ] Open edit modal for record A
- [ ] In another browser tab, delete record A
- [ ] Try to submit edit in first tab
- [ ] Verify error handling

---

## 🎯 Performance Testing

### Load Testing

- [ ] Create 100+ records
- [ ] Verify table loads smoothly
- [ ] Test edit on various records
- [ ] Test delete on various records
- [ ] Verify no lag or freezing

### Network Testing

- [ ] Slow 3G connection
- [ ] Test edit with slow network
- [ ] Verify loading states work
- [ ] Verify timeout handling

---

## 🔒 Security Testing

### Authentication

- [ ] Log out
- [ ] Try to access `/record/milking`
- [ ] Verify redirect to login
- [ ] Log back in
- [ ] Verify can access page

### Authorization

- [ ] Create record with User A
- [ ] Log out, log in as User B
- [ ] Verify User B cannot edit User A's record
- [ ] Verify User B cannot delete User A's record

### Data Validation

- [ ] Try SQL injection in notes: `'; DROP TABLE milking_records; --`
- [ ] Verify it's saved as plain text
- [ ] Try XSS in notes: `<script>alert('xss')</script>`
- [ ] Verify it's escaped and not executed

---

## 📊 Data Integrity Testing

### Before Edit

1. [ ] Note original values:
   - Milk yield: **\_\_\_**
   - Fat %: **\_\_\_**
   - Protein %: **\_\_\_**
   - SCC: **\_\_\_**
   - Notes: **\_\_\_**

### After Edit

1. [ ] Verify values changed to:
   - Milk yield: **\_\_\_**
   - Fat %: **\_\_\_**
   - Protein %: **\_\_\_**
   - SCC: **\_\_\_**
   - Notes: **\_\_\_**

### Database Check (if possible)

1. [ ] Check database directly
2. [ ] Verify record ID is same
3. [ ] Verify user_id is unchanged
4. [ ] Verify created_at is unchanged
5. [ ] Verify updated fields match

---

## 🐛 Bug Reporting Template

If you find issues, report using this format:

```
**Bug Title**: [Brief description]

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Browser**: Chrome/Firefox/Safari/Edge [version]
**Device**: Desktop/Mobile/Tablet
**Screen Size**: [e.g., 1920x1080]
**OS**: Windows/Mac/Linux/iOS/Android

**Screenshots**: [if applicable]

**Console Errors**: [paste any errors from browser console]
```

---

## ✅ Sign-Off Checklist

### Functionality

- [ ] Create works
- [ ] Read works
- [ ] **Update works** ✨ NEW!
- [ ] Delete works
- [ ] All validations work
- [ ] All error handling works

### UI/UX

- [ ] Desktop layout correct
- [ ] Mobile layout correct
- [ ] Tablet layout correct
- [ ] Modal is responsive
- [ ] Buttons are accessible
- [ ] Form is intuitive

### Performance

- [ ] Page loads quickly
- [ ] No lag when editing
- [ ] Smooth animations
- [ ] Efficient re-rendering

### Code Quality

- [ ] No TypeScript errors
- [ ] No console errors
- [ ] No warnings
- [ ] Code is readable
- [ ] Components are reusable

### Documentation

- [ ] Implementation doc created ✅
- [ ] Summary doc created ✅
- [ ] Testing guide created ✅
- [ ] Code comments added
- [ ] README updated (if needed)

---

## 🎉 Testing Complete!

If all tests pass:

- ✅ CRUD functionality is working
- ✅ No bugs found
- ✅ Ready for production
- ✅ Ready to show the user!

**Tested by**: ********\_********
**Date**: ********\_********
**Status**: PASS / FAIL
**Notes**: ********\_********
