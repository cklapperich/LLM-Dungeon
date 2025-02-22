import { readFileSync, readdirSync } from 'fs';
import { extname, join, resolve } from 'path';

// Enable more detailed error logging
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

// File extensions to count
const VALID_EXTENSIONS = ['.js', '.ts', '.html', '.tsx'];

function initializeStats() {
    return {
        totalLines: 0,
        fileTypes: Object.fromEntries(
            VALID_EXTENSIONS.map(ext => [ext, { lines: 0, count: 0 }])
        ),
        files: []
    };
}

// Stats object to store results
let stats = initializeStats();

function countLinesInFile(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        const ext = extname(filePath);
        
        // Only store individual file info
        stats.files.push({
            path: filePath,
            lines: lines,
            type: ext
        });
        
        return lines;
    } catch (err) {
        console.error(`Error reading file ${filePath}: ${err.message}`);
        return 0;
    }
}

function scanDirectory(dirPath) {
    try {
        console.log(`Scanning: ${dirPath}`);
        const entries = readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                // Skip build/test/cache directories
                const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.cache'];
                if (!skipDirs.includes(entry.name)) {
                    scanDirectory(fullPath);
                }
            } else if (entry.isFile()) {
                const ext = extname(entry.name);
                if (VALID_EXTENSIONS.includes(ext)) {
                    countLinesInFile(fullPath);
                }
            }
        }
    } catch (err) {
        console.error(`Error scanning directory ${dirPath}: ${err.message}`);
    }
}

function calculateTotals() {
    // Group files by type
    const filesByType = {};
    VALID_EXTENSIONS.forEach(ext => {
        filesByType[ext] = stats.files.filter(f => f.type === ext);
    });
    
    // Calculate totals for each type
    stats.fileTypes = {};
    VALID_EXTENSIONS.forEach(ext => {
        const files = filesByType[ext];
        const lines = files.reduce((sum, file) => sum + file.lines, 0);
        stats.fileTypes[ext] = {
            lines: lines,
            count: files.length
        };
    });
    
    // Calculate overall total
    stats.totalLines = Object.values(stats.fileTypes)
        .reduce((sum, type) => sum + type.lines, 0);
}

function printResults() {
    console.log('\n=== Line Count Summary ===\n');
    
    // Print totals by file type
    for (const ext of VALID_EXTENSIONS) {
        const { lines, count } = stats.fileTypes[ext];
        if (count > 0) {
            console.log(`${ext.padEnd(5)} files: ${lines.toString().padStart(6)} lines in ${count} files`);
        }
    }
    
    // Print total
    console.log('\nTotal:', stats.totalLines, 'lines\n');
    
    // Calculate column width for file paths
    const maxPathLength = Math.max(...stats.files.map(f => f.path.length));
    
    // Print individual file counts
    console.log('=== Individual File Counts ===\n');
    let typeTotal = 0;
    let currentType = null;
    
    // Sort first by extension, then by line count
    stats.files
        .sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return b.lines - a.lines;
        })
        .forEach(file => {
            // Print type header when extension changes
            if (currentType !== file.type) {
                if (currentType !== null) {
                    console.log(`${' '.repeat(6)}${'-'.repeat(8)}`);
                    console.log(`${typeTotal.toString().padStart(6)} total\n`);
                }
                console.log(`\n${file.type} files:`);
                currentType = file.type;
                typeTotal = 0;
            }
            typeTotal += file.lines;
            console.log(`${file.lines.toString().padStart(6)} lines: ${file.path}`);
        });
    
    // Print final type total
    if (currentType !== null) {
        console.log(`${' '.repeat(6)}${'-'.repeat(8)}`);
        console.log(`${typeTotal.toString().padStart(6)} total`);
    }
}

// Get directory path from command line argument or use current directory
const targetDir = process.argv[2] || '.';

console.log(`Scanning directory: ${targetDir}\n`);
scanDirectory(resolve(targetDir));

// Calculate totals before printing
calculateTotals();

printResults();
