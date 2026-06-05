import * as fs from 'fs';

const content = fs.readFileSync('App.tsx', 'utf8');

const regex = /import (\w+) from '\.\/components\/tools\/([^']+)';/g;

let newContent = content.replace(regex, "const $1 = React.lazy(() => import('./components/tools/$2'));");

// Because 'Home' shouldn't be lazy loaded (it's the first screen), we keep it synchronous.
// Same for MostUsedTools which is very commonly accessed immediately 
newContent = newContent.replace("const Home = React.lazy(() => import('./components/tools/Home'));", "import Home from './components/tools/Home';");
newContent = newContent.replace("const MostUsedTools = React.lazy(() => import('./components/tools/MostUsedTools'));", "import MostUsedTools from './components/tools/MostUsedTools';");
newContent = newContent.replace("const SmartLessonPlanner = React.lazy(() => import('./components/tools/SmartLessonPlanner'));", "import SmartLessonPlanner from './components/tools/SmartLessonPlanner';");


if (!newContent.includes('Suspense')) {
    const mainAreaRegex = /(<main className="flex-grow container mx-auto px-4 py-8 relative">)/;
    newContent = newContent.replace(mainAreaRegex, `$1 \n <React.Suspense fallback={<div className="flex h-64 items-center justify-center text-primary"><i className="fas fa-spinner fa-spin text-4xl"></i></div>}>`);
    
    const endMainRegex = /(<\/main>)/;
    newContent = newContent.replace(endMainRegex, `</React.Suspense>\n$1`);
}

fs.writeFileSync('App.tsx', newContent);
console.log('App.tsx updated to use lazy loading');
