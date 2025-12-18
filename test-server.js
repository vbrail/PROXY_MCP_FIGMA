#!/usr/bin/env node

/**
 * Test script for Figma MCP Proxy Server
 * Tests the server endpoints and functionality
 */

// Use Node.js built-in fetch (Node 18+) or https module
const https = await import('https');
const http = await import('http');

const SERVER_URL = process.env.SERVER_URL || 'https://proxy-mcp-figma.onrender.com';

async function testHealth() {
  console.log('\n🏥 Testing Health Endpoint...');
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testSSEConnection() {
  console.log('\n📡 Testing SSE Endpoint...');
  try {
    const response = await fetch(`${SERVER_URL}/sse`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let eventReceived = false;

    // Read first few events
    for (let i = 0; i < 3; i++) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log(`📨 Received SSE event ${i + 1}:`, chunk.substring(0, 200));

      if (chunk.includes('event: endpoint')) {
        eventReceived = true;
        // Extract sessionId from endpoint event
        const match = chunk.match(/sessionId=([^\s\n]+)/);
        if (match) {
          console.log('✅ Session ID extracted:', match[1]);
        }
      }
    }

    reader.cancel();
    console.log(eventReceived ? '✅ SSE connection working!' : '⚠️  No endpoint event received');
    return eventReceived;
  } catch (error) {
    console.error('❌ SSE test failed:', error.message);
    return false;
  }
}

async function testPOSTToSSE() {
  console.log('\n📤 Testing POST to /sse endpoint...');
  try {
    const response = await fetch(`${SERVER_URL}/sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ POST to /sse accepted (status:', response.status, ')');
    return true;
  } catch (error) {
    console.error('❌ POST to /sse failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Figma MCP Proxy Server');
  console.log('📍 Server URL:', SERVER_URL);
  console.log('=' .repeat(60));

  const results = {
    health: await testHealth(),
    sse: await testSSEConnection(),
    postSse: await testPOSTToSSE(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log('  Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('  SSE Connection:', results.sse ? '✅ PASS' : '❌ FAIL');
  console.log('  POST to /sse:', results.postSse ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
  console.log('\n💡 To test MCP functionality, configure Cursor with:');
  console.log(`   URL: ${SERVER_URL}/sse`);
  console.log('   Transport: sse');

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(console.error);

