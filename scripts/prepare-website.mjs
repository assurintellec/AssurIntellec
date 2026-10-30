import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = process.cwd();
// Copy in place so a running preview retains its public-directory watcher.
await mkdir(resolve(root, 'public'), { recursive: true });
for (const entry of await readdir(resolve(root, 'website'), { withFileTypes: true })) {
  const name = entry.name;
  if (entry.isDirectory() && !['assets','admin','content','images','videos'].includes(name)) continue;
  if (entry.isFile() && !/\.(html|ico|png|webmanifest|xml|txt)$/.test(name)) continue;
  await cp(resolve(root,'website',name), resolve(root,'public',name), { recursive:true });
}
console.log('Prepared original website files without rewriting content or CMS settings.');
