const fs = require('fs');
const path = require('path');

const replacements = [
  // Backgrounds
  [/bg-slate-950/g, 'bg-slate-50 dark:bg-slate-950'],
  [/bg-slate-900/g, 'bg-white dark:bg-slate-900'],
  [/bg-slate-800/g, 'bg-slate-100 dark:bg-slate-800'],
  [/bg-slate-700/g, 'bg-slate-200 dark:bg-slate-700'],
  // Text
  [/text-slate-50(?!0)/g, 'text-slate-900 dark:text-slate-50'],
  [/text-slate-100/g, 'text-slate-800 dark:text-slate-100'],
  [/text-slate-300/g, 'text-slate-700 dark:text-slate-300'],
  [/text-slate-400/g, 'text-slate-600 dark:text-slate-400'],
  [/text-slate-500/g, 'text-slate-500 dark:text-slate-500'],
  [/text-white/g, 'text-slate-900 dark:text-white'], // Beware of buttons
  // Borders
  [/border-slate-800/g, 'border-slate-200 dark:border-slate-800'],
  [/border-slate-700/g, 'border-slate-300 dark:border-slate-700'],
  [/border-slate-600/g, 'border-slate-400 dark:border-slate-600'],
  // Cyan Backgrounds
  [/bg-cyan-950/g, 'bg-cyan-50 dark:bg-cyan-950'],
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(([regex, replace]) => {
    content = content.replace(regex, replace);
  });
  // Special fix for text-slate-900 dark:text-white on buttons that should always be white
  content = content.replace(/text-slate-900 dark:text-white font-bold text-lg/g, 'text-white font-bold text-lg');
  content = content.replace(/bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 dark:text-white/g, 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white');
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Done!');
