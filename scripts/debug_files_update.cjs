
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/['"]/g, '');
                if (key && !key.startsWith('#')) env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Failed to load .env:', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilesUpdate() {
    console.log('--- Testing Files Update ---');

    // 0. List tables (optional, requires permissions) or just count items
    console.log('Counting items...');
    const { count, error: countError } = await supabase.from('items').select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Failed to count items:', countError);
    } else {
        console.log('Total items in DB:', count);
    }

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
        id: 'test-file-id-' + Date.now(),
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
        console.error('Message:', updateError.message);
    } else {
        console.log('✅ Update SUCCESS!');
        console.log('Updated data:', JSON.stringify(data, null, 2));
    }
}

testFilesUpdate();
