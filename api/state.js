const { send, readStateRaw, writeStateRaw, publicState, normalizeIncomingState } = require("./_lib");

module.exports = async (req, res) => {
  try{
    if(req.method === "GET") {
      const state = await readStateRaw();
      if(!state) return send(res, 200, {});
      const normalized = await normalizeIncomingState(state);
      await writeStateRaw(normalized);
      return send(res, 200, publicState(normalized));
    }
    if(req.method === "PUT") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      await writeStateRaw(await normalizeIncomingState(parsed));
      return send(res, 200, { ok:true, savedAt:Date.now() });
    }
    return send(res, 405, { ok:false, error:"Method Not Allowed" });
  }catch(err){
    return send(res, 500, { ok:false, error:err.message });
  }
};
