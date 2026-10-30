import site from '../../../website/content/site.json';
import { handleNewsletterRequest } from '../../../website/newsletter-proxy.js';
export function POST(request:Request){return handleNewsletterRequest(request,{ASSETS:{fetch:async()=>Response.json(site)}});}
export function GET(request:Request){return handleNewsletterRequest(request,{ASSETS:{fetch:async()=>Response.json(site)}});}
