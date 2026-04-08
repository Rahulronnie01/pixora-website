import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Recursively get all HTML files
function getHtmlFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== 'public') {
      getHtmlFiles(filePath, files);
    } else if (filePath.endsWith('.html')) {
      files.push(filePath);
    }
  }
  return files;
}

const htmlFiles = getHtmlFiles(__dirname);
const inputObj = {};

htmlFiles.forEach(file => {
  // Use relative path without extension as the entry name
  const name = path.relative(__dirname, file).replace(/\.html$/, '').replace(/\\/g, '/');
  inputObj[name] = file;
});

export default defineConfig({
  build: {
    rollupOptions: {
      input: inputObj
    }
  }
});
