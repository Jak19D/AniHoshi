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

    const passwordClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: passwordData, error: passwordError } = await passwordClient.auth.signInWithPassword({
        email: user.email,
        password,
    });
    if (passwordError || passwordData.user?.id !== user.id) {
        return json(403, { error: 'reauthentication_failed' });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const bucket = 'profile-images';
    let paths: string[];
    try {
        paths = await listAllObjectPaths(admin, bucket, user.id);
    } catch (error) {
        console.error('delete-account failed listing profile objects', error);
        return json(500, { error: 'account_deletion_failed' });
    }

    for (let index = 0; index < paths.length; index += 100) {
        const { error } = await admin.storage.from(bucket).remove(paths.slice(index, index + 100));
        if (error) {
            console.error('delete-account failed removing profile objects', error);
            return json(500, { error: 'account_deletion_failed' });
        }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
        console.error('delete-account failed deleting auth user', deleteError);
        return json(500, { error: 'account_deletion_failed' });
    }

    return json(200, { deleted: true });
});
