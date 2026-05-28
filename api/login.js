const { send, readJSON, readStateRaw, verifyPassword, publicUser, publicState } = require("./_lib");

module.exports = async (req, res) => {
  try{
    if(req.method !== "POST") return send(res, 405, { ok:false, error:"Method Not Allowed" });
    const { id, password } = await readJSON(req);
    const state = await readStateRaw();
    const user = state?.users?.find((u) => u.id === String(id || "").trim());
    if(!user || !verifyPassword(user, password || "")) {
      return send(res, 401, { ok:false, error:"账号或密码错误" });
    }
    return send(res, 200, { ok:true, user:publicUser(user), state:publicState(state) });
  }catch(err){
    return send(res, 500, { ok:false, error:err.message });
  }
};
