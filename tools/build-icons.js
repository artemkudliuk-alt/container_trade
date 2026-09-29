/* Генерирует scss/_icons-data.scss: SVG-иконки (img/icons/i-*.svg, f-*.svg) → data URI.
   Нужно, чтобы иконки-маски работали и при открытии index.html прямо с диска (file://).
   Запуск: npm run icons */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'img', 'icons');
const files = fs.readdirSync(dir).filter(f => /^(i|f)-.*\.svg$/.test(f)).sort();
const enc = s => s.replace(/"/g, "'").replace(/%/g, '%25').replace(/#/g, '%23')
  .replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, ' ');
let out = '// АВТОГЕНЕРАЦИЯ — не редактировать вручную. Источник: img/icons/*.svg, запуск: npm run icons\n$icons: (\n';
for (const f of files) {
  const svg = fs.readFileSync(path.join(dir, f), 'utf8').trim();
  out += `  "${f.replace(/\.svg$/, '')}": "data:image/svg+xml,${enc(svg)}",\n`;
}
out += ');\n';
fs.writeFileSync(path.join(__dirname, '..', 'scss', '_icons-data.scss'), out);
console.log('icons:', files.length);
