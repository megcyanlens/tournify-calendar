document
  .getElementById('generate')
  .addEventListener('click', async () => {

    const url =
      document.getElementById('teamUrl').value;

    const html =
      await fetch(url)
        .then(r => r.text());

    console.log(
      html.includes('London Fire')
    );

    console.log(
      html.includes('Match')
    );

    console.log(
      html.includes('Stuttgart Scorpions')
    );

  });
