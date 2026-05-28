/* ============ 法泽在线 — 学生端 ============ */

const Student = ({state, setState, toast, me, doLogout})=>{
  const [view, setView] = React.useState("home");
  const [currentExamId, setCurrentExamId] = React.useState(null);
  const [showProfile, setShowProfile] = React.useState(false);

  const unread = state.messages.filter(m=>m.userId===me.id && !m.read).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">法泽<span className="tag-em">FA · ZE · ONLINE</span></div>
        <div className="section">学习</div>
        <NavItem id="home" cur={view} set={(v)=>{setView(v); setCurrentExamId(null);}} label="首页" />
        <NavItem id="schedule" cur={view} set={(v)=>{setView(v); setCurrentExamId(null);}} label="我的课表" />
        <NavItem id="courses" cur={view} set={(v)=>{setView(v); setCurrentExamId(null);}} label="课程学习" />
        <NavItem id="exams" cur={view} set={(v)=>{setView(v); setCurrentExamId(null);}} label="模拟测试" />
        <div className="section">个人</div>
        <NavItem id="scores" cur={view} set={setView} label="我的成绩" />
        <NavItem id="ranking" cur={view} set={setView} label="排行榜" />
        <NavItem id="inbox" cur={view} set={setView} label="站内消息" badge={unread||null} />

        <div className="me me-clickable" onClick={()=>setShowProfile(true)} title="个人设置">
          <div className="avatar">{me.name[0]}</div>
          <div>
            <div className="name">{me.name}</div>
            <div className="role">{me.className||"学生"}</div>
          </div>
          <span className="gear">⚙</span>
          <div className="logout" onClick={(e)=>{e.stopPropagation(); doLogout();}}>登出</div>
        </div>
      </aside>
      <main className="main">
        {view==="home" && <StudentHome me={me} state={state} setView={setView} />}
        {view==="schedule" && <Schedule state={state} setState={setState} toast={toast} me={me} canManage={false} />}
        {view==="courses" && <Courses state={state} setState={setState} toast={toast} me={me} canManage={false} />}
        {view==="exams" && !currentExamId && <ExamList state={state} me={me} onOpen={(id)=>setCurrentExamId(id)} />}
        {view==="exams" && currentExamId && (
          <ExamDetail
            state={state} setState={setState} toast={toast} me={me}
            examId={currentExamId} onBack={()=>setCurrentExamId(null)}
          />
        )}
        {view==="scores" && <StudentScores state={state} me={me} />}
        {view==="ranking" && <StudentRanking state={state} me={me} />}
        {view==="inbox" && <StudentInbox state={state} setState={setState} me={me} />}
      </main>

      {showProfile && <ProfileModal me={me} state={state} setState={setState} toast={toast} onClose={()=>setShowProfile(false)} />}
    </div>
  );
};

// ============ 首页（极简） ============
const StudentHome = ({me, state, setView})=>{
  const now = useNow(60000);
  const greeting = (()=>{
    const h = new Date().getHours();
    if(h<6) return "夜深了，早些休息";
    if(h<12) return "早上好";
    if(h<14) return "中午好";
    if(h<19) return "下午好";
    return "晚上好";
  })();

  // 寻找最近的一场考试供卡片预告
  const upcoming = state.exams
    .filter(e=> e.endTime > now)
    .sort((a,b)=> a.startTime - b.startTime)[0];

  const unread = state.messages.filter(m=>m.userId===me.id && !m.read).length;

  return (
    <div>
      <div className="page-head" style={{borderBottom:"none", marginBottom:48}}>
        <div className="title">
          <div className="eyebrow">{fmtTime(now).slice(0,10)} · {["日","一","二","三","四","五","六"][new Date(now).getDay()]}</div>
          <h1 style={{fontSize:42, marginTop:8}}>{greeting}，{me.name}</h1>
        </div>
      </div>

      <div style={{maxWidth:680}}>
        <div className="card" style={{padding:"32px 36px", marginBottom:20, background:"linear-gradient(180deg, #fff 0%, var(--paper-2) 100%)"}}>
          <div className="muted tiny mb-8" style={{letterSpacing:".25em"}}>近期安排</div>
          {upcoming ? (
            <div>
              <h2 style={{fontSize:24}}>{upcoming.title}</h2>
              <div className="muted mt-8">{upcoming.subject} · 共 {upcoming.questions.length} 题</div>
              <div className="row between mt-24 gap-16">
                <div>
                  <div className="muted tiny">{examStatus(upcoming)==="pending" ? "开始时间" : examStatus(upcoming)==="open" ? "截止时间" : "已结束"}</div>
                  <div style={{fontFamily:"var(--serif)", fontSize:18, marginTop:4}}>
                    {fmtTime(examStatus(upcoming)==="pending" ? upcoming.startTime : upcoming.endTime)}
                  </div>
                </div>
                <button className="btn" onClick={()=>setView("exams")}>前往考试 →</button>
              </div>
            </div>
          ) : (
            <div className="muted">暂无安排中的考试。</div>
          )}
        </div>

        {unread > 0 && (
          <div className="card row between" style={{padding:"16px 20px", cursor:"pointer"}} onClick={()=>setView("inbox")}>
            <div>
              <div style={{fontWeight:500}}>您有 {unread} 条未读消息</div>
              <div className="muted tiny">点击查看 →</div>
            </div>
            <span className="badge">{unread}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ 模拟测试列表 ============
const ExamList = ({state, me, onOpen})=>{
  // 显示所有考试（不过滤——学生看到所有发布的考试）
  const exams = state.exams;
  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Student · Mock Exams</div>
          <h1>模拟测试</h1>
        </div>
        <div className="muted tiny">点击卡片查看详情</div>
      </div>

      <div className="grid cols-2">
        {exams.map((e, i)=>{
          const st = examStatus(e);
          const sub = state.submissions.find(s=>s.examId===e.id && s.studentId===me.id);
          const allGraded = sub && e.questions.every(q =>
            state.grades.find(g=>g.examId===e.id && g.qid===q.id && g.studentId===me.id));
          return (
            <div key={e.id} className="exam-card" onClick={()=>onOpen(e.id)}>
              <div className="seal"></div>
              <div className="num">{pad2(i+1)}</div>
              <h3>{e.title}</h3>
              <div className="muted tiny">{e.subject || "—"} · {e.questions.length} 题</div>
              <div className="status-row">
                <Tag kind={statusTagClass(st)}>{statusLabel(st)}</Tag>
                {e.realMode && <Tag kind="accent">全真模拟</Tag>}
                {sub && !allGraded && <Tag kind="warn">已提交·待批改</Tag>}
                {allGraded && <Tag kind="accent">批改完成</Tag>}
              </div>
              <div className="meta">
                <span>开始 · {fmtTime(e.startTime)}</span>
                <span>截止 · {fmtTime(e.endTime)}</span>
              </div>
            </div>
          );
        })}
      </div>
      {exams.length===0 && <Empty title="暂无可参与的测试" hint="请等待教师发布" icon="○" />}
    </div>
  );
};

// ============ 测试详情（核心流程） ============
const ExamDetail = ({state, setState, toast, me, examId, onBack})=>{
  const exam = state.exams.find(e=>e.id===examId);
  const now = useNow(1000);
  const st = examStatus(exam);
  const sub = state.submissions.find(s=>s.examId===examId && s.studentId===me.id);
  const grades = state.grades.filter(g=>g.examId===examId && g.studentId===me.id);
  const allGraded = sub && exam.questions.every(q => grades.find(g=>g.qid===q.id));
  const fileRef = React.useRef();
  const [inRealExam, setInRealExam] = React.useState(false);

  // 下载试卷
  const downloadPaper = ()=>{
    if(!exam.paperFile){ toast("教师尚未上传试卷文件", "danger"); return; }
    if(!exam.paperFile.url){ toast("该试卷还没有真实文件地址", "danger"); return; }
    const a = document.createElement("a");
    a.href = exam.paperFile.url;
    a.download = exam.paperFile.name;
    a.click();
    toast("试卷已开始下载", "ok");
  };

  // 提交（按题分别上传），files 是一个 {qid: FileList} 的对象
  const submitAnswers = (perQ)=>{
    // perQ: { Q1: [{name,size}], Q2: [...] }
    const answers = exam.questions.map(q=>({
      qid: q.id,
      files: perQ[q.id] || [],
    }));
    if(!answers.some(a=>a.files.length>0)){
      toast("请至少上传一题的作答内容", "danger");
      return false;
    }
    const next = {...state};
    next.submissions = next.submissions.filter(s=>!(s.examId===examId && s.studentId===me.id));
    next.submissions.push({
      examId, studentId:me.id, answers, submittedAt: Date.now(),
    });
    setState(next);
    toast("答卷已按题提交，等待教师批阅", "ok");
    return true;
  };

  if(!exam) return <Empty title="考试不存在" />;

  // 真·全屏考场：渲染独立的 overlay
  if(inRealExam && exam.realMode){
    return (
      <RealModeExam
        exam={exam} me={me} sub={sub}
        onSubmit={submitAnswers}
        onDownloadPaper={downloadPaper}
        onExit={()=>{ exitFullscreen(); setInRealExam(false); }}
        toast={toast}
      />
    );
  }

  const enterRealExam = ()=>{
    enterFullscreen();
    playBell("open");
    setInRealExam(true);
  };

  return (
    <div>
      <div className="row gap-8 mb-16" style={{color:"var(--ink-500)", cursor:"pointer", fontSize:13}} onClick={onBack}>
        ← 返回考试列表
      </div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">{exam.subject} · 模拟测试</div>
          <h1>{exam.title}</h1>
        </div>
        <div className="row gap-8">
          {exam.realMode && <Tag kind="accent">全真模拟</Tag>}
          <Tag kind={statusTagClass(st)}>{statusLabel(st)}</Tag>
        </div>
      </div>

      {/* 须知 */}
      <div className="card mb-16">
        <h3 className="mb-16">考试须知</h3>
        <div className="notice-box">{exam.notice || "（教师未填写须知）"}</div>
        <div className="grid cols-3 mt-16">
          <div className="kv"><span className="k">开始时间</span><span className="v mono">{fmtTime(exam.startTime)}</span></div>
          <div className="kv"><span className="k">截止时间</span><span className="v mono">{fmtTime(exam.endTime)}</span></div>
          <div className="kv"><span className="k">{exam.realMode?"考试时长":"题目数量"}</span>
            <span className="v mono">{exam.realMode ? `${exam.duration||120} 分钟` : `${exam.questions.length} 题`}</span></div>
        </div>
      </div>

      {/* 全真模拟模式专属入口卡片 */}
      {exam.realMode && !sub && (
        <div className="card mb-16" style={{background:"linear-gradient(135deg, #1a2538 0%, #0f1726 100%)", color:"#e7e1d2", border:"none", padding:32}}>
          <div className="row between" style={{gap:24, alignItems:"center"}}>
            <div style={{flex:1}}>
              <div className="tiny" style={{color:"var(--accent-soft)", letterSpacing:".3em"}}>FULL EXAM SIMULATION</div>
              <h2 style={{color:"#fff", marginTop:8, fontSize:24}}>全真模拟考场</h2>
              <div style={{color:"rgba(231,225,210,.7)", marginTop:8, lineHeight:1.7, maxWidth:480}}>
                进入考场后将全屏显示模拟时钟与倒计时，到点打铃，按真实考试时间作答。请确保提交答卷前不要中途离场。
              </div>
              {st==="pending" && (
                <div className="mt-16">
                  <div className="tiny" style={{color:"rgba(231,225,210,.5)", letterSpacing:".2em"}}>距离开考</div>
                  <div style={{fontFamily:"var(--serif)", fontSize:36, color:"#fff", marginTop:4}}>
                    <Countdown to={exam.startTime} />
                  </div>
                </div>
              )}
            </div>
            <div style={{minWidth:200, textAlign:"center"}}>
              <AnalogClock size={140} dark />
              <button className="btn lg mt-16"
                style={{background:"var(--accent)", border:"none", width:"100%"}}
                disabled={st!=="open"} onClick={enterRealExam}>
                {st==="pending" ? "尚未开考" : "进入考场 →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 状态分支 —— 普通模式或全真模拟已提交后 */}
      {!exam.realMode && st === "pending" && (
        <div className="card center" style={{padding:"56px 24px"}}>
          <div className="muted tiny mb-8" style={{letterSpacing:".3em"}}>距离开始还有</div>
          <Countdown to={exam.startTime} />
          <div className="muted mt-16">考试开始后，将在此显示试卷下载入口</div>
          <button className="btn ghost mt-16" disabled>试卷下载（未开始）</button>
        </div>
      )}

      {!exam.realMode && st !== "pending" && (
        <>
          {/* 试卷下载 */}
          <div className="card mb-16">
            <div className="row between">
              <div>
                <h3>试卷下载</h3>
                <div className="muted tiny mt-8">考试已开始 · 请尽快下载试卷</div>
              </div>
              <button className="btn" onClick={downloadPaper}>
                ↓ 下载 {exam.paperFile?.name || "试卷"}
              </button>
            </div>
            {exam.paperFile && (
              <div className="file-row mt-16">
                <span style={{color:"var(--accent)"}}>◧</span>
                <span className="name">{exam.paperFile.name}</span>
                <span className="size">{fmtBytes(exam.paperFile.size)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 上传答卷 / 已提交状态 —— 普通模式（按题分别上传） */}
      {st === "open" && !exam.realMode && (
        <div className="card mb-16">
          <div className="row between mb-16">
            <h3>按题提交答卷</h3>
            <div className="muted tiny">截止 {fmtTime(exam.endTime)}（剩余 <Countdown to={exam.endTime} />）</div>
          </div>

          {!sub ? (
            <PerQuestionUploader exam={exam} onSubmit={submitAnswers} toast={toast} />
          ) : (
            <SubmittedView exam={exam} sub={sub} onWithdraw={()=>{
              if(!confirm("撤销提交后可重新上传，是否继续？")) return;
              setState({...state, submissions: state.submissions.filter(s=>!(s.examId===examId && s.studentId===me.id))});
              toast("已撤销");
            }} />
          )}
        </div>
      )}

      {/* 全真模拟·已提交（仅显示精简确认信息） */}
      {exam.realMode && sub && st !== "closed" && (
        <div className="card mb-16">
          <div className="row gap-8 mb-8"><Tag kind="ok">已提交</Tag>
            <span className="muted tiny">{fmtTime(sub.submittedAt)}</span></div>
          <div className="muted">您已在全真模拟考场中完成提交。阅卷完成后将通过站内消息通知您。</div>
          <div className="divider"></div>
          <SubmittedView exam={exam} sub={sub} compact />
        </div>
      )}

      {/* 已截止 —— 两种模式共用 */}
      {st === "closed" && (
        <div className="card mb-16">
          <h3>本场已截止</h3>
          {sub ? (
            <>
              <div className="row gap-8 mt-8 mb-16">
                <Tag kind="ok">已提交</Tag>
                <span className="muted tiny">{fmtTime(sub.submittedAt)}</span>
              </div>
              {allGraded ? (
                <ExamMyScore exam={exam} grades={grades} />
              ) : (
                <div className="muted">阅卷进行中，完成后将在「我的成绩」中查看详情，并通过站内消息通知您。</div>
              )}
            </>
          ) : (
            <div className="muted">您未参加本场测试。</div>
          )}
        </div>
      )}
    </div>
  );
};

const ExamMyScore = ({exam, grades})=>{
  const total = grades.reduce((s,g)=>s+g.score, 0);
  const maxTotal = exam.questions.reduce((s,q)=>s+q.maxScore, 0);
  return (
    <div>
      <div className="row gap-24 mb-16">
        <div>
          <div className="muted tiny">总分</div>
          <div className="score-big">{total}<small>/ {maxTotal}</small></div>
        </div>
      </div>
      <table className="tbl">
        <thead><tr><th>题号</th><th>题目</th><th>得分</th><th>满分</th><th>教师批注</th></tr></thead>
        <tbody>
          {exam.questions.map(q=>{
            const g = grades.find(x=>x.qid===q.id);
            return (
              <tr key={q.id}>
                <td className="mono">{q.id}</td>
                <td>{q.title}</td>
                <td className="mono num" style={{color:"var(--accent)", fontWeight:500}}>{g?.score ?? "—"}</td>
                <td className="mono num muted">{q.maxScore}</td>
                <td className="muted" style={{maxWidth:300}}>{g?.comment || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============ 我的成绩 ============
const StudentScores = ({state, me})=>{
  const mySubmissions = state.submissions.filter(s=>s.studentId===me.id);
  const examItems = mySubmissions.map(s=>{
    const exam = state.exams.find(e=>e.id===s.examId);
    if(!exam) return null;
    const grades = state.grades.filter(g=>g.examId===s.examId && g.studentId===me.id);
    const allGraded = exam.questions.every(q=>grades.find(g=>g.qid===q.id));
    return { exam, grades, allGraded, sub:s };
  }).filter(Boolean);

  const [openId, setOpenId] = React.useState(null);
  const cur = examItems.find(it=>it.exam.id===openId);

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Student · Scores</div>
          <h1>我的成绩</h1>
        </div>
      </div>

      {examItems.length===0 ? (
        <Empty title="尚无成绩" hint="完成模拟测试后将在此处查看" icon="—" />
      ) : !cur ? (
        <div className="card" style={{padding:0}}>
          <table className="tbl">
            <thead><tr><th>考试</th><th>科目</th><th>提交时间</th><th>状态</th><th>得分</th><th></th></tr></thead>
            <tbody>
              {examItems.map(it=>{
                const total = it.grades.reduce((s,g)=>s+g.score, 0);
                const max = it.exam.questions.reduce((s,q)=>s+q.maxScore, 0);
                return (
                  <tr key={it.exam.id}>
                    <td style={{fontWeight:500}}>{it.exam.title}</td>
                    <td className="muted">{it.exam.subject}</td>
                    <td className="mono muted">{fmtTime(it.sub.submittedAt)}</td>
                    <td>{it.allGraded ? <Tag kind="ok">批改完成</Tag> : <Tag kind="warn">阅卷中</Tag>}</td>
                    <td className="mono num">{it.allGraded ? <span style={{color:"var(--accent)", fontWeight:500}}>{total}/{max}</span> : "—"}</td>
                    <td className="right">
                      {it.allGraded && <button className="btn subtle sm" onClick={()=>setOpenId(it.exam.id)}>查看详情</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="row gap-8 mb-16" style={{color:"var(--ink-500)", cursor:"pointer"}} onClick={()=>setOpenId(null)}>← 返回成绩列表</div>
          <div className="card">
            <div className="row between mb-16">
              <div>
                <h2>{cur.exam.title}</h2>
                <div className="muted tiny">{cur.exam.subject}</div>
              </div>
            </div>
            <ExamMyScore exam={cur.exam} grades={cur.grades} />
          </div>
        </div>
      )}
    </div>
  );
};

// ============ 排行榜 ============
const StudentRanking = ({state, me})=>{
  // 仅显示「批改完成且公布排名」的考试
  const eligible = state.exams.filter(e=>{
    if(!e.publicRanking) return false;
    const subs = state.submissions.filter(s=>s.examId===e.id);
    return subs.length>0 && subs.every(sb =>
      e.questions.every(q=>state.grades.find(g=>g.examId===e.id && g.qid===q.id && g.studentId===sb.studentId))
    );
  });

  const [examId, setExamId] = React.useState(eligible[0]?.id);
  const exam = eligible.find(e=>e.id===examId);

  if(eligible.length===0) return (
    <div>
      <div className="page-head"><div className="title"><div className="eyebrow">Student · Rankings</div><h1>排行榜</h1></div></div>
      <Empty title="尚无可公布的排名" hint="待考试批改完成且教师选择公布后可见" icon="—" />
    </div>
  );

  const ranks = state.submissions
    .filter(s=>s.examId===examId)
    .map(s=>{
      const grades = state.grades.filter(g=>g.examId===examId && g.studentId===s.studentId);
      const total = grades.reduce((sum,g)=>sum+g.score, 0);
      const u = state.users.find(u=>u.id===s.studentId);
      return { studentId:s.studentId, name:u?.name||"—", className:u?.className||"", total };
    })
    .sort((a,b)=> b.total - a.total)
    .map((r,i)=>({...r, rank:i+1}));

  const maxScore = exam.questions.reduce((s,q)=>s+q.maxScore, 0);
  const me_rank = ranks.find(r=>r.studentId===me.id);

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Student · Rankings</div>
          <h1>排行榜</h1>
        </div>
        <select className="select" value={examId} onChange={e=>setExamId(e.target.value)} style={{width:280}}>
          {eligible.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      <div className="grid cols-3 mb-24">
        <div className="card center" style={{padding:"24px"}}>
          <div className="muted tiny" style={{letterSpacing:".25em"}}>我的排名</div>
          <div style={{fontFamily:"var(--serif)", fontSize:48, color:"var(--accent)", marginTop:8}}>
            {me_rank ? me_rank.rank : "—"}
            <small className="muted" style={{fontSize:16, marginLeft:6}}>/ {ranks.length}</small>
          </div>
        </div>
        <div className="card center" style={{padding:"24px"}}>
          <div className="muted tiny" style={{letterSpacing:".25em"}}>我的得分</div>
          <div style={{fontFamily:"var(--serif)", fontSize:48, marginTop:8}}>
            {me_rank ? me_rank.total : "—"}
            <small className="muted" style={{fontSize:16, marginLeft:6}}>/ {maxScore}</small>
          </div>
        </div>
        <div className="card center" style={{padding:"24px"}}>
          <div className="muted tiny" style={{letterSpacing:".25em"}}>平均分</div>
          <div style={{fontFamily:"var(--serif)", fontSize:48, marginTop:8}}>
            {(ranks.reduce((s,r)=>s+r.total,0)/ranks.length).toFixed(1)}
          </div>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        {ranks.map(r=>(
          <div key={r.studentId} className={"rank-row"+(r.rank===1?" top1":"")+(r.studentId===me.id?" me":"")}>
            <div className="rk">{r.rank}</div>
            <div className="nm">{r.name}<span className="muted tiny" style={{marginLeft:8}}>{r.className}</span></div>
            <div className="sc">{r.total}<span className="muted tiny" style={{marginLeft:4}}>/ {maxScore}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ 站内消息 ============
const StudentInbox = ({state, setState, me})=>{
  const myMsgs = state.messages.filter(m=>m.userId===me.id).sort((a,b)=>b.time-a.time);
  const [openId, setOpenId] = React.useState(null);
  const open = myMsgs.find(m=>m.id===openId);

  const markRead = (id)=>{
    setState({...state, messages: state.messages.map(m=>m.id===id?{...m, read:true}:m)});
  };
  const markAllRead = ()=>{
    setState({...state, messages: state.messages.map(m=>m.userId===me.id?{...m, read:true}:m)});
  };

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Student · Inbox</div>
          <h1>站内消息</h1>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={markAllRead}>全部标为已读</button>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"380px 1fr", gap:16}}>
        <div className="card" style={{padding:0, height:"fit-content"}}>
          {myMsgs.length===0 && <Empty title="收件箱为空" icon="—" />}
          {myMsgs.map(m=>(
            <div key={m.id} className={"msg-row"+(m.read?" read":"")} onClick={()=>{ setOpenId(m.id); markRead(m.id); }}>
              <div className="dot"></div>
              <div className="body">
                <div className="title">{m.title}</div>
                <div className="preview">{m.body}</div>
              </div>
              <div className="time">{fmtRel(m.time)}</div>
            </div>
          ))}
        </div>
        <div className="card">
          {open ? (
            <div>
              <h2>{open.title}</h2>
              <div className="muted tiny mt-8">{fmtTime(open.time)}</div>
              <div className="divider"></div>
              <div style={{whiteSpace:"pre-wrap", lineHeight:1.8}}>{open.body}</div>
            </div>
          ) : (
            <Empty title="选择左侧消息查看详情" icon="✉" />
          )}
        </div>
      </div>
    </div>
  );
};

// ============ 按题上传组件 ============
const PerQuestionUploader = ({exam, onSubmit, toast})=>{
  // 状态：{Q1: [{name,size}], Q2:[...]}
  const [files, setFiles] = React.useState(()=>{
    const obj = {}; exam.questions.forEach(q=> obj[q.id]=[]); return obj;
  });
  const refs = React.useRef({});
  refs.current = refs.current || {};
  const [uploading, setUploading] = React.useState(null);

  const onPick = async (qid, list)=>{
    if(!list || list.length===0) return;
    try{
      setUploading({qid, pct:0});
      const arr = [];
      for(const file of Array.from(list)){
        arr.push(await uploadRemote(file, (pct)=>setUploading({qid, pct})));
      }
      setFiles(s=>({...s, [qid]: [...(s[qid]||[]), ...arr]}));
      toast?.("作答文件已上传", "ok");
    }catch(err){
      toast?.(err.message || "上传失败", "danger");
    }finally{
      setUploading(null);
    }
  };
  const onRemove = (qid, idx)=>{
    setFiles(s=>({...s, [qid]: s[qid].filter((_,i)=>i!==idx)}));
  };

  const totalUploaded = Object.values(files).reduce((s,arr)=>s+arr.length, 0);
  const answeredCount = exam.questions.filter(q=>(files[q.id]||[]).length>0).length;

  const submit = ()=>{
    if(answeredCount < exam.questions.length){
      if(!confirm(`您仅完成 ${answeredCount} / ${exam.questions.length} 题的作答上传，确认提交？提交后不可修改。`)) return;
    }
    onSubmit(files);
  };

  return (
    <div>
      <div className="muted tiny mb-16">请按下方题号分别上传对应的作答内容（图片或 PDF）。每题可上传多个文件。</div>
      <div className="q-upload-list">
        {exam.questions.map(q=>{
          const list = files[q.id] || [];
          return (
            <div key={q.id} className="q-upload-row">
              <div className="q-upload-label">
                <span className="qno">{q.id}</span>
                <span className="qmax">满分 {q.maxScore} 分</span>
                <span className="muted tiny" style={{marginTop:4, lineHeight:1.4}}>{q.title}</span>
              </div>
              <div className="q-upload-files">
                {list.map((f,i)=>(
                  <div key={i} className="file-row">
                    <span style={{color:"var(--accent)"}}>◧</span>
                    <span className="name">{f.name}</span>
                    <span className="size">{fmtBytes(f.size)}</span>
                    <button className="btn danger sm" onClick={()=>onRemove(q.id, i)}>移除</button>
                  </div>
                ))}
                <div className="empty-pad" onClick={()=>refs.current[q.id]?.click()}>
                  {list.length===0
                    ? `+ 点击上传第 ${q.id.replace("Q","")} 题作答（PDF / 图片，可多文件）`
                    : `+ 继续添加（已 ${list.length} 个文件）`}
                </div>
                {uploading?.qid === q.id && (
                  <div className="upload-progress compact">
                    <div className="upload-progress-bar" style={{width:`${uploading.pct}%`}}></div>
                    <span>{uploading.pct}%</span>
                  </div>
                )}
                <input ref={el=>refs.current[q.id]=el} type="file" multiple
                  accept=".pdf,image/*" style={{display:"none"}}
                  onChange={e=>onPick(q.id, e.target.files)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="row between mt-24">
        <div className="muted tiny">已上传 <b style={{color:"var(--ink-900)"}}>{answeredCount}</b> / {exam.questions.length} 题 · 共 {totalUploaded} 个文件</div>
        <button className="btn" onClick={submit} disabled={totalUploaded===0}>提交答卷</button>
      </div>
    </div>
  );
};

const SubmittedView = ({exam, sub, onWithdraw, compact})=>{
  return (
    <>
      {!compact && (
        <div className="row gap-8 mb-16">
          <Tag kind="ok">已提交</Tag>
          <span className="muted tiny">{fmtTime(sub.submittedAt)}</span>
        </div>
      )}
      <div className="q-upload-list">
        {exam.questions.map(q=>{
          const ans = (sub.answers||[]).find(a=>a.qid===q.id);
          const list = ans?.files || [];
          return (
            <div key={q.id} className="q-upload-row" style={compact?{padding:"10px 14px"}:null}>
              <div className="q-upload-label">
                <span className="qno">{q.id}</span>
                <span className="qmax">满分 {q.maxScore} 分</span>
              </div>
              <div className="q-upload-files">
                {list.length===0 ? <div className="muted tiny">（未提交此题）</div> :
                  list.map((f,i)=>(
                    <div key={i} className="file-row">
                      <span style={{color:"var(--accent)"}}>◧</span>
                      <span className="name">{f.name}</span>
                      <span className="size">{fmtBytes(f.size)}</span>
                      {f.url && <a className="btn subtle sm" href={f.url} download={f.name}>下载</a>}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      {onWithdraw && (
        <div className="row gap-8 mt-16">
          <button className="btn ghost sm" onClick={onWithdraw}>撤销提交</button>
        </div>
      )}
    </>
  );
};

// ============ 全真模拟·全屏考场 ============
const RealModeExam = ({exam, me, sub, onSubmit, onDownloadPaper, onExit, toast})=>{
  const now = useNow(1000);
  const [downloaded, setDownloaded] = React.useState(false);
  const [showSubmit, setShowSubmit] = React.useState(false);

  // 实际可用时间 = min(endTime, 进入时间 + duration*60s)
  // 这里采用 exam.endTime 作为统一截止线
  const remaining = Math.max(0, exam.endTime - now);
  const totalMs = (exam.duration || 120) * 60 * 1000;
  // 标志位
  const expired = remaining <= 0;
  const lessThan10 = remaining > 0 && remaining <= 10*60*1000;
  const lessThan1 = remaining > 0 && remaining <= 60*1000;

  // 警铃：剩余 10 分钟提示一次，结束打铃
  const rang10 = React.useRef(false);
  const rangEnd = React.useRef(false);
  React.useEffect(()=>{
    if(lessThan10 && !rang10.current && remaining > 9*60*1000){
      rang10.current = true;
      playBell("warn");
    }
    if(expired && !rangEnd.current){
      rangEnd.current = true;
      playBell("end");
    }
  }, [remaining]);

  // 阻止意外离开
  React.useEffect(()=>{
    const onKey = (e)=>{
      if(e.key==="Escape"){
        // 退出全屏后再退出考场，让用户能 ESC 退出
        if(document.fullscreenElement){
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, []);

  const totalSec = Math.floor(remaining/1000);
  const hh = Math.floor(totalSec/3600);
  const mm = Math.floor((totalSec%3600)/60);
  const ss = totalSec%60;

  const handleDownload = ()=>{
    onDownloadPaper();
    setDownloaded(true);
  };
  const handleUpload = (perQ)=>{
    const ok = onSubmit(perQ);
    if(ok!==false){
      setShowSubmit(false);
      setTimeout(()=>{
        toast("已提交，即将退出考场", "ok");
        onExit();
      }, 600);
    }
    return ok;
  };

  const handleExit = ()=>{
    if(!sub && !expired){
      if(!confirm("尚未提交答卷。确定要退出考场吗？退出后已下载文件仍可在外部查看，但需在截止前回到考场提交。")) return;
    }
    onExit();
  };

  const countClass = lessThan1 ? "danger" : lessThan10 ? "warn" : "";

  return (
    <div className="real-exam">
      <div className="bell-flash"></div>

      <div className="re-head">
        <div className="re-brand">法 · 泽<small>FA · ZE · ONLINE</small></div>
        <button className="re-exit" onClick={handleExit}>退出考场</button>
      </div>

      <div className="re-stage">
        {/* 左侧：钟 & 倒计时 */}
        <div className="re-clock-wrap">
          <AnalogClock size={300} dark />
          <div className="re-clock-time">{fmtTime(now).slice(11)} · 北京时间</div>
          <div style={{marginTop:24, textAlign:"center"}}>
            <div className="re-count-label">REMAINING</div>
            <div className={"re-count "+countClass}>
              {hh>0 && <>{pad2(hh)}<small>:</small></>}
              {pad2(mm)}<small>:</small>{pad2(ss)}
            </div>
            {lessThan1 && !expired && (
              <div className="re-count-label" style={{color:"#e8867a", marginTop:8}}>最后一分钟</div>
            )}
            {expired && (
              <div className="re-count-label" style={{color:"#e8867a", marginTop:8}}>考试时间已结束</div>
            )}
          </div>
        </div>

        {/* 右侧：考试信息 */}
        <div className="re-info">
          <h3>法泽在线 · 模拟试卷</h3>
          <div className="kv mb-8">
            <span className="k" style={{width:80, display:"inline-block"}}>开考时间</span>
            <span className="v">{fmtTime(exam.startTime)}</span>
          </div>
          <div className="kv mb-8">
            <span className="k" style={{width:80, display:"inline-block"}}>截止时间</span>
            <span className="v">{fmtTime(exam.endTime)}</span>
          </div>
          <div className="kv mb-16">
            <span className="k" style={{width:80, display:"inline-block"}}>考生</span>
            <span className="v">{me.name} <span style={{opacity:.5, marginLeft:6}}>{me.id}</span></span>
          </div>

          <div style={{height:1, background:"rgba(231,225,210,.1)", margin:"16px 0"}}></div>

          <div style={{fontSize:11, letterSpacing:".25em", color:"rgba(231,225,210,.5)", marginBottom:8}}>NOTICE</div>
          <div className="re-notice">{exam.notice || "（无附加须知）"}</div>
        </div>
      </div>

      <div className="re-actions">
        <div className="row gap-12">
          <button className="re-btn ghost" onClick={handleDownload} disabled={expired&&!downloaded}>
            ↓ {downloaded ? "再次下载试卷" : "下载试卷"}
          </button>
          {downloaded && <span style={{fontSize:12, color:"var(--accent-soft)"}}>✓ 已下载</span>}
        </div>
        <div className="row gap-12">
          {!sub ? (
            <>
              <span className="re-files">点击右侧按钮按题上传作答（每题分别上传 · PDF / 图片）</span>
              <button className="re-btn" onClick={()=>setShowSubmit(true)} disabled={expired}>
                {expired ? "已超时" : "按题上传并提交 →"}
              </button>
            </>
          ) : (
            <span style={{color:"var(--accent-soft)", fontSize:13}}>✓ 已提交</span>
          )}
        </div>
      </div>

      {showSubmit && (
        <Modal wide title="按题上传答卷" onClose={()=>setShowSubmit(false)}>
          <div className="muted tiny mb-16">请按题号分别上传作答内容。提交后将自动退出考场。</div>
          <PerQuestionUploader exam={exam} onSubmit={handleUpload} toast={toast} />
        </Modal>
      )}
    </div>
  );
};

Object.assign(window, { Student });
