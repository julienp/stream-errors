const express = require("express");
const fetch = require("node-fetch");
const pump = require("pump");
const { pipeline, PassThrough } = require("stream");

const PORT = 8001;
const DOWNLOAD_URL = "https://www.gatsbyjs.com/index.html";

// Download a file and return the body as a stream that can be piped into
// another stream.
const getStream = () => {
  const stream = new PassThrough();
  fetch(DOWNLOAD_URL)
    .then((response) => {
      if (!response.ok) {
        const status = response.status;
        throw new Error(`Error in fetch: ${status}`);
      }
      return response.body;
    })
    .then((responseStream) => {
      pipeline(responseStream, stream, (error) => {
        if (error) {
          console.log(`getStream pipeline error handler: ${error.message}`, {
            error,
          });
        } else {
          console.log(`getStream pipeline succeeded`);
        }
      });
    })
    .catch((error) => {
      logger.error(`Error in download stream: ${error.message}`, {
        error,
      });
      stream.destroy(error);
    });
  return stream;
};

const app = express();

app.get("/:usePipeline", async (req, res) => {
  const usePipeline = req.params.usePipeline === "yes";
  const readStream = getStream();
  let timeout;
  try {
    await new Promise((resolve, reject) => {
      if (usePipeline) {
        console.log(`using pipeline`);
        pipeline(readStream, res, (error) => {
          if (error) {
            console.log(`pipeline error handler: ${error.message}`, { error });
            reject(error);
          } else {
            console.log(`pipeline succeeded`);
          }
        });
      } else {
        console.log(`not using pipeline`);
        readStream.pipe(res);
      }

      res.on("finish", () => {
        resolve();
      });
      if (!usePipeline) {
        readStream.on("error", (error) => {
          console.log(`readStream error handler: ${error.message}`, { error });
          // ⚠️ Bug: if we don't use pipeline, the stream does not get
          // destroyed and the client has no way of knowing that we
          // encountered an error, it will simply assume the stream ended.
          // Instead of using pipeline we could also manually handle the error
          // here and destroy the stream:
          //   res.destroy(error);
          reject(error);
        });
      }
      // By playing with the timeout duration, depending on the speed of your
      // connection you might see different body lengths returned by this
      // handler in the client.
      timeout = setTimeout(() => {
        readStream.destroy(new Error(`interrupted!`));
      }, 100);
    });
  } catch (error) {
    console.log(`Error in handler: ${error.message}`, { error });
    // We can not send a status of 500 here because the headers might already
    // have been flushed and the body might have started streaming.
    //   res.sendStatus(500)
    res.end();
  }
  clearTimeout(timeout);
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
