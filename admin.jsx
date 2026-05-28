/* ============ 法泽在线 — 管理员端 ============ */

const Admin = ({ state, setState, toast, me, doLogout }) => {
  const [view, setView] = React.useState("dashboard");
  const [showProfile, setShowProfile] = React.useState(false);
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">法泽<span className="tag-em">FA · ZE · ONLINE</span></div>
        <div className="section">控制台</div>
        <NavItem id="dashboard" cur={view} set={setView} label="概览" />
        <div className="section">教务</div>
        <NavItem id="accounts" cur={view} set={setView} label="账号管理" />
        <NavItem id="exams" cur={view} set={setView} label="考试管理" />
        <NavItem id="courses" cur={view} set={setView} label="课程管理" />
        <NavItem id="schedule" cur={view} set={setView} label="课表总览" />
        <NavItem id="broadcast" cur={view} set={setView} label="站内公告" />
        <div className="section">系统</div>
        <NavItem id="settings" cur={view} set={setView} label="系统设置" />

        <div className="me me-clickable" onClick={()=>setShowProfile(true)} title="个人设置">
          <div className="avatar">{me.name[0]}</div>
          <div>
            <div className="name">{me.name}</div>
            <div className="role">管理员</div>
          </div>
          <span className="gear">⚙</span>
          <div className="logout" onClick={(e)=>{e.stopPropagation(); doLogout();}}>登出</div>
        </div>
      </aside>
      <main className="main">
        {view === "dashboard" && <AdminDashboard state={state} setView={setView} />}
        {view === "accounts" && <AdminAccounts state={state} setState={setState} toast={toast} />}
        {view === "exams" && <AdminExams state={state} setState={setState} toast={toast} me={me} />}
        {view === "schedule" && <Schedule state={state} setState={setState} toast={toast} me={me} canManage={true} />}
        {view === "courses" && <Courses state={state} setState={setState} toast={toast} me={me} canManage={true} />}
        {view === "broadcast" && <AdminBroadcast state={state} setState={setState} toast={toast} />}
        {view === "settings" && <AdminSettings state={state} setState={setState} toast={toast} />}
      </main>

      {showProfile && <ProfileModal me={me} state={state} setState={setState} toast={toast} onClose={()=>setShowProfile(false)} />}
    </div>);

};

const NavItem = ({ id, cur, set, label, badge }) =>
<div className={"nav-item" + (cur === id ? " active" : "")} onClick={() => set(id)}>
    <span>{label}</span>
    {badge ? <span className="badge">{badge}</span> : cur === id && <span className="dot"></span>}
  </div>;


// ============ 概览 ============
const AdminDashboard = ({ state, setView }) => {
  const students = state.users.filter((u) => u.role === "student").length;
  const teachers = state.users.filter((u) => u.role === "teacher").length;
  const openExams = state.exams.filter((e) => examStatus(e) === "open").length;
  const pendingGrades = (() => {
    let n = 0;
    state.exams.forEach((e) => {
      const subs = state.submissions.filter((s) => s.examId === e.id);
      e.questions.forEach((q) => {
        subs.forEach((s) => {
          if (!state.grades.find((g) => g.examId === e.id && g.qid === q.id && g.studentId === s.studentId)) n++;
        });
      });
    });
    return n;
  })();

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Admin · Overview</div>
          <h1>欢迎回来，系统管理员</h1>
        </div>
      </div>

      <div className="grid cols-4 mb-24">
        <StatCard label="学生账号" value={students} />
        <StatCard label="教师账号" value={teachers} />
        <StatCard label="进行中考试" value={openExams} accent />
        <StatCard label="待批改答卷" value={pendingGrades} />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="card-head"><h3>最近考试</h3><div className="hint">共 {state.exams.length} 场</div></div>
          {state.exams.slice(0, 4).map((e) =>
          <div key={e.id} className="row between" style={{ padding: "10px 0", borderBottom: "1px solid var(--ink-100)" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{e.title}</div>
                <div className="muted tiny">{fmtTime(e.startTime)} → {fmtTime(e.endTime)}</div>
              </div>
              <Tag kind={statusTagClass(examStatus(e))}>{statusLabel(examStatus(e))}</Tag>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h3>快捷操作</h3></div>
          <div className="col">
            <button className="btn ghost" onClick={() => setView("accounts")}>批量导入账号 →</button>
            <button className="btn ghost" onClick={() => setView("exams")}>发布新考试 →</button>
            <button className="btn ghost" onClick={() => setView("courses")}>管理课程 →</button>
            <button className="btn ghost" onClick={() => setView("broadcast")}>发布站内公告 →</button>
          </div>
        </div>
      </div>
    </div>);

};

const StatCard = ({ label, value, accent }) =>
<div className="card" style={{ padding: "18px 20px" }}>
    <div className="tiny muted" style={{ letterSpacing: ".15em" }}>{label.toUpperCase()}</div>
    <div style={{ fontFamily: "var(--serif)", fontSize: 36, marginTop: 6, color: accent ? "var(--accent)" : "var(--ink-900)" }}>
      {value}
    </div>
  </div>;


// ============ 账号管理 ============
const AdminAccounts = ({ state, setState, toast }) => {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [showImport, setShowImport] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);

  const filtered = state.users.filter((u) => {
    if (u.id === "admin") return false;
    if (filter !== "all" && u.role !== filter) return false;
    if (search && !(u.id.includes(search) || u.name.includes(search))) return false;
    return true;
  });

  const downloadTemplate = () => {
    // 提供 CSV（兼容 xlsx 打开）和真正 xlsx 两个版本——这里输出 CSV 模板
    const rows = [
    ["账号", "姓名", "角色（student/teacher）", "班级（学生选填）"],
    ["S2024010", "王某某", "student", "法学2403"],
    ["T010", "李某某", "teacher", ""]];

    const csv = "\ufeff" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;a.download = "账号导入模板.csv";a.click();
    URL.revokeObjectURL(url);
    toast("模板已下载（CSV 格式，可用 Excel/WPS 打开）", "ok");
  };

  const onImport = (rows) => {
    const next = { ...state };
    let added = 0,skipped = 0;
    rows.forEach((r) => {
      if (!r.id || !r.name || !r.role) return;
      if (next.users.find((u) => u.id === r.id)) {skipped++;return;}
      next.users.push({
        id: r.id, name: r.name, role: r.role,
        password: r.id, firstLogin: true, className: r.className || ""
      });
      added++;
    });
    setState(next);
    toast(`已导入 ${added} 个账号${skipped ? `，跳过 ${skipped} 个重复` : ""}`, "ok");
  };

  const removeUser = (id) => {
    if (!confirm(`确认删除账号 ${id}？`)) return;
    setState({ ...state, users: state.users.filter((u) => u.id !== id) });
    toast("已删除");
  };

  const resetPwd = (id) => {
    setState({
      ...state,
      users: state.users.map((u) => u.id === id ? { ...u, password: u.id, firstLogin: true } : u)
    });
    toast(`已重置 ${id} 的密码（初始密码＝账号）`, "ok");
  };

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Admin · Accounts</div>
          <h1>账号管理</h1>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={downloadTemplate}>下载导入模板</button>
          <button className="btn ghost" onClick={() => setShowImport(true)}>批量导入</button>
          <button className="btn" onClick={() => setShowManual(true)}>＋ 管理员添加账号</button>
        </div>
      </div>

      <div className="card">
        <div className="row between mb-16">
          <div className="tabs" style={{ margin: 0, border: "none" }}>
            {[["all", "全部"], ["student", "学生"], ["teacher", "教师"]].map(([k, v]) =>
            <div key={k} className={"tab" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>
                {v}（{k === "all" ? state.users.filter((u) => u.id !== "admin").length : state.users.filter((u) => u.role === k).length}）
              </div>
            )}
          </div>
          <input className="input" style={{ maxWidth: 240 }} placeholder="搜索账号或姓名…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>账号</th><th>姓名</th><th>角色</th><th>班级</th><th>密码状态</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan="6"><Empty title="暂无账号" hint="点击右上角批量导入或手动添加" /></td></tr>}
            {filtered.map((u) =>
            <tr key={u.id}>
                <td className="mono">{u.id}</td>
                <td>{u.name}</td>
                <td><Tag kind={u.role === "teacher" ? "accent" : ""}>{u.role === "teacher" ? "教师" : "学生"}</Tag></td>
                <td className="muted">{u.className || "—"}</td>
                <td>{u.firstLogin ? <Tag kind="warn">待首次修改</Tag> : <Tag kind="ok">已设置</Tag>}</td>
                <td className="right">
                  <button className="btn subtle sm" onClick={() => resetPwd(u.id)}>重置密码</button>
                  <button className="btn danger sm" style={{ marginLeft: 6 }} onClick={() => removeUser(u.id)}>删除</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={onImport} toast={toast} />}
      {showManual && <ManualAddModal onClose={() => setShowManual(false)} onAdd={(u) => {
        if (state.users.find((x) => x.id === u.id)) {toast("账号已存在", "danger");return false;}
        const clean = {
          id:u.id.trim(),
          name:u.name.trim(),
          role:u.role,
          password:u.id.trim(),
          firstLogin:true,
          className:u.role === "student" ? (u.className || "") : "",
          subject:u.role === "teacher" ? (u.subject || "") : "",
        };
        setState({ ...state, users: [...state.users, clean] });
        toast("已添加", "ok");
        return true;
      }} />}
    </div>);

};

const ImportModal = ({ onClose, onImport, toast }) => {
  const [text, setText] = React.useState("");
  const [parsed, setParsed] = React.useState([]);
  const fileRef = React.useRef();

  const parseText = (t) => {
    const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const out = [];
    lines.forEach((ln, i) => {
      // 跳过表头
      if (i === 0 && /账号|学号|工号|id|姓名|name/i.test(ln) && !/^S\d/.test(ln) && !/^T\d/.test(ln)) return;
      const parts = ln.split(/[,，\t]/).map((s) => s.trim().replace(/^"|"$/g, ""));
      if (parts.length < 2) return;
      const [id, name, role, cls] = parts;
      out.push({ id, name, role: role || "student", className: cls || "" });
    });
    setParsed(out);
  };

  const onFile = async (f) => {
    if (!f) return;
    // 用 SheetJS 解析 xlsx；CSV/txt 直接读
    if (/\.xlsx?$/i.test(f.name) && window.XLSX) {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_csv(ws);
      setText(data);
      parseText(data);
    } else {
      const t = await f.text();
      setText(t);
      parseText(t);
    }
  };

  return (
    <Modal onClose={onClose} title="批量导入账号" wide
    foot={<>
        <button className="btn ghost" onClick={onClose}>取消</button>
        <button className="btn" disabled={parsed.length === 0} onClick={() => {onImport(parsed);onClose();}}>导入 {parsed.length} 条</button>
      </>}>
      <div className="col">
        <div>
          <div className="muted tiny mb-8">支持 xlsx / csv 文件上传，或直接粘贴。表头：账号 / 姓名 / 角色 / 班级</div>
          <div className="row">
            <button className="btn ghost sm" onClick={() => fileRef.current.click()}>选择文件</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" style={{ display: "none" }}
            onChange={(e) => onFile(e.target.files[0])} />
            <span className="muted tiny">或在下方文本框粘贴</span>
          </div>
        </div>
        <textarea className="textarea" style={{ minHeight: 160, fontFamily: "var(--mono)", fontSize: 12 }}
        placeholder={"账号,姓名,角色,班级\nS2024010,王某某,student,法学2403\nT010,李某某,teacher,"}
        value={text} onChange={(e) => {setText(e.target.value);parseText(e.target.value);}} />

        {parsed.length > 0 &&
        <div className="card flat" style={{ padding: 0, maxHeight: 200, overflow: "auto" }}>
            <table className="tbl">
              <thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>班级</th></tr></thead>
              <tbody>
                {parsed.map((r, i) =>
              <tr key={i}><td className="mono">{r.id}</td><td>{r.name}</td>
                    <td><Tag kind={r.role === "teacher" ? "accent" : ""}>{r.role === "teacher" ? "教师" : "学生"}</Tag></td>
                    <td className="muted">{r.className || "—"}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
        <div className="muted tiny">导入后所有新账号的初始密码即账号本身，首次登录会强制修改。</div>
      </div>
    </Modal>);

};

const ManualAddModal = ({ onClose, onAdd }) => {
  const [u, setU] = React.useState({ id: "", name: "", role: "student", className: "", subject:"" });
  return (
    <Modal onClose={onClose} title="管理员添加账号"
    foot={<>
        <button className="btn ghost" onClick={onClose}>取消</button>
        <button className="btn" disabled={!u.id || !u.name} onClick={() => {if (onAdd(u)) onClose();}}>添加</button>
      </>}>
      <div className="grid cols-2">
        <div className="field"><label>账号（学号/工号）</label>
          <input className="input" value={u.id} onChange={(e) => setU({ ...u, id: e.target.value })} placeholder="如 S2024010" /></div>
        <div className="field"><label>姓名</label>
          <input className="input" value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} /></div>
        <div className="field"><label>角色</label>
          <select className="select" value={u.role} onChange={(e) => setU({ ...u, role: e.target.value })}>
            <option value="student">学生</option>
            <option value="teacher">教师</option>
          </select></div>
        {u.role === "student" ? (
          <div className="field"><label>班级（学生选填）</label>
            <input className="input" value={u.className} onChange={(e) => setU({ ...u, className: e.target.value })} /></div>
        ) : (
          <div className="field"><label>学科（教师必填）</label>
            <input className="input" value={u.subject} onChange={(e) => setU({ ...u, subject: e.target.value })} placeholder="如 民法、刑法" /></div>
        )}
      </div>
      <div className="muted tiny">公开注册已关闭。学生和教师账号均只能由管理员创建；教师账号创建后才有上传课程和发布考试权限。</div>
    </Modal>);

};

// ============ 考试管理 ============
const AdminExams = ({ state, setState, toast, me }) => {
  const [editing, setEditing] = React.useState(null);

  const openNew = () => setEditing({
    id: uid("E"),
    title: "", subject: "", notice: "",
    questions: [{ id: "Q1", title: "第一题", maxScore: 20 }],
    startTime: Date.now() + 1000 * 60 * 60 * 24,
    endTime: Date.now() + 1000 * 60 * 60 * 24 * 3,
    paperFile: null, publicRanking: true, realMode: false, duration: 120,
    createdBy: "admin", graders: [],
    _new: true
  });

  const saveExam = (exam) => {
    const next = { ...state };
    const idx = next.exams.findIndex((e) => e.id === exam.id);
    const clean = { ...exam }; delete clean._new;
    if (idx >= 0) next.exams[idx] = clean;
    else next.exams.unshift(clean);
    setState(next);
    toast(exam._new ? "考试已创建" : "已保存", "ok");
    setEditing(null);
  };

  const removeExam = (id) => {
    if (!confirm("删除该考试将同时清除其提交与批改记录，是否继续？")) return;
    setState({
      ...state,
      exams: state.exams.filter((e) => e.id !== id),
      submissions: state.submissions.filter((s) => s.examId !== id),
      grades: state.grades.filter((g) => g.examId !== id),
    });
    toast("已删除");
  };

  const nameOf = (uid)=> state.users.find(u=>u.id===uid)?.name || uid;

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Admin · Exams</div>
          <h1>考试管理</h1>
        </div>
        <div className="actions">
          <button className="btn" onClick={openNew}>＋ 发布新考试</button>
        </div>
      </div>

      <div className="grid cols-2">
        {state.exams.map((e) => {
          const st = examStatus(e);
          const subs = state.submissions.filter((s) => s.examId === e.id).length;
          const grades = state.grades.filter((g) => g.examId === e.id).length;
          const totalGrades = subs * e.questions.length;
          return (
            <div key={e.id} className="card">
              <div className="row between mb-8">
                <div className="row gap-8">
                  <Tag kind={statusTagClass(st)}>{statusLabel(st)}</Tag>
                  {e.realMode && <Tag kind="accent">全真模拟</Tag>}
                </div>
                <span className="muted tiny mono">{e.id}</span>
              </div>
              <h3>{e.title || "（未命名）"}</h3>
              <div className="muted tiny mt-8">{e.subject} · {e.questions.length} 题</div>
              <div className="kv mt-16"><span className="k">出题人</span><span className="v">{nameOf(e.createdBy)}</span></div>
              <div className="kv"><span className="k">阅卷人</span><span className="v">{(e.graders||[]).map(nameOf).join("、") || <span className="muted">未设置</span>}</span></div>
              <div className="kv"><span className="k">开始</span><span className="v mono">{fmtTime(e.startTime)}</span></div>
              <div className="kv"><span className="k">截止</span><span className="v mono">{fmtTime(e.endTime)}</span></div>
              <div className="kv"><span className="k">试卷</span><span className="v">{e.paperFile?.name || <span className="muted">未上传</span>}</span></div>
              <div className="kv"><span className="k">提交</span><span className="v mono">{subs} 份</span></div>
              <div className="kv"><span className="k">批改</span><span className="v mono">{grades}/{totalGrades || 0}</span></div>
              <div className="row mt-16 gap-8">
                <button className="btn ghost sm" onClick={() => setEditing(e)}>编辑</button>
                <button className="btn danger sm" onClick={() => removeExam(e.id)}>删除</button>
              </div>
            </div>);
        })}
      </div>

      {editing && window.ExamEditor && (
        React.createElement(window.ExamEditor, {
          exam: editing, state, me,
          onClose: () => setEditing(null), onSave: saveExam,
        })
      )}
    </div>);
};

// ============ 站内公告 ============
const AdminBroadcast = ({ state, setState, toast }) => {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [scope, setScope] = React.useState("all"); // all / student / teacher

  const send = () => {
    if (!title || !body) {toast("标题与内容不能为空", "danger");return;}
    const targets = state.users.filter((u) => {
      if (u.role === "admin") return false;
      if (scope === "all") return true;
      return u.role === scope;
    });
    const msgs = targets.map((u) => ({
      id: uid("M"), userId: u.id, title, body, time: Date.now(), read: false
    }));
    setState({ ...state, messages: [...msgs, ...state.messages] });
    setTitle("");setBody("");
    toast(`已向 ${targets.length} 人发送`, "ok");
  };

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Admin · Broadcast</div>
          <h1>站内公告</h1>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <h3 className="mb-16">发送新公告</h3>
          <div className="field"><label>接收对象</label>
            <select className="select" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">全部用户（学生 + 教师）</option>
              <option value="student">仅学生</option>
              <option value="teacher">仅教师</option>
            </select>
          </div>
          <div className="field"><label>标题</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：本周模考时间调整" /></div>
          <div className="field"><label>内容</label>
            <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 140 }} /></div>
          <button className="btn" onClick={send}>发送</button>
        </div>
        <div className="card">
          <h3 className="mb-16">最近发送</h3>
          {state.messages.slice(0, 6).map((m) =>
          <div key={m.id} className="msg-row read">
              <div className="dot"></div>
              <div className="body">
                <div className="title">{m.title}</div>
                <div className="preview">{m.body}</div>
              </div>
              <div className="time">→ {m.userId}</div>
            </div>
          )}
          {state.messages.length === 0 && <Empty title="尚未发送过公告" />}
        </div>
      </div>
    </div>);

};

const AdminSettings = ({ state, setState, toast }) => {
  const [quote, setQuote] = React.useState(state.settings?.loginQuote || "法不阿贵，绳不挠曲。");
  const [source, setSource] = React.useState(state.settings?.loginQuoteSource || "《韩非子》");
  const saveQuote = () => {
    setState({
      ...state,
      settings:{ ...(state.settings || {}), loginQuote:quote.trim(), loginQuoteSource:source.trim() },
    });
    toast("登录页名言已更新", "ok");
  };
  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Admin · System</div>
          <h1>系统设置</h1>
        </div>
      </div>
      <div className="card">
        <h3 className="mb-16">数据 · 联网</h3>
        <div className="kv mb-8"><span className="k">运行模式</span><span className="v">动态后端模式</span></div>
        <div className="kv mb-8"><span className="k">云数据库</span><span className="v mono muted">配置 DATABASE_URL 后启用 Postgres</span></div>
        <div className="kv mb-8"><span className="k">云存储</span><span className="v mono muted">配置 BLOB_READ_WRITE_TOKEN 后启用 Vercel Blob</span></div>
        <div className="kv mb-16"><span className="k">数据条目</span><span className="v mono">{state.users.length} 用户 · {state.exams.length} 考试 · {state.submissions.length} 提交 · {state.grades.length} 批改</span></div>
        <div className="row gap-8">
          <button className="btn danger" onClick={() => {
            if (!confirm("将清空所有数据并恢复出厂示例，确认？")) return;
            resetState();
            location.reload();
          }}>重置为示例数据</button>
        </div>
      </div>
      <div className="card mt-16">
        <h3 className="mb-16">登录页法律名言</h3>
        <div className="field"><label>名言</label>
          <textarea className="textarea" style={{minHeight:88}} value={quote} onChange={(e)=>setQuote(e.target.value)} /></div>
        <div className="field"><label>出处 / 作者</label>
          <input className="input" value={source} onChange={(e)=>setSource(e.target.value)} placeholder="如 《韩非子》" /></div>
        <div className="row gap-8">
          <button className="btn" disabled={!quote.trim()} onClick={saveQuote}>保存名言</button>
          <button className="btn ghost" onClick={()=>{
            setQuote("徒善不足以为政，徒法不能以自行。");
            setSource("《孟子》");
          }}>换一条示例</button>
        </div>
      </div>
    </div>);

};

Object.assign(window, { Admin });
