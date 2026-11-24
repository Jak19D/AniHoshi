import { createClient } from 'npm:@supabase/supabase-js@2';
import { GetObjectCommand, S3Client } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const B2_BUCKET = 'anihosi-videos';
const B2_OBJECT_KEY = 'black-cloverseason-2episode-1video.mp4.mp4';
const SIGNED_URL_TTL_SECONDS = 300;

function json(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

function getPublishableKey(): string | null {
    const legacyKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (legacyKey) return legacyKey;

    try {
        const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}') as Record<string, string>;
        return keys.default ?? Object.values(keys)[0] ?? null;
    } catch {
        return null;
    }
}

Deno.serve(async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    const bearer = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer) return json(401, { error: 'unauthorized' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishableKey = getPublishableKey();
    if (!supabaseUrl || !publishableKey) {
        console.error('B2 test signer is missing Supabase runtime configuration');
        return json(500, { error: 'server_not_configured' });
    }

    const supabase = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(bearer);
    if (authError || !user) return json(401, { error: 'invalid_session' });

    const keyId = Deno.env.get('B2_KEY_ID');
    const applicationKey = Deno.env.get('B2_APPLICATION_KEY');
    if (!keyId || !applicationKey) {
        console.error('B2 test signer is missing B2 read-only credentials');
        return json(500, { error: 'b2_not_configured' });
    }

    try {
        const s3 = new S3Client({
            region: 'us-east-005',
            endpoint: 'https://s3.us-east-005.backblazeb2.com',
            forcePathStyle: true,
            credentials: { accessKeyId: keyId, secretAccessKey: applicationKey },
        });

        const url = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: B2_BUCKET, Key: B2_OBJECT_KEY }),
            { expiresIn: SIGNED_URL_TTL_SECONDS },
        );

        return json(200, {
            url,
            expiresIn: SIGNED_URL_TTL_SECONDS,
            expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
            object: B2_OBJECT_KEY,
        });
    } catch (error) {
        console.error('B2 test URL signing failed', error instanceof Error ? error.name : 'unknown_error');
        return json(502, { error: 'b2_signing_failed' });
    }
});
