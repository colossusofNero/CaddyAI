/**
 * READ-ONLY: look up a course in iGolf (CourseList) to find its real id_course,
 * which CourseGPSVectorDetails needs. Census-imported courses/{id} doc ids are
 * NOT iGolf ids. Writes nothing.
 *
 * Usage: node scripts/igolf-find-course.mjs "Bear Mountain" ["Big Bear Lake"]
 */
import { config } from 'dotenv';
import crypto from 'crypto';
config({ path: '.env.local' });

const API_KEY = process.env.IGOLF_API_KEY;
const SECRET = process.env.IGOLF_SECRET_KEY;
const BASE = process.env.IGOLF_BASE_URL || 'https://api-connect.igolf.com';

function b64url(buf) { return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function ts() {
  const n = new Date(); const p = x => String(x).padStart(2, '0'); const off = -n.getTimezoneOffset(); const s = off >= 0 ? '+' : '-';
  return `${String(n.getFullYear()).slice(-2)}${p(n.getMonth()+1)}${p(n.getDate())}${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}${s}${p(Math.floor(Math.abs(off)/60))}${p(Math.abs(off)%60)}`;
}
async function igolf(action, payload) {
  const t = ts();
  const sts = `${action}/${API_KEY}/1.1/2.0/HmacSHA256/${t}/JSON`;
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(sts).digest());
  const url = `${BASE}/rest/action/${action}/${API_KEY}/1.1/2.0/HmacSHA256/${sig}/${t}/JSON`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const text = await res.text();
  const data = JSON.parse(text);
  if (data.Status !== 1) throw new Error(`Status ${data.Status}: ${text.slice(0, 300)}`);
  return data.data || data;
}

const name = process.argv[2] || 'Bear Mountain';
const city = process.argv[3];

const payload = { id_country: 1, courseName: name };
if (city) payload.city = city;
console.log('CourseList payload:', JSON.stringify(payload));

let data;
try { data = await igolf('CourseList', payload); }
catch (e) { console.error('lookup failed:', e.message); process.exit(2); }

// Normalize to an array of course rows.
const rows = data?.courses?.course || data?.Courses?.Course || data?.course || data?.courses || data;
const arr = Array.isArray(rows) ? rows : (rows ? [rows] : []);
console.log(`\nresults: ${arr.length}`);
for (const c of arr.slice(0, 25)) {
  const id = c.id_course ?? c.idCourse ?? c.id;
  console.log(`  id_course=${id}  "${c.courseName ?? c.name}"  ${c.city ?? ''}, ${c.state ?? c.id_state ?? ''}  holes=${c.layoutHoles ?? c.holes ?? '?'}  lat=${c.latitude ?? '?'} lng=${c.longitude ?? '?'}`);
}
if (!arr.length) console.log('raw:', JSON.stringify(data).slice(0, 600));
process.exit(0);
