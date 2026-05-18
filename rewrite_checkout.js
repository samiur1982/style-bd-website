const fs = require('fs');
const file = '/home/samiur/Documents/Style-bd-Larabel website/core/resources/views/frontend/checkout.blade.php';
let content = fs.readFileSync(file, 'utf8');

// Header
content = content.replace(/text-3xl font-black text-black font-playfair uppercase tracking-\[0\.1em\]/g, 'text-3xl font-semibold text-black');
content = content.replace(/text-\[9px\] font-black text-\[#C79438\] mt-2 uppercase tracking-\[0\.4em\]/g, 'text-sm text-gray-500 mt-2');

// Section Titles
content = content.replace(/text-\[10px\] font-black text-black uppercase tracking-\[0\.3em\] flex/g, 'text-lg font-semibold text-black flex');

// Product Preview
content = content.replace(/text-xs font-black text-black uppercase truncate/g, 'text-sm font-medium text-black truncate');
content = content.replace(/text-\[9px\] font-bold text-\[#C79438\] mt-1 uppercase/g, 'text-xs text-gray-500 mt-1');
content = content.replace(/text-\[10px\] font-black w-4 text-center text-black/g, 'text-sm font-medium w-4 text-center text-black');

// Cart Preview
content = content.replace(/text-\[10px\] font-black text-black uppercase truncate/g, 'text-sm font-medium text-black truncate');
content = content.replace(/text-\[8px\] font-bold text-gray-400 uppercase/g, 'text-xs text-gray-500');
content = content.replace(/text-\[10px\] font-black text-black/g, 'text-sm font-semibold text-black');

// Totals
content = content.replace(/text-\[10px\] font-black text-gray-400 uppercase tracking-widest/g, 'text-sm font-medium text-gray-600');
content = content.replace(/text-xs font-black text-black uppercase tracking-\[0\.2em\]/g, 'text-base font-bold text-black');
content = content.replace(/text-4xl font-black text-\[#C79438\]/g, 'text-2xl font-bold text-black');

// Labels
content = content.replace(/text-\[9px\] font-black text-black uppercase tracking-\[0\.3em\] ml-1/g, 'text-sm font-medium text-gray-700 ml-1 mb-1 block');

// Inputs
content = content.replace(/w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-black outline-none text-xs font-black text-black bg-white transition-all/g, 'w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none text-sm text-black bg-white transition-all');
// Select
content = content.replace(/w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-black outline-none text-xs font-black text-black bg-white appearance-none transition-all uppercase tracking-widest cursor-pointer/g, 'w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none text-sm text-black bg-white appearance-none transition-all cursor-pointer');

// Checkout Button & COD
content = content.replace(/text-\[9px\] font-black text-black uppercase tracking-widest/g, 'text-sm font-semibold text-black');
content = content.replace(/text-\[8px\] font-bold text-gray-400 uppercase/g, 'text-xs text-gray-500');
content = content.replace(/text-red-500 font-black text-\[9px\] text-center uppercase tracking-widest mb-6/g, 'text-red-500 font-medium text-sm text-center mb-6');
content = content.replace(/w-full py-6 bg-\[#EFBE63\] text-black font-black text-xs uppercase tracking-\[0\.4em\] shadow-xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-4 group/g, 'w-full py-4 bg-black text-white font-semibold text-base rounded-xl shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group');

// Success Overlay
content = content.replace(/text-4xl font-black text-black mb-4 font-playfair uppercase tracking-tighter/g, 'text-3xl font-bold text-black mb-4');
content = content.replace(/text-\[10px\] font-black text-gray-400 uppercase tracking-\[0\.4em\] leading-relaxed/g, 'text-sm text-gray-600 leading-relaxed');
content = content.replace(/w-full py-5 bg-black text-white font-black text-\[10px\] uppercase tracking-\[0\.4em\] transition-all hover:bg-\[#EFBE63\] hover:text-black shadow-2xl/g, 'w-full py-3 bg-black text-white font-semibold text-base rounded-xl transition-all hover:bg-gray-800 shadow-xl');

fs.writeFileSync(file, content);
console.log('Replacements complete.');
