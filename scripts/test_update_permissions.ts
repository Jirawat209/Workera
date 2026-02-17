import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUpdate() {
    // 1. Login as Tester1
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'Tester1@example.com',
        password: '1234567890'
    });

    if (loginError || !user) {
        console.error('Login failed:', loginError);
        return;
    }

    console.log('Logged in as:', user.email);

    // 2. Get a board member record
    const { data: members, error: fetchError } = await supabase
        .from('board_members')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

    if (fetchError) {
        console.error('Fetch members failed:', fetchError);
        return;
    }

    if (!members || members.length === 0) {
        console.error('No board members found for user');
        return;
    }

    const member = members[0];
    console.log('Found member record:', member);

    // 3. Try to update last_viewed_at
    const { data, error: updateError } = await supabase
        .from('board_members')
        .update({ last_viewed_at: new Date().toISOString() })
        .eq('board_id', member.board_id)
        .eq('user_id', user.id)
        .select();

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Update successful:', data);
    }
}

checkUpdate();
