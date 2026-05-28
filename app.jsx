/* ============ 法泽在线 — 主应用 ============ */

const SESSION_KEY = "faze_session";

const App = () => {
  const [state, setStateRaw] = React.useState(() => loadState());
  const [backend, setBackend] = React.useState({ ready:false, online:false });
  const setState = (s) => {
    setStateRaw(s);
    saveState(s);
    if(backend.online) {
      saveStateRemote(s).catch(() => setBackend({ ready:true, online:false }));
    }
  };
  const [session, setSession] = React.useState(() => {
    try {return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");} catch (e) {return null;}
  });
  const [toasts, setToasts] = React.useState([]);
  const toast = (msg, kind) => {
    const id = uid("T");
    setToasts((ts) => [...ts, { id, msg, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3200);
  };
  const removeToast = (id) => setToasts((ts) => ts.filter((t) => t.id !== id));

  const me = session ? state.users.find((u) => u.id === session.userId) : null;

  React.useEffect(() => {
    let alive = true;
    loadStateRemote()
      .then((remote) => {
        if(!alive) return;
        if(remote && Object.keys(remote).length) {
          setStateRaw(remote);
          saveState(remote);
        } else {
          saveStateRemote(state).catch(() => {});
        }
        setBackend({ ready:true, online:true });
      })
      .catch(() => {
        if(alive) setBackend({ ready:true, online:false });
      });
    return () => { alive = false; };
  }, []);

  const doLogin = (userId) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, time: Date.now() }));
    setSession({ userId, time: Date.now() });
  };
  const doLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  // 首次登录强制改密
  const [pwModal, setPwModal] = React.useState(false);
  React.useEffect(() => {
    if (me && me.firstLogin && me.role !== "admin") {
      setPwModal(true);
    }
  }, [me?.id]);

  const onChangePassword = (newPw) => {
    changePasswordRemote({ userId:me.id, oldPassword:me.id, newPassword:newPw })
      .then((result) => {
        if(result.state) setState(result.state);
        else setState({
          ...state,
          users: state.users.map((u) => u.id === me.id ? { ...u, firstLogin: false } : u)
        });
        setPwModal(false);
        toast("密码已更新", "ok");
      })
      .catch((err) => toast(err.message || "密码更新失败", "danger"));
  };

  return (
    <>
      {!me && <Login users={state.users} state={state} setState={setState} doLogin={doLogin} toast={toast} />}
      {me && me.role === "admin" && <Admin state={state} setState={setState} toast={toast} me={me} doLogout={doLogout} />}
      {me && me.role === "teacher" && <Teacher state={state} setState={setState} toast={toast} me={me} doLogout={doLogout} />}
      {me && me.role === "student" && <Student state={state} setState={setState} toast={toast} me={me} doLogout={doLogout} />}

      {backend.ready && !backend.online &&
      <div className="sync-banner">当前为单机模式：启动后端服务后，数据会在同一服务器上同步保存。</div>
      }

      {pwModal &&
      <FirstLoginPwd onSubmit={onChangePassword} me={me} />
      }

      <Toast stack={toasts} remove={removeToast} />
    </>);

};

// ============ 登录页 ============
const Login = ({ users, state, setState, doLogin, toast }) => {
  const [id, setId] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const quote = state.settings?.loginQuote || "法不阿贵，绳不挠曲。";
  const quoteSource = state.settings?.loginQuoteSource || "《韩非子》";

  const submit = async () => {
    setBusy(true);
    try{
      const result = await loginRemote(id.trim(), pw);
      if(result.state) setState(result.state);
      doLogin(result.user.id);
    }catch(err){
      const u = users.find((x) => x.id === id.trim());
      if (u?.password && u.password === pw) doLogin(u.id);
      else toast(err.message || "登录失败", "danger");
    }finally{
      setBusy(false);
    }
  };

  const fillDemo = (uid, pwd) => {setId(uid);setPw(pwd);};

  return (
    <div className="login-shell">
      <div className="login-art">
        <div>
          <div className="brand">法泽在线学习平台</div>
          <div className="tag">FA · ZE · ONLINE</div>
        </div>
        <div className="quote">
          {quote}<br />
          <span>{quoteSource}</span>
        </div>
        <div className="seal"></div>
        <div className="footer">专注中国政法大学考研
</div>
      </div>
      <div className="login-form">
        <div className="login-card">
          <div className="eyebrow">SIGN IN</div>
          <h2>登录到法泽在线</h2>
          <div className="muted tiny mb-16">账号由管理员统一创建。教师账号也只能由管理员添加。</div>

          <div className="field">
            <label>账号（学号 / 工号 / admin）</label>
            <input className="input" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="如 S2024001" autoFocus />
          </div>
          <div className="field">
            <label>密码</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="请输入密码" />
          </div>

          <button className="btn full lg" disabled={busy} onClick={submit}>
            {busy ? "处理中…" : "登 录"}
          </button>

          <div className="divider"></div>
          <div className="muted tiny" style={{ letterSpacing: ".15em", marginBottom: 8 }}>演示账号（点击填入）</div>
          <div className="col gap-4">
            <button className="btn ghost sm" style={{ justifyContent: "flex-start" }} onClick={() => fillDemo("admin", "admin")}>
              <span className="mono" style={{ minWidth: 90 }}>admin</span>
              <span className="muted" style={{ marginLeft: 8 }}>系统管理员</span>
            </button>
            <button className="btn ghost sm" style={{ justifyContent: "flex-start" }} onClick={() => fillDemo("T001", "T001")}>
              <span className="mono" style={{ minWidth: 90 }}>T001</span>
              <span className="muted" style={{ marginLeft: 8 }}>陈砚清 · 教师（首次登录需改密）</span>
            </button>
            <button className="btn ghost sm" style={{ justifyContent: "flex-start" }} onClick={() => fillDemo("S2024001", "S2024001")}>
              <span className="mono" style={{ minWidth: 90 }}>S2024001</span>
              <span className="muted" style={{ marginLeft: 8 }}>周予安 · 学生（首次登录需改密）</span>
            </button>
          </div>
        </div>
      </div>
    </div>);

};

// ============ 首次登录改密 ============
const FirstLoginPwd = ({ me, onSubmit }) => {
  const [p1, setP1] = React.useState("");
  const [p2, setP2] = React.useState("");
  const [err, setErr] = React.useState("");

  const go = () => {
    if (p1.length < 6) {setErr("新密码至少 6 位");return;}
    if (p1 !== p2) {setErr("两次输入不一致");return;}
    if (p1 === me.id) {setErr("新密码不能与账号相同");return;}
    onSubmit(p1);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head"><h3>首次登录 · 请设置新密码</h3></div>
        <div className="muted tiny mb-16">
          欢迎，{me.name}。出于安全考虑，请将初始密码（账号）修改为您自己的密码。
        </div>
        <div className="field"><label>新密码</label>
          <input className="input" type="password" value={p1} onChange={(e) => {setP1(e.target.value);setErr("");}} autoFocus placeholder="至少 6 位" /></div>
        <div className="field"><label>再次输入</label>
          <input className="input" type="password" value={p2} onChange={(e) => {setP2(e.target.value);setErr("");}}
          onKeyDown={(e) => e.key === "Enter" && go()} /></div>
        {err && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <div className="modal-foot">
          <button className="btn full" onClick={go}>确认修改</button>
        </div>
      </div>
    </div>);

};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
