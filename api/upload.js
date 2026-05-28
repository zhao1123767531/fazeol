const { send, saveUpload } = require("./_lib");

module.exports = async (req, res) => {
  try{
    if(req.method !== "POST") return send(res, 405, { ok:false, error:"Method Not Allowed" });
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const file = await saveUpload(req, url.searchParams.get("filename"));
    return send(res, 201, { ok:true, file });
  }catch(err){
    return send(res, 500, { ok:false, error:err.message });
  }
};
