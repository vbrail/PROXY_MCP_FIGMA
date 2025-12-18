#!/usr/bin/env node

/**
 * Test script for Figma MCP Proxy Server
 * Tests the server endpoints and functionality
 */

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
    let sessionId = null;

    // Read first few events
    for (let i = 0; i < 3; i++) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log(`📨 Received SSE event ${i + 1}:`, chunk.substring(0, 200));

      if (chunk.includes('event: endpoint')) {
        eventReceived = true;
        // Extract sessionId from endpoint event
        const match = chunk.match(/sessionId=([^\s\n&]+)/);
        if (match) {
          sessionId = match[1];
          console.log('✅ Session ID extracted:', sessionId);
        }
      }
    }

    reader.cancel();
    console.log(eventReceived ? '✅ SSE connection working!' : '⚠️  No endpoint event received');
    return { success: eventReceived, sessionId };
  } catch (error) {
    console.error('❌ SSE test failed:', error.message);
    return { success: false, sessionId: null };
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
  console.log('='.repeat(60));

  const results = {
    health: await testHealth(),
    sse: await testSSEConnection(),
    postSse: await testPOSTToSSE(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log('  Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('  SSE Connection:', results.sse.success ? '✅ PASS' : '❌ FAIL');
  if (results.sse.sessionId) {
    console.log('  Session ID:', results.sse.sessionId);
  }
  console.log('  POST to /sse:', results.postSse ? '✅ PASS' : '❌ FAIL');

  const allPassed = results.health && results.sse.success && results.postSse;
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
  console.log('\n💡 To test MCP functionality in Cursor:');
  console.log(`   1. Configure Cursor with URL: ${SERVER_URL}/sse`);
  console.log('   2. Transport: sse');
  console.log('   3. Try: "List my Figma files" or "Show me available Figma resources"');

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(console.error);

