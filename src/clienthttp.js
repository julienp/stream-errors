const http = require("http");

const args = process.argv.slice(2);
const usePipeline = args[0] === "yes";

const options = {
  method: "GET",
  hostname: "localhost",
  port: 8001,
  path: usePipeline ? "/yes" : "/no",
};

const req = http.request(options, (res) => {
  const status = res.statusCode;
  const chunks = [];
  res.setEncoding("utf8");
  res.on("data", (chunk) => {
    chunks.push(chunk);
  });
  res.on("aborted", () => console.error(`res aborted`));
  res.on("socket", () => console.error(`res socket`));
  res.on("response", () => console.error(`res response`));
  res.on("close", () => console.error(`res close`));
  res.on("error", () => console.error(`res error`));
  res.on("end", () => {
    const text = chunks.join("");
    const length = text.length;
    const end = text.slice(text.length - 10);
    console.log({ status, length, end });
  });
});
req.on("error", (error) => {
  console.error(`Error in request: ${error.message}`, { error });
});
req.end();
