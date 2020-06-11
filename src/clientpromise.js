const http = require("http");
const fs = require("fs");
const url = require("url");
const path = require("path");

const args = process.argv.slice(2);
const usePipeline = args[0] === "yes";
const DOWNLOAD_URL = `http://localhost:8001/${usePipeline ? "yes" : "no"}`;

const agent = new http.Agent({
  maxSockets: 50,
  maxFreeSockets: 20,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

async function pipeURL(destination) {
  const { hostname, port, path } = url.parse(DOWNLOAD_URL);
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      agent,
    };
    const req = http.get(options, (res) => {
      const { statusCode } = res;
      if (statusCode < 200 || statusCode > 299) {
        const error = new Error(
          `Request Failed with status code: ${statusCode}`
        );
        // Consume response data to free up memory
        res.resume();
        reject(error);
      }
      // On Node 13+ and up we can use `stream.pipeline(res, destination)` instead.
      res
        .on("error", reject)
        // If we have started receving a response and the response stream
        // is interrupted, we only get the `aborted` signal and no error.
        .on("aborted", () => reject(new Error("premature close")))
        .pipe(destination)
        .on("error", reject)
        .on("finish", resolve);
    });
    req.on(`error`, (error) => {
      reject(error);
    });
  });
}

const FILE_PATH = path.resolve(__dirname, "download.txt");
const writeStream = fs.createWriteStream(FILE_PATH, { encoding: "utf-8" });

pipeURL(writeStream)
  .then(async () => {
    const text = fs.readFileSync(FILE_PATH).toString("utf-8");
    const length = text.length;
    const end = String(text).slice(text.length - 10);
    console.log(`success`, { length, end });
  })
  .catch((error) => {
    console.log(`caught error: ${error.message}`, { error });
  });
