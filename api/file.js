const fs = require("fs");
const path = require("path");
const { send, uploadsDir } = require("./_lib");

module.exports = async (req, res) => {
  try{
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const name = path.basename(url.searchParams.get("name") || "");
    const filePath = path.join(uploadsDir, name);
    if(!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
      return send(res, 404, { ok:false, error:"File not found" });
    }
    fs.createReadStream(filePath).pipe(res);
  }catch(err){
    return send(res, 500, { ok:false, error:err.message });
  }
};
