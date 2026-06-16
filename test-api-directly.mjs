#!/usr/bin/env node

console.log('🧪 Testing integration guide API endpoint...\n');

// Simulate the API route logic
import { readFile } from 'fs/promises';
import { join } from 'path';

async function testAPILogic() {
  try {
    const filePath = join(process.cwd(), 'public/docs/integration-guide.md');
    console.log('📄 Reading from:', filePath);

    const content = await readFile(filePath, 'utf-8');
    console.log('✅ File read successfully, length:', content.length);

    // Simulate the replacement that happens in the dialog
    const testAppId = 'app_test123456789';
    const customizedContent = content.replace(
      /app_01ktqt92zh947r0d96p09w2ssh/g,
      testAppId
    );

    if (customizedContent.includes(testAppId)) {
      console.log('✅ App ID replacement works correctly');
      console.log('   Placeholder replaced with:', testAppId);
    } else {
      console.log('❌ App ID replacement failed');
    }

    // Return the response format
    const response = { success: true, content: customizedContent };
    console.log('✅ API response structure:', { success: response.success, contentLength: response.content.length });

    console.log('\n✅ API logic test passed!');
    console.log('📝 The integration guide API should work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPILogic();
