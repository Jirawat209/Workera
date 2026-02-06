
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env vars
dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilesUpdate() {
    console.log('--- Testing Files Update ---');

    // 1. Get the first item
    const { data: items, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error('Failed to fetch items:', fetchError);
        return;
    }

    if (!items || items.length === 0) {
        console.error('No items found to test with.');
        return;
    }

    const item = items[0];
    console.log(`Found item: ${item.id} (${item.title})`);
    console.log('Current files:', item.files);

    // 2. Try to update files
    const testFile = {
        id: 'test-file-id',
        name: 'Test Google Drive File',
        url: 'https://docs.google.com/document/d/123456789/edit',
        type: 'google-drive'
    };

    console.log('Attempting to update files column...');
    const { data, error: updateError } = await supabase
        .from('items')
        .update({ files: [testFile] })
        .eq('id', item.id)
        .select();

    if (updateError) {
        console.error('❌ Update FAILED:', updateError);
        console.error('Code:', updateError.code);
        console.error('Details:', updateError.details);
        console.error('Hint:', updateError.hint);
        console.error('Message:', updateError.message);
    } else {
        console.log('✅ Update SUCCESS!');
        console.log('Updated data:', JSON.stringify(data, null, 2));
    }
}

testFilesUpdate();
