import http from 'http';

function fetchHomepage() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  try {
    const result = await fetchHomepage();
    console.log('Status Code:', result.statusCode);
    console.log('Content-Type:', result.contentType);
    console.log('Body length:', result.body.length);
    console.log('Includes favicon:', result.body.includes('favicon'));
    
    // Find index of <head> and print the head content
    const headStart = result.body.indexOf('<head>');
    const headEnd = result.body.indexOf('</head>');
    if (headStart !== -1 && headEnd !== -1) {
      console.log('\n--- Head Content ---');
      console.log(result.body.substring(headStart, headEnd + 7));
    } else {
      console.log('Head tags not found in response, let us dump first 500 chars:');
      console.log(result.body.substring(0, 500));
    }
  } catch (error) {
    console.error('Error fetching homepage:', error);
  }
}

run();
