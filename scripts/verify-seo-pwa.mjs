async function verify() {
  console.log('--- Checking Product JSON-LD ---');
  const res = await fetch('http://localhost:3000/product/royal-emerald-embroidered-kurta');
  const html = await res.text();
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (match) {
    const json = JSON.parse(match[1]);
    console.log('✓ Found valid Product JSON-LD:');
    console.log('  @type:', json['@type']);
    console.log('  name:', json.name);
    console.log('  brand:', json.brand?.name);
    console.log('  offers.price:', json.offers?.price, json.offers?.priceCurrency);
    console.log('  offers.availability:', json.offers?.availability);
    console.log('  offers.url:', json.offers?.url);
    console.log('  itemCondition:', json.offers?.itemCondition);
  } else {
    console.log('✗ JSON-LD script tag not found');
  }

  console.log('\n--- Checking Manifest Link in <head> ---');
  const hasManifestLink = html.includes('rel="manifest"') || html.includes('manifest.webmanifest');
  console.log('✓ Manifest in head:', hasManifestLink);

  console.log('\n--- Checking Canonical Link in <head> ---');
  const hasCanonical = html.includes('rel="canonical"') || html.includes('canonical');
  console.log('✓ Canonical in head:', hasCanonical);

  console.log('\n--- Checking OpenGraph Meta Tags ---');
  const hasOgTitle = html.includes('property="og:title"');
  const hasOgImage = html.includes('property="og:image"');
  console.log('✓ og:title:', hasOgTitle, '| og:image:', hasOgImage);
}

verify().catch(console.error);

