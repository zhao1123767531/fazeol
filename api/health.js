const { send } = require("./_lib");

module.exports = async (_req, res) => {
  return send(res, 200, {
    ok:true,
    storage: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "temporary",
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
};
