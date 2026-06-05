import * as fs from 'fs';
import * as path from 'path';

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let original = fs.readFileSync(fullPath, 'utf8');
            let content = original;
            
            // Revert changes made by fix_dark_mode.ts where it conflicts with themes
            content = content.replace(/dark:bg-gray-\d+/g, '');
            content = content.replace(/dark:text-gray-\d+/g, '');
            content = content.replace(/dark:text-white/g, '');
            content = content.replace(/dark:border-gray-\d+/g, '');
            
            // Fix Home.tsx to use theme colors directly
            if (file === 'Home.tsx') {
                content = content.replace(/bg-white(?!\/)/g, 'bg-component-bg');
                content = content.replace(/bg-gray-50/g, 'bg-component-bg border-opacity-50');
                content = content.replace(/text-gray-900/g, 'text-heading-text');
                content = content.replace(/text-gray-800/g, 'text-heading-text');
                content = content.replace(/text-gray-700/g, 'text-base-text');
                content = content.replace(/text-gray-600/g, 'text-base-text');
                content = content.replace(/text-gray-500/g, 'text-base-text/70');
                content = content.replace(/text-gray-400/g, 'text-base-text/50');
                content = content.replace(/border-gray-200/g, 'border-border/20');
                content = content.replace(/border-gray-100/g, 'border-border/10');
                content = content.replace(/bg-gray-800/g, 'bg-component-bg');
            }

            // Remove multiple spaces left by regex replacements
            content = content.replace(/  +/g, ' ');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDirectory('./components');
console.log('Fixed theme colors');
