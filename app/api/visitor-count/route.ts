import { env } from 'cloudflare:workers';
import site from '../../../website/content/site.json';
import { handleCounter } from '../../../lib/visitor-counter.mjs';
export const dynamic = 'force-dynamic';
export function GET(request:Request){return handleCounter(request,env.DB,site.visitor_counter);}
export const POST=GET;
export const PUT=GET;
export const DELETE=GET;
