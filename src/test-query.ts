import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function main() {
  try {
    const { initializeApp: initializeClientApp } = await import('firebase/app');
    const { getAuth: getClientAuth, signInWithEmailAndPassword } = await import('firebase/auth');

    console.log('Firebase Config loaded. ProjectId:', firebaseConfig.projectId);

    const clientApp = initializeClientApp(firebaseConfig, 'test-query-diagnostic');
    const clientAuth = getClientAuth(clientApp);

    const email = 'server-agent@app.com';
    const password = 'ServerAgentSuperSecretPassword123!';

    const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
    const idToken = await userCredential.user.getIdToken();
    console.log('ID Token retrieved.');

    // Run the sharedWithEmails query directly via REST
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'files' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'sharedWithEmails' },
            op: 'ARRAY_CONTAINS',
            value: { stringValue: 'test@example.com' } // any email
          }
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(body)
    });

    console.log('runQuery Response Status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Test query diagnostic error:', err);
  }
}

main();
