const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const LOGOS = {
  "TikTok":          "https://www.google.com/s2/favicons?domain=tiktok.com&sz=128",
  "Instagram":       "https://www.google.com/s2/favicons?domain=instagram.com&sz=128",
  "Signal":          "https://www.google.com/s2/favicons?domain=signal.org&sz=128",
  "Spotify":         "https://www.google.com/s2/favicons?domain=spotify.com&sz=128",
  "X-Twitter":       "https://www.google.com/s2/favicons?domain=x.com&sz=128",
  "WhatsApp":        "https://www.google.com/s2/favicons?domain=whatsapp.com&sz=128",
  "McDonalds":       "https://www.google.com/s2/favicons?domain=mcdonalds.com&sz=128",
  "Chipotle":        "https://www.google.com/s2/favicons?domain=chipotle.com&sz=128",
  "Starbucks":       "https://www.google.com/s2/favicons?domain=starbucks.com&sz=128",
  "Marriott":        "https://www.google.com/s2/favicons?domain=marriott.com&sz=128",
  "Airbnb":          "https://www.google.com/s2/favicons?domain=airbnb.com&sz=128",
  "Spirit-Airlines": "https://www.google.com/s2/favicons?domain=spirit.com&sz=128",
  "Emirates":        "https://www.google.com/s2/favicons?domain=emirates.com&sz=128",
  "Southwest":       "https://www.google.com/s2/favicons?domain=southwest.com&sz=128",
  "Netflix":         "https://www.google.com/s2/favicons?domain=netflix.com&sz=128",
  "YouTube":         "https://www.google.com/s2/favicons?domain=youtube.com&sz=128",
  "Chase":           "https://www.google.com/s2/favicons?domain=chase.com&sz=128",
  "Chime":           "https://www.google.com/s2/favicons?domain=chime.com&sz=128",
  "Uber":            "https://www.google.com/s2/favicons?domain=uber.com&sz=128",
  "Amazon":          "https://www.google.com/s2/favicons?domain=amazon.com&sz=128",
  "Apple":           "https://www.google.com/s2/favicons?domain=apple.com&sz=128",
  "Google":          "https://www.google.com/s2/favicons?domain=google.com&sz=128",
  "Facebook":        "https://www.google.com/s2/favicons?domain=facebook.com&sz=128",
  "Snapchat":        "https://www.google.com/s2/favicons?domain=snapchat.com&sz=128",
  "DoorDash":        "https://www.google.com/s2/favicons?domain=doordash.com&sz=128",
  "Uber-Eats":       "https://www.google.com/s2/favicons?domain=ubereats.com&sz=128",
  "PayPal":          "https://www.google.com/s2/favicons?domain=paypal.com&sz=128",
  "Robinhood":       "https://www.google.com/s2/favicons?domain=robinhood.com&sz=128",
  "Coinbase":        "https://www.google.com/s2/favicons?domain=coinbase.com&sz=128",
  "Delta":           "https://www.google.com/s2/favicons?domain=delta.com&sz=128",
  "American-Airlines":"https://www.google.com/s2/favicons?domain=aa.com&sz=128",
  "Hilton":          "https://www.google.com/s2/favicons?domain=hilton.com&sz=128",
  "Booking-com":     "https://www.google.com/s2/favicons?domain=booking.com&sz=128",
  "Disney-Plus":     "https://www.google.com/s2/favicons?domain=disneyplus.com&sz=128",
  "HBO-Max":         "https://www.google.com/s2/favicons?domain=max.com&sz=128",
  "Hulu":            "https://www.google.com/s2/favicons?domain=hulu.com&sz=128",
  "Bank-of-America": "https://www.google.com/s2/favicons?domain=bankofamerica.com&sz=128",
  "Wells-Fargo":     "https://www.google.com/s2/favicons?domain=wellsfargo.com&sz=128",
};

const outputDir = path.join(__dirname, '..', 'public', 'logos');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  console.log('\n Downloading logos...\n');
  for (const [name, url] of Object.entries(LOGOS)) {
    const dest = path.join(outputDir, name + '.png');
    try {
      await download(url, dest);
      console.log('OK ' + name);
    } catch (e) {
      console.log('FAIL ' + name + ' - ' + e.message);
    }
  }
  console.log('\nDone! Check public/logos/\n');
}

main();
