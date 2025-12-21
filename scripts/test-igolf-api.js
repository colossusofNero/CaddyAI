/**
 * iGolf API Testing Script
 *
 * Test different authentication methods to see what works with legacy credentials
 */

const crypto = require('crypto');

const API_KEY = 'uUqnXUKU86kghJk';
const BASE_URL = 'https://api.igolf.com';

/**
 * Method 1: Simple API Key in URL
 */
async function testSimpleApiKey() {
  console.log('\n=== Testing Method 1: Simple API Key in URL ===');

  const url = `${BASE_URL}/rest/action/CourseList/${API_KEY}/1.0/1.0/JSON?limit=5`;
  console.log('URL:', url);

  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Response:', text.substring(0, 500));

    if (response.ok) {
      console.log('✅ Success with simple API key!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  return false;
}

/**
 * Method 2: API Key with Basic Authentication
 */
async function testBasicAuth() {
  console.log('\n=== Testing Method 2: API Key with Basic Auth ===');

  const url = `${BASE_URL}/rest/action/CourseList/${API_KEY}/1.0/1.0/JSON?limit=5`;
  console.log('URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`
      }
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));

    if (response.ok) {
      console.log('✅ Success with Basic Auth!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  return false;
}

/**
 * Method 3: Try without HMAC signature (no timestamp/signature)
 */
async function testNoSignature() {
  console.log('\n=== Testing Method 3: Without HMAC Signature ===');

  const url = `${BASE_URL}/rest/action/CourseList/${API_KEY}/1.0/1.0/JSON?limit=5`;
  console.log('URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CaddyAI-Web/1.0'
      }
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));

    if (response.ok) {
      console.log('✅ Success without signature!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  return false;
}

/**
 * Method 4: Test with a dummy secret (see what error we get)
 */
async function testWithDummySecret() {
  console.log('\n=== Testing Method 4: HMAC with Dummy Secret ===');

  const timestamp = Math.floor(Date.now() / 1000);
  const action = 'CourseList';
  const secretKey = 'your-30-character-secret-key-here'; // Dummy

  const signatureString = `${action}${API_KEY}${timestamp}${secretKey}`;
  const signature = crypto.createHmac('sha256', secretKey).update(signatureString).digest('hex');

  const url = `${BASE_URL}/rest/action/${action}/${API_KEY}/1.0/1.0/HMAC256/${signature}/${timestamp}/JSON?limit=5`;
  console.log('URL:', url);

  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));

    if (response.ok) {
      console.log('✅ Success with dummy secret!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  return false;
}

/**
 * Method 5: Test StateList endpoint (simpler, might not need auth)
 */
async function testStateList() {
  console.log('\n=== Testing Method 5: StateList Endpoint ===');

  const url = `${BASE_URL}/rest/action/StateList/${API_KEY}/1.0/1.0/JSON?countryId=1`;
  console.log('URL:', url);

  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));

    if (response.ok) {
      console.log('✅ Success with StateList!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  return false;
}

/**
 * Method 6: Check for alternative endpoints
 */
async function testAlternativeEndpoints() {
  console.log('\n=== Testing Method 6: Alternative Endpoints ===');

  const endpoints = [
    `/api/courses`,
    `/courses/search`,
    `/v1/courses`,
    `/public/courses`,
  ];

  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint}?apiKey=${API_KEY}&limit=5`;
    console.log(`\nTrying: ${url}`);

    try {
      const response = await fetch(url);
      console.log('Status:', response.status);

      if (response.ok) {
        const text = await response.text();
        console.log('Response:', text.substring(0, 200));
        console.log(`✅ Success with ${endpoint}!`);
        return true;
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  return false;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🔍 Testing iGolf API with Legacy Credentials');
  console.log('API Key:', API_KEY);
  console.log('Base URL:', BASE_URL);

  const methods = [
    { name: 'Simple API Key', test: testSimpleApiKey },
    { name: 'Basic Auth', test: testBasicAuth },
    { name: 'No Signature', test: testNoSignature },
    { name: 'Dummy Secret HMAC', test: testWithDummySecret },
    { name: 'StateList', test: testStateList },
    { name: 'Alternative Endpoints', test: testAlternativeEndpoints },
  ];

  for (const method of methods) {
    try {
      const success = await method.test();
      if (success) {
        console.log(`\n✅ Working method found: ${method.name}`);
        return;
      }
    } catch (error) {
      console.error(`\n❌ ${method.name} failed:`, error.message);
    }
  }

  console.log('\n\n📋 Summary:');
  console.log('None of the tested authentication methods worked.');
  console.log('\n💡 Recommendations:');
  console.log('1. Contact iGolf support for web API credentials');
  console.log('2. Check if there\'s a different API endpoint for web access');
  console.log('3. Request the actual secret key for your API key');
  console.log('4. Consider using a mobile app approach with WebView bridge');
}

// Run the tests
runAllTests().catch(console.error);
