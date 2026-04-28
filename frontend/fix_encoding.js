const fs = require('fs');
const path = require('path');

const map = {
    '·': '·',
    '—': '—',
    '…': '…',
    '✕': '✕',
    '👤': '👤',
    '✅': '✅',
    '📞': '📞',
    '🏫': '🏫',
    '📊': '📊',
    '💰': '💰',
    '−': '−',
    '─': '─',
    '📚': '📚',
    '🔍': '🔍',
    '📝': '📝',
    '💲': '💲',
    '📈': '📈',
    '👨вЂЌ🏫': '👨‍🏫',
    '👩вЂЌ🏫': '👩‍🏫',
    '👨': '👨',
    '👩': '👩'
};

function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') walk(p);
        } else if (p.endsWith('.js') || p.endsWith('.css')) {
            let content = fs.readFileSync(p, 'utf8');
            let changed = false;
            for (const [bad, good] of Object.entries(map)) {
                if (content.includes(bad)) {
                    content = content.split(bad).join(good);
                    changed = true;
                }
            }
            // Also fix the NaN issue in groups
            if (p.includes('groups') && p.includes('page.js')) {
                const nanTarget = "{Number(d.debt).toLocaleString('uz-UZ')} so'm";
                const nanFix = "{Number(d.debt || 0).toLocaleString('uz-UZ')} so'm";
                if (content.includes(nanTarget)) {
                    content = content.replace(nanTarget, nanFix);
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(p, content, 'utf8');
                console.log('Fixed', p);
            }
        }
    }
}

walk('c:\\\\Users\\\\Администратор\\\\Desktop\\\\crm\\\\frontend');
