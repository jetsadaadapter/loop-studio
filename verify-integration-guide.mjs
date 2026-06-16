#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { join } from 'path';

console.log('🔍 Verifying integration guide setup...\n');

try {
  // Test 1: Check if file exists and is readable
  const filePath = join(process.cwd(), 'public/docs/integration-guide.md');
  console.log('📄 File path:', filePath);

  const content = await readFile(filePath, 'utf-8');
  console.log('✅ File exists and is readable');
  console.log('📏 File size:', content.length, 'bytes');

  // Test 2: Check content structure
  if (content.includes('# ADT Library API')) {
    console.log('✅ File has correct header');
  } else {
    console.log('❌ File header is incorrect');
    process.exit(1);
  }

  if (content.includes('app_01ktqt92zh947r0d96p09w2ssh')) {
    console.log('✅ File contains placeholder App ID for replacement');
  } else {
    console.log('⚠️  Placeholder App ID not found');
  }

  // Test 3: Verify API route file
  const apiRoutePath = join(process.cwd(), 'src/app/api/manage/keys/instruction/route.ts');
  const apiRouteContent = await readFile(apiRoutePath, 'utf-8');

  if (apiRouteContent.includes('public/docs/integration-guide.md')) {
    console.log('✅ API route points to correct file path');
  } else {
    console.log('❌ API route has wrong file path');
    process.exit(1);
  }

  console.log('\n✅ All checks passed! Integration guide should work now.');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart dev server: npm run dev');
  console.log('   2. Navigate to /manage/keys');
  console.log('   3. Click "Read Guide" button on any API key');
  console.log('   4. Verify the modal opens and displays the guide');

} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}
