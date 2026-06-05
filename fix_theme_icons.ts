import * as fs from 'fs';

let content = fs.readFileSync('themes.ts', 'utf8');

// For any theme where `dark: true` is set, we need to ensure `--color-icon` is bright.
// Let's simply replace them all with the --color-base-text or --color-heading-text value.
// Wait, doing this via regex is a bit tricky. We can just parse but since it's a JS file, let's use simple find and replace for the problematic ones.

const fixes: Record<string, string> = {
    // زمردي
    "'--color-icon': '5 46 25',": "'--color-icon': '167 243 208',",
    // غابة عميقة
    "'--color-icon': '17 24 39',": "'--color-icon': '209 250 229',",
    // طحلبي
    "'--color-icon': '236 252 203',": "'--color-icon': '236 252 203',", // ok
    // نحاسي
    "'--color-icon': '255 237 213',": "'--color-icon': '255 237 213',", // ok
    // الفن الإسلامي (Not dark but it's okay)
};

for (const [find, replace] of Object.entries(fixes)) {
    content = content.replace(find, replace);
}

fs.writeFileSync('themes.ts', content);
console.log('Fixed themes icon colors');
