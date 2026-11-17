const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUTHENTICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // TEST 1: Register with invalid email (abc@abc)
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Invalid',
        email: 'abc@abc',
        password: 'password123',
        role: 'STUDENT',
        standard: 'Standard 8'
      })
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.error?.includes('valid email address'),
      'TEST 1: Register with invalid email (abc@abc) rejected with 400',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err) {
    assert(false, 'TEST 1: Register with invalid email', err.message);
  }

  // TEST 2: Register with valid email (e.g., student.verified.test@gmail.com)
  const testEmail = `student.verified.${Date.now()}@gmail.com`;
  let verificationToken = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smart Student',
        email: testEmail,
        password: 'Password@123',
        role: 'STUDENT',
        standard: 'Standard 8'
      })
    });
    const data = await res.json();
    assert(
      res.status === 201 && data.unverified === false && data.user?.emailVerified === true,
      'TEST 2: Register with valid email creates account directly verified without email verification required',
      `Status: ${res.status}, Message: ${data.message}`
    );

    // Retrieve the user from DB to check verified status in DB
    const userInDb = await prisma.user.findUnique({ where: { email: testEmail } });
    assert(
      userInDb && userInDb.emailVerified === true,
      'TEST 2 (DB Check): User account is created with emailVerified: true in DB'
    );
  } catch (err) {
    assert(false, 'TEST 2: Register with valid email', err.message);
  }

  // TEST 3: Register using an email that already exists
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: testEmail, // same normalized email
        password: 'AnotherPassword@123',
        role: 'STUDENT',
        standard: 'Standard 8'
      })
    });
    const data = await res.json();
    assert(
      res.status === 409 && data.error === 'An account with this email already exists. Please log in instead.',
      'TEST 3: Register using existing email shows "An account with this email already exists. Please log in instead."',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err) {
    assert(false, 'TEST 3: Duplicate signup rejection', err.message);
  }

  // TEST 4: Try the same existing email on LOGIN
  // Must NOT show "Email already exists"
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123'
      })
    });
    const data = await res.json();
    // It's unverified right now, so it should ask for verification, NOT "Email already exists"
    assert(
      data.error !== 'Email already exists' && !data.error?.includes('already exists'),
      'TEST 4: Existing email on LOGIN does NOT show "Email already exists"',
      `Error returned: ${data.error}`
    );
  } catch (err) {
    assert(false, 'TEST 4: Login existing email', err.message);
  }

  // TEST 5: Existing email + wrong password
  // Must show "Invalid email or password."
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!'
      })
    });
    const data = await res.json();
    assert(
      res.status === 401 && data.error === 'Invalid email or password',
      'TEST 5: Existing email + wrong password shows "Invalid email or password."',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err) {
    assert(false, 'TEST 5: Existing email + wrong password', err.message);
  }

  // TEST 6: Non-existing email + password
  // Must show "Invalid email or password."
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody.does.not.exist.at.all@gmail.com',
        password: 'Password@123'
      })
    });
    const data = await res.json();
    assert(
      res.status === 401 && data.error === 'Invalid email or password',
      'TEST 6: Non-existing email + password shows identical "Invalid email or password."',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err) {
    assert(false, 'TEST 6: Non-existing email + password', err.message);
  }

  // TEST 8: Correct email + correct password logs in immediately without email verification
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123'
      })
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.message === 'Login successful' && !!data.token,
      'TEST 8: Correct email + correct password logs in immediately with 200 OK and token (no email verification required)',
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert(false, 'TEST 8: Login attempt', err.message);
  }

  // TEST 9: Click verification email (Verify token)
  // Let's get the token or generate a known rawToken + hash for testEmail
  const crypto = require('crypto');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.user.update({
    where: { email: testEmail },
    data: {
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 3600 * 1000)
    }
  });

  try {
    const res = await fetch(`${BASE_URL}/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(testEmail)}`);
    const data = await res.json();
    assert(
      res.status === 200 && data.status === 'SUCCESS' && data.message === 'Email verified successfully.',
      'TEST 9: Visit verification link with valid token marks email as verified',
      `Status: ${res.status}, Data: ${JSON.stringify(data)}`
    );

    const updatedUser = await prisma.user.findUnique({ where: { email: testEmail } });
    assert(
      updatedUser && updatedUser.emailVerified === true && updatedUser.emailVerificationTokenHash === null,
      'TEST 9 (DB Check): User emailVerified is true, single-use token invalidated in DB'
    );
  } catch (err) {
    assert(false, 'TEST 9: Token verification', err.message);
  }

  // TEST 10: Try to reuse old verification link
  // Must NOT work (token was single-use and already cleared)
  try {
    const res = await fetch(`${BASE_URL}/auth/verify-email?token=${rawToken}`);
    const data = await res.json();
    assert(
      res.status === 400 && data.status === 'INVALID_OR_EXPIRED',
      'TEST 10: Reusing old verification link is rejected (single-use enforced)',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err) {
    assert(false, 'TEST 10: Token reuse check', err.message);
  }

  // TEST 7: Correct email + correct password + verified email
  // Must login successfully!
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123'
      })
    });
    const data = await res.json();
    assert(
      res.status === 200 && !!data.token && data.user?.email === testEmail,
      'TEST 7: Correct email + correct password + verified email logs in successfully with JWT token',
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert(false, 'TEST 7: Verified user login', err.message);
  }

  // TEST 11 & 12: Verify English and Gujarati locale files
  try {
    const enAuth = require('../../frontend/src/i18n/locales/en/auth.json');
    const guAuth = require('../../frontend/src/i18n/locales/gu/auth.json');

    const requiredKeys = [
      'invalidCredentials',
      'accountAlreadyExists',
      'pleaseVerifyEmail',
      'resendVerification',
      'emailVerifiedSuccess',
      'verificationLinkExpired',
      'accountCreatedCheckEmail',
      'confirmPassword',
      'forgotPassword',
      'goToLogin'
    ];

    let allEn = true;
    let allGu = true;
    for (const k of requiredKeys) {
      if (!enAuth[k]) allEn = false;
      if (!guAuth[k]) allGu = false;
    }

    assert(allEn, 'TEST 11: English translation contains all required auth strings');
    assert(allGu, 'TEST 12: Gujarati translation contains all required auth strings');
  } catch (err) {
    assert(false, 'TEST 11 & 12: i18n locale checks', err.message);
  }

  // TEST: Forgot Password does not reveal whether account exists
  try {
    const resExisting = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const dataExisting = await resExisting.json();

    const resNonExisting = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'totally.unknown.person@gmail.com' })
    });
    const dataNonExisting = await resNonExisting.json();

    assert(
      dataExisting.message === 'If an account exists for this email, password reset instructions have been sent.' &&
      dataNonExisting.message === 'If an account exists for this email, password reset instructions have been sent.',
      'TEST: Forgot password returns identical generic message for existing and non-existing accounts',
      `Existing: ${dataExisting.message}, NonExisting: ${dataNonExisting.message}`
    );
  } catch (err) {
    assert(false, 'TEST: Forgot password', err.message);
  }

  // TEST: Mixed Case Email Normalization (Student@Gmail.Com -> student@gmail.com)
  try {
    const mixedEmail = `Student.Mixed.${Date.now()}@Gmail.COM`;
    const resReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mixed Student',
        email: mixedEmail,
        password: 'Password@123',
        role: 'STUDENT',
        standard: 'Standard 8'
      })
    });
    const dataReg = await resReg.json();
    assert(
      dataReg.email === mixedEmail.toLowerCase(),
      'TEST: Registration normalizes mixed-case email to lowercase',
      `Returned email: ${dataReg.email}`
    );

    const userInDb = await prisma.user.findUnique({ where: { email: mixedEmail.toLowerCase() } });
    assert(
      userInDb && userInDb.email === mixedEmail.toLowerCase(),
      'TEST: Database stores normalized lowercase email'
    );
  } catch (err) {
    assert(false, 'TEST: Email normalization', err.message);
  }

  // TEST 13: Resend verification endpoint rate limiting & functionality
  try {
    // Unverify user temporarily to test resend
    await prisma.user.update({
      where: { email: testEmail },
      data: { emailVerified: false }
    });

    const res = await fetch(`${BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.message?.includes('Verification email sent'),
      'TEST 13: Resend verification email functions properly',
      `Status: ${res.status}, Message: ${data.message}`
    );

    // Immediate second call should trigger 429 rate limit
    const resRate = await fetch(`${BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    assert(
      resRate.status === 429,
      'TEST 13 (Rate Limit): Consecutive resend within 60s triggers HTTP 429 cooldown'
    );
  } catch (err) {
    assert(false, 'TEST 13: Resend verification', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
