const fs = require('fs');
async function scrape() {
  try {
    const urls = [];
    for (let page = 1; page <= 4; page++) {
      const url = `https://unsplash.com/napi/search/photos?query=pristine%20uninhabited%20tropical%20island%20ocean%20landscape%20beach&per_page=30&page=${page}`;
      const response = await fetch(url);
      const data = await response.json();
      data.results.forEach(img => {
          urls.push(`'${img.urls.regular.split('?')[0]}?q=80&w=800'`);
      });
    }
    fs.writeFileSync('output.txt', urls.slice(0, 109).join(',\n'));
    console.log(`Scraped ${urls.length} images!`);
  } catch (err) {
    console.error(err);
  }
}
scrape();
