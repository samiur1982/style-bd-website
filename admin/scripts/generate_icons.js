const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../../core/public/uploads/categories');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const slugify = (text) => text.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
const escapeXml = (unsafe) => unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&apos;';
    }
});

const categories = [
    { id: 1, name: "Women's Fashion", color: "#800020", icon: 'dress' },
    { id: 2, name: "Kurti & Tops", color: "#4A0E1C", icon: 'shirt' },
    { id: 3, name: "Salwar Kameez", color: "#2D0A14", icon: 'dress' },
    { id: 4, name: "Modest Wear", color: "#1A0F14", icon: 'robe' },
    { id: 5, name: "Borkha", color: "#000000", icon: 'robe' },
    { id: 6, name: "Abaya", color: "#111111", icon: 'robe' },
    { id: 7, name: "Men's Fashion", color: "#1E293B", icon: 'suit' },
    { id: 8, name: "Panjabi", color: "#451A03", icon: 'shirt' },
    { id: 9, name: "Men Socks", color: "#1F2937", icon: 'socks' },
    { id: 10, name: "Kids & Baby", color: "#312E81", icon: 'baby' },
    { id: 11, name: "Electronics", color: "#111827", icon: 'electronics' },
    { id: 12, name: "Personal Care", color: "#1E1B4B", icon: 'bottle' },
    { id: 13, name: "Gadgets", color: "#0F172A", icon: 'watch' },
    { id: 14, name: "Kurti", color: "#3F0B13", icon: 'shirt' },
    { id: 15, name: "Top", color: "#54121F", icon: 'shirt' }
];

const icons = {
    dress: '<path d="M12 2L4 10V22H20V10L12 2Z" fill="white" opacity="0.9" />',
    shirt: '<path d="M7 3L4 5V9L7 11V21H17V11L20 9V5L17 3H7Z" fill="white" opacity="0.9" />',
    robe: '<path d="M12 2L5 8V22H19V8L12 2Z M12 6V22" stroke="white" stroke-width="2" fill="none" opacity="0.9" />',
    suit: '<path d="M12 2L4 7V22H20V7L12 2Z M12 2V22 M8 7L12 11L16 7" stroke="white" stroke-width="2" fill="none" opacity="0.9" />',
    socks: '<path d="M10 2V14L16 20L20 16L14 10V2H10Z" fill="white" opacity="0.9" />',
    baby: '<circle cx="12" cy="8" r="5" fill="white" opacity="0.9" /><path d="M7 13C7 13 7 22 12 22C17 22 17 13 17 13" stroke="white" stroke-width="2" fill="none" opacity="0.9" />',
    electronics: '<rect x="5" y="2" width="14" height="20" rx="2" fill="white" opacity="0.9" /><circle cx="12" cy="18" r="1.5" fill="white" />',
    bottle: '<path d="M9 2H15V5H9V2Z M7 5H17V22H7V5Z" fill="white" opacity="0.9" />',
    watch: '<circle cx="12" cy="12" r="6" fill="white" opacity="0.9" /><path d="M12 2V6 M12 18V22" stroke="white" stroke-width="2" />'
};

async function generate() {
    for (const cat of categories) {
        const svg = `
            <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="400" fill="${cat.color}" />
                <!-- Icon -->
                <g transform="translate(100, 60) scale(8.3)">
                    ${icons[cat.icon] || icons.shirt}
                </g>
                <!-- Text -->
                <text x="200" y="340" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="1">
                    ${escapeXml(cat.name.toUpperCase())}
                </text>
            </svg>
        `;

        const filename = `${slugify(cat.name)}.png`;
        await sharp(Buffer.from(svg))
            .resize(400, 400)
            .png({ quality: 90, compressionLevel: 9 })
            .toFile(path.join(outputDir, filename));
        
        console.log(`Generated ${filename} for ${cat.name}`);
    }
}

generate().catch(console.error);
