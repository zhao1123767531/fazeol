const { send } = require("./_lib");

module.exports = async (_req, res) => {
  return send(res, 403, { ok:false, error:"公开注册已关闭，请联系管理员创建账号" });
};
