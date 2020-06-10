const fetch = require("node-fetch");

const args = process.argv.slice(2);
const usePipeline = args[0] === "yes";

fetch(`http://localhost:8001/${usePipeline ? "yes" : "no"}`)
  .then(async (response) => {
    const status = response.status;
    try {
      const text = await response.text();
      const length = text.length;
      const end = text.slice(text.length - 10);
      console.log({ status, length, end });
    } catch (error) {
      console.log(`Error reading response ${error.message}`, { error });
    }
  })
  .catch((error) => {
    console.log(`fetch error: ${error.message}`, { error });
  });
