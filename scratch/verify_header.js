const http = require('http');

http.get('http://localhost:3000', (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('HTTP Status Code:', res.statusCode);
    const hasTopMarketplaceLive = body.includes('Marketplace Live');
    console.log('Top "Marketplace Live" Strip Present?:', hasTopMarketplaceLive ? 'YES' : 'NO (Cleanly Removed)');
    const hasMainHeader = body.includes('Deliver To');
    console.log('Main MediRush Header Present?:', hasMainHeader ? 'YES' : 'NO');
  });
}).on('error', (e) => {
  console.error('Error fetching page:', e.message);
});
