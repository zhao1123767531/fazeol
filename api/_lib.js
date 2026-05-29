const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "state.json");
const uploadsDir = path.join("/tmp", "faze-uploads");
const usePostgres = Boolean(process.env.DATABASE_URL);
const useVercelBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
let pgPoolPromise = null;

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

const readJSON = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if(body.length > 10 * 1024 * 1024) {
      reject(new Error("请求内容过大"));
      req.destroy();
    }
  });
  req.on("end", () => {
    try{ resolve(body ? JSON.parse(body) : {}); }
    catch(err){ reject(err); }
  });
  req.on("error", reject);
});

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
  salt,
  passwordHash: crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex"),
});

const verifyPassword = (user, password) => {
  if(user.passwordHash && user.salt) {
    const hashed = hashPassword(password, user.salt).passwordHash;
    return crypto.timingSafeEqual(Buffer.from(hashed, "hex"), Buffer.from(user.passwordHash, "hex"));
  }
  return user.password === password;
};

const publicUser = (user) => {
  const { password, passwordHash, salt, ...safe } = user;
  return safe;
};

const applyStateDefaults = (state={}) => ({
  ...state,
  settings:{
    loginQuote:"法不阿贵，绳不挠曲。",
    loginQuoteSource:"《韩非子》",
    loginQuotes:[
      {text:"法不阿贵，绳不挠曲。", source:"《韩非子》"},
      {text:"徒善不足以为政，徒法不能以自行。", source:"《孟子》"},
      {text:"法律是治国之重器，良法是善治之前提。", source:""},
    ],
    termsTitle:"法泽在线用户条款",
    termsBody:"1. 平台账号由管理员统一创建，用户应妥善保管账号和密码，不得转借他人使用。\n2. 用户上传的课程资料、试卷、答卷、解析等内容应符合法律法规和教学管理要求。\n3. 考试期间应遵守考试规则，系统会记录开始答题、提交时间及延迟交卷等状态。\n4. 平台仅用于教学、训练和考试管理场景。未经授权，不得复制、传播课程内容或他人答卷。\n5. 继续登录即表示您已阅读、理解并同意遵守本条款。",
    ...(state.settings || {}),
  },
  classes: state.classes || [],
  users: state.users || [],
  exams: state.exams || [],
  courses: state.courses || [],
  liveSessions: state.liveSessions || [],
  submissions: state.submissions || [],
  grades: state.grades || [],
  messages: state.messages || [],
  courseQA: state.courseQA || [],
  examAttempts: state.examAttempts || [],
});

const publicState = (state) => ({
  ...applyStateDefaults(state || {}),
  users: (state?.users || []).map(publicUser),
});

const getPgPool = async () => {
  if(!pgPoolPromise) {
    pgPoolPromise = import("pg").then(({ Pool }) => new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized:false },
    }));
  }
  return pgPoolPromise;
};

const ensurePg = async () => {
  const pool = await getPgPool();
  await pool.query(`
    create table if not exists faze_kv (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  return pool;
};

const readLocalState = () => {
  if(!fs.existsSync(dataFile)) return null;
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
};

const writeLocalState = (state) => {
  fs.mkdirSync(dataDir, { recursive:true });
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
};

const readStateRaw = async () => {
  if(!usePostgres) return readLocalState();
  const pool = await ensurePg();
  const result = await pool.query("select value from faze_kv where key = $1", ["state"]);
  if(result.rows[0]?.value) return result.rows[0].value;
  const local = readLocalState();
  if(local) await writeStateRaw(local);
  return local;
};

const writeStateRaw = async (state) => {
  const clean = applyStateDefaults(state);
  if(!usePostgres) {
    writeLocalState(clean);
    return;
  }
  const pool = await ensurePg();
  await pool.query(
    `insert into faze_kv (key, value, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    ["state", JSON.stringify(clean)]
  );
};

const normalizeIncomingState = async (incoming) => {
  const existing = await readStateRaw() || {};
  const existingById = new Map((existing.users || []).map((u) => [u.id, u]));
  const normalized = applyStateDefaults(incoming);
  normalized.users = (incoming.users || []).map((user) => {
    const old = existingById.get(user.id);
    const next = { ...user };
    if(next.password) {
      Object.assign(next, hashPassword(next.password));
      delete next.password;
    } else if(old?.passwordHash && old?.salt) {
      next.passwordHash = old.passwordHash;
      next.salt = old.salt;
    } else {
      Object.assign(next, hashPassword(next.id));
    }
    return next;
  });
  return normalized;
};

const safeUploadName = (name) => {
  const base = path.basename(name || "upload.bin").replace(/[^\w.\-\u4e00-\u9fa5]+/g, "_");
  return base || "upload.bin";
};

const saveLocalUpload = (req, originalName) => new Promise((resolve, reject) => {
  fs.mkdirSync(uploadsDir, { recursive:true });
  const safeName = safeUploadName(originalName);
  const ext = path.extname(safeName);
  const stem = path.basename(safeName, ext);
  const storedName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${stem}${ext}`;
  const target = path.join(uploadsDir, storedName);
  const out = fs.createWriteStream(target);
  let size = 0;
  req.on("data", (chunk) => { size += chunk.length; });
  req.pipe(out);
  out.on("finish", () => resolve({
    name:safeName,
    storedName,
    size,
    type:req.headers["content-type"] || "application/octet-stream",
    url:`/api/file?name=${encodeURIComponent(storedName)}`,
    uploadedAt:Date.now(),
  }));
  out.on("error", reject);
  req.on("error", reject);
});

const saveBlobUpload = async (req, originalName) => {
  const { put } = await import("@vercel/blob");
  const safeName = safeUploadName(originalName);
  const pathname = `uploads/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName}`;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    chunks.push(chunk);
    size += chunk.length;
  }
  const body = Buffer.concat(chunks);
  const blob = await put(pathname, body, {
    access:"public",
    addRandomSuffix:false,
    contentType:req.headers["content-type"] || "application/octet-stream",
  });
  return {
    name:safeName,
    storedName:blob.pathname || pathname,
    size:size || Number(req.headers["content-length"] || 0),
    type:req.headers["content-type"] || "application/octet-stream",
    url:blob.url,
    uploadedAt:Date.now(),
    storage:"vercel-blob",
  };
};

const saveUpload = (req, originalName) => useVercelBlob ? saveBlobUpload(req, originalName) : saveLocalUpload(req, originalName);

module.exports = {
  dataFile,
  uploadsDir,
  send,
  readJSON,
  verifyPassword,
  publicUser,
  publicState,
  readStateRaw,
  writeStateRaw,
  normalizeIncomingState,
  saveUpload,
};
