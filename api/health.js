const { send } = require("./_lib");

module.exports = async (_req, res) => {
  return send(res, 200, { ok:true });
};
