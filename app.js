document
  .getElementById('generateBtn')
  .addEventListener('click', async () => {

    const url =
      document.getElementById('teamUrl').value;

    const parts =
      url.split('/');

    const liveLink =
      parts[4];

    const teamId =
      parts[6];

    console.log({
      liveLink,
      teamId
    });

});
