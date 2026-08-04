const url = 'http://localhost:5000/api/auth/email/forgot-password';
const data = { email: 'ankitkalbhor3@gmail.com' };

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });

    console.log('STATUS', res.status, res.statusText);
    console.log('BODY', await res.text());
  } catch (err) {
    console.error('FETCH ERROR', err);
    process.exit(1);
  }
})();
