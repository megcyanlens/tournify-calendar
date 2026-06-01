document
  .getElementById('generate')
  .addEventListener('click', async () => {

    const url =
      document.getElementById('teamUrl').value;

    try {

      const response =
        await fetch(url);

      const html =
        await response.text();

      console.log(html.substring(0, 1000));

    } catch (error) {

      console.error(error);

    }

  });
