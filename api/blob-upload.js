const { send, readJSON } = require("./_lib");

module.exports = async (req, res) => {
  try{
    if(req.method !== "POST") return send(res, 405, { ok:false, error:"Method Not Allowed" });
    if(!process.env.BLOB_READ_WRITE_TOKEN) {
      return send(res, 400, { ok:false, error:"BLOB_READ_WRITE_TOKEN 未配置，无法上传视频文件" });
    }

    const { handleUpload } = await import("@vercel/blob/client");
    const body = await readJSON(req);
    const jsonResponse = await handleUpload({
      body,
      request:req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes:["video/mp4", "video/quicktime", "video/webm", "application/pdf", "image/jpeg", "image/png", "image/webp", "application/octet-stream"],
        addRandomSuffix:true,
        tokenPayload:JSON.stringify({ createdAt:Date.now() }),
      }),
      onUploadCompleted: async () => {},
    });
    return send(res, 200, jsonResponse);
  }catch(err){
    return send(res, 400, { ok:false, error:err.message || "上传失败" });
  }
};
