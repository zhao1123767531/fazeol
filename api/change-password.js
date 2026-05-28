const { send, readJSON, readStateRaw, writeStateRaw, verifyPassword, publicUser, publicState } = require("./_lib");
const crypto = require("crypto");

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
  salt,
  passwordHash: crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex"),
});

module.exports = async (req, res) => {
  try{
    if(req.method !== "POST") return send(res, 405, { ok:false, error:"Method Not Allowed" });
    const { userId, oldPassword, newPassword } = await readJSON(req);
    const state = await readStateRaw();
    const user = state?.users?.find((u) => u.id === userId);
    if(!user || !verifyPassword(user, oldPassword || "")) {
      return send(res, 401, { ok:false, error:"当前密码不正确" });
    }
    if(String(newPassword || "").length < 6) {
      return send(res, 400, { ok:false, error:"新密码至少 6 位" });
    }
    Object.assign(user, hashPassword(newPassword));
    delete user.password;
    user.firstLogin = false;
    await writeStateRaw(state);
    return send(res, 200, { ok:true, user:publicUser(user), state:publicState(state) });
  }catch(err){
    return send(res, 500, { ok:false, error:err.message });
  }
};
