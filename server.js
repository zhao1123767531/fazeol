const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "state.json");
const uploadsDir = path.join(root, "uploads");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const usePostgres = Boolean(process.env.DATABASE_URL);
const useVercelBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
let pgPoolPromise = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jsx": "text/babel; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
};

const send = (res, status, body, type = "application/json; charset=utf-8") => {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if(body.length > 10 * 1024 * 1024) {
      reject(new Error("请求内容过大"));
      req.destroy();
    }
  });
  req.on("end", () => resolve(body));
  req.on("error", reject);
});

const readJSON = async (req) => {
  const raw = await readBody(req);
  return raw ? JSON.parse(raw) : {};
};

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

const applyStateDefaults = (state) => ({
  ...state,
  settings:{
    loginQuote:"法不阿贵，绳不挠曲。",
    loginQuoteSource:"《韩非子》",
    ...(state?.settings || {}),
  },
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
  if(!usePostgres) {
    writeLocalState(state);
    return;
  }
  const pool = await ensurePg();
  await pool.query(
    `insert into faze_kv (key, value, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    ["state", JSON.stringify(state)]
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

const parsePath = (req) => new URL(req.url, `http://${req.headers.host || "localhost"}`);

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

  req.on("data", (chunk) => {
    size += chunk.length;
    if(size > 1024 * 1024 * 1024) {
      out.destroy();
      reject(new Error("文件不能超过 1GB"));
      req.destroy();
    }
  });
  req.pipe(out);
  out.on("finish", () => resolve({
    name: safeName,
    storedName,
    size,
    type: req.headers["content-type"] || "application/octet-stream",
    url: `/uploads/${encodeURIComponent(storedName)}`,
    uploadedAt: Date.now(),
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
    size,
    type:req.headers["content-type"] || "application/octet-stream",
    url:blob.url,
    uploadedAt:Date.now(),
    storage:"vercel-blob",
  };
};

const saveUpload = (req, originalName) => {
  if(useVercelBlob) return saveBlobUpload(req, originalName);
  return saveLocalUpload(req, originalName);
};

const api = async (req, res) => {
  const url = parsePath(req);

  if(url.pathname === "/api/health") {
    send(res, 200, JSON.stringify({ ok:true }));
    return true;
  }

  if(url.pathname === "/api/login" && req.method === "POST") {
    const { id, password } = await readJSON(req);
    const state = await readStateRaw();
    const user = state?.users?.find((u) => u.id === String(id || "").trim());
    if(!user || !verifyPassword(user, password || "")) {
      send(res, 401, JSON.stringify({ ok:false, error:"账号或密码错误" }));
      return true;
    }
    send(res, 200, JSON.stringify({ ok:true, user:publicUser(user), state:publicState(state) }));
    return true;
  }

  if(url.pathname === "/api/register" && req.method === "POST") {
    send(res, 403, JSON.stringify({ ok:false, error:"公开注册已关闭，请联系管理员创建账号" }));
    return true;
  }

  if(url.pathname === "/api/change-password" && req.method === "POST") {
    const { userId, oldPassword, newPassword } = await readJSON(req);
    const state = await readStateRaw();
    const user = state?.users?.find((u) => u.id === userId);
    if(!user || !verifyPassword(user, oldPassword || "")) {
      send(res, 401, JSON.stringify({ ok:false, error:"当前密码不正确" }));
      return true;
    }
    if(String(newPassword || "").length < 6) {
      send(res, 400, JSON.stringify({ ok:false, error:"新密码至少 6 位" }));
      return true;
    }
    Object.assign(user, hashPassword(newPassword));
    delete user.password;
    user.firstLogin = false;
    await writeStateRaw(state);
    send(res, 200, JSON.stringify({ ok:true, user:publicUser(user), state:publicState(state) }));
    return true;
  }

  if(url.pathname === "/api/upload" && req.method === "POST") {
    const file = await saveUpload(req, url.searchParams.get("filename"));
    send(res, 201, JSON.stringify({ ok:true, file }));
    return true;
  }

  if(url.pathname !== "/api/state") return false;

  if(req.method === "GET") {
    const state = await readStateRaw();
    if(!state) {
      send(res, 200, "{}");
      return true;
    }
    await writeStateRaw(await normalizeIncomingState(state));
    send(res, 200, JSON.stringify(publicState(await readStateRaw())));
    return true;
  }

  if(req.method === "PUT") {
    try {
      const parsed = await readJSON(req);
      await writeStateRaw(await normalizeIncomingState(parsed));
      send(res, 200, JSON.stringify({ ok:true, savedAt:Date.now() }));
    } catch (err) {
      send(res, 400, JSON.stringify({ ok:false, error:err.message }));
    }
    return true;
  }

  send(res, 405, JSON.stringify({ ok:false, error:"Method Not Allowed" }));
  return true;
};

const serveStatic = (req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath === "/" ? "index.html" : safePath);
  if(filePath.startsWith(dataDir)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  if(!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not Found", "text/plain; charset=utf-8");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const headers = {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
  };
  if(filePath.startsWith(uploadsDir)) headers["Content-Disposition"] = "inline";
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  try {
    if(await api(req, res)) return;
    serveStatic(req, res);
  } catch (err) {
    send(res, 500, JSON.stringify({ ok:false, error:err.message }));
  }
});

server.on("error", (err) => {
  if(err.code === "EADDRINUSE") {
    console.error(`端口 ${port} 已被占用，请用 PORT=其他端口 npm start 启动。`);
    process.exit(1);
  }
  throw err;
});

server.listen(port, host, () => {
  console.log(`法泽在线已启动：http://localhost:${port}`);
  console.log(`数据文件：${dataFile}`);
});
