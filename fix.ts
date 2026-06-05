import * as fs from 'fs';
import * as path from 'path';

function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Revert changes made by fix_dark_mode.ts and switch to native theme variables
            // We want to remove dark:text-xxx, dark:bg-xxx and use component-bg, base-text where appropriate.
            
            content = content.replace(/bg-white(?:\s+dark:bg-\S+)?/g, 'bg-component-bg');
            content = content.replace(/bg-gray-50(?:\s+dark:bg-\S+)?/g, 'bg-component-bg');
            content = content.replace(/bg-gray-100(?:\s+dark:bg-\S+)?/g, 'bg-base-bg');
            content = content.replace(/bg-gray-800(?:\s+dark:bg-\S+)?/g, 'bg-component-bg');
            
            content = content.replace(/text-gray-900(?:\s+dark:text-\S+)?/g, 'text-heading-text');
            content = content.replace(/text-gray-800(?:\s+dark:text-\S+)?/g, 'text-heading-text');
            content = content.replace(/text-gray-700(?:\s+dark:text-\S+)?/g, 'text-base-text');
            content = content.replace(/text-gray-600(?:\s+dark:text-\S+)?/g, 'text-base-text');
            
            // For SmartLessonPlanner print views, we might have accidentally replaced text-black with text-black dark:text-white
            content = content.replace(/text-black(?:\s+dark:text-white)?/g, 'text-black print:text-black');
            
            // Clean up hardcoded dark text colors for icons or borders if any
            content = content.replace(/dark:text-blue-\d+/g, '');
            content = content.replace(/dark:border-gray-\d+/g, '');
            content = content.replace(/border-gray-100/g, 'border-border/10');
            content = content.replace(/border-gray-200/g, 'border-border/30');
            content = content.replace(/border-gray-300/g, 'border-border/50');
            content = content.replace(/border-gray-700/g, 'border-border/30');
            
            // In case of any multiple spaces left over
            content = content.replace(/\s{2,}/g, ' ');

            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

processDirectory('./components');
console.log('Fixed themes system');
