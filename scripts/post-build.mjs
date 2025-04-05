import fs from 'fs-extra'
import path from 'path'
const __dirname = import.meta.dirname
const src = path.resolve(__dirname, '../dist')
const dest = path.resolve(__dirname, '../deploy', 'dist')
fs.emptyDirSync(src, dest);
console.log(`Copied ${src} to ${dest}`)