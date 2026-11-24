import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function listAllObjectPaths(
    admin: SupabaseClient<any, any, any, any, any>,
    bucket: string,
    prefix: string,
): Promise<string[]> {
    const paths: string[] = [];
    let offset = 0;
    const pageSize = 100;

    while (true) {
        const { data, error } = await admin.storage.from(bucket).list(prefix, {
            limit: pageSize,
            offset,
            sortBy: { column: 'name', order: 'asc' },
        });
        if (error) throw error;
        if (!data?.length) break;

        for (const item of data) {
            const itemPath = `${prefix}/${item.name}`;
            if (item.id === null) {
                paths.push(...await listAllObjectPaths(admin, bucket, itemPath));
            } else {
                paths.push(itemPath);
            }
        }
        if (data.length < pageSize) break;
        offset += data.length;
    }

    return paths;
}

Deno.serve(async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    const authorization = request.headers.get('Authorization');
    const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer) return json(401, { error: 'unauthorized' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
        console.error('delete-account is missing required server environment settings');
        return json(500, { error: 'server_not_configured' });
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser(bearer);
    if (userError || !user?.id || !user.email) return json(401, { error: 'invalid_session' });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'invalid_request' });
    }
    const password = typeof body === 'object' && body !== null && 'password' in body
        ? (body as { password?: unknown }).password
        : null;
    if (typeof password !== 'string' || password.length === 0) {
        return json(400, { error: 'recent_password_confirmation_required' });
    }

    // Re-authenticate the same account before making an irreversible deletion.
    const reauthClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: reauthData, error: reauthError } = await reauthClient.auth.signInWithPassword({
        email: user.email,
        password,
    });
    if (reauthError || reauthData.user?.id !== user.id) return json(403, { error: 'reauthentication_failed' });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
        // Storage objects do not cascade with auth.users. Delete only this user's
        // own prefix and only from the private profile bucket.
        const bucket = 'profile-images';
        const paths = await listAllObjectPaths(admin, bucket, user.id);
        for (let index = 0; index < paths.length; index += 100) {
            const { error } = await admin.storage.from(bucket).remove(paths.slice(index, index + 100));
            if (error) throw error;
        }

        const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
        if (deleteError) throw deleteError;
        return json(200, { deleted: true });
    } catch (error) {
        console.error('delete-account failed', error);
        return json(500, { error: 'account_deletion_failed' });
    }
});
