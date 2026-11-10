// Generates the Umbraco 13 language XML files from the v17+ TypeScript dictionaries.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const out = new URL('../../Clockwork.Umbraco.ImageFrame/wwwroot/App_Plugins/ClockworkImageFrame/lang/', import.meta.url);
mkdirSync(out, { recursive: true });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
for (const [file, culture, name] of [['en', 'en-US', 'English (US)'], ['tr', 'tr-TR', 'Türkçe']]) {
  const src = readFileSync(new URL(`../src/lang/${file}.ts`, import.meta.url), 'utf8').replace(/^export default/m, 'return');
  const dict = new Function(src)();
  let xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n<language alias="${file}" intName="${name}" localName="${name}" lcid="" culture="${culture}">\n`;
  for (const [area, keys] of Object.entries(dict)) {
    xml += `  <area alias="${area}">\n`;
    for (const [k, v] of Object.entries(keys)) xml += `    <key alias="${k}">${esc(v)}</key>\n`;
    xml += `  </area>\n`;
  }
  writeFileSync(new URL(`${culture}.xml`, out), xml + '</language>\n');
}
console.log('v13 language files written');
