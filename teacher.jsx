/* ============ 法泽在线 — 教师端 ============ */

const Teacher = ({ state, setState, toast, me, doLogout }) => {
  const [view, setView] = React.useState("exams");
  const [currentExamId, setCurrentExamId] = React.useState(null);
  const [showProfile, setShowProfile] = React.useState(false);

  // 我负责的考试：作为出题人或被加入协同阅卷
  const myExams = state.exams.filter((e) =>
  e.createdBy === me.id || (e.graders || []).includes(me.id)
  );

  // 待批改总数
  const pendingCount = myExams.reduce((acc, e) => {
    const subs = state.submissions.filter((s) => s.examId === e.id);
    const total = subs.length * e.questions.length;
    const done = state.grades.filter((g) => g.examId === e.id).length;
    return acc + (total - done);
  }, 0);

  const unread = state.messages.filter((m) => m.userId === me.id && !m.read).length;
  const myCourseIds = new Set((state.courses || []).filter(c=>c.instructorId===me.id).map(c=>c.id));
  const newQuestions = (state.courseQA || []).filter(q=>myCourseIds.has(q.courseId) && !(q.replies || []).some(r=>r.by===me.id)).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">法泽在线<span className="tag-em">FA · ZE · ONLINE</span></div>
        <div className="section">教学</div>
        <NavItem id="schedule" cur={view} set={(v) => {setView(v);setCurrentExamId(null);}} label="我的课表" />
        <NavItem id="courses" cur={view} set={(v) => {setView(v);setCurrentExamId(null);}} label="课程管理" badge={newQuestions || null} />
        <div className="section">考务</div>
        <NavItem id="exams" cur={view} set={(v) => {setView(v);setCurrentExamId(null);}} label="考试管理" badge={pendingCount || null} />
        <div className="section">沟通</div>
        <NavItem id="inbox" cur={view} set={setView} label="站内消息" badge={unread || null} />

        <div className="me me-clickable" onClick={() => setShowProfile(true)} title="个人设置">
          <div className="avatar">{me.name[0]}</div>
          <div>
            <div className="name">{me.name}</div>
            <div className="role">教师 · {me.subject || ""}</div>
          </div>
          <span className="gear">⚙</span>
          <div className="logout" onClick={(e) => {e.stopPropagation();doLogout();}}>登出</div>
        </div>
      </aside>
      <main className="main">
        {view === "schedule" && <Schedule state={state} setState={setState} toast={toast} me={me} canManage={true} />}
        {view === "courses" && <Courses state={state} setState={setState} toast={toast} me={me} canManage={true} />}
        {view === "exams" && !currentExamId &&
        <TeacherExams state={state} setState={setState} toast={toast} me={me} myExams={myExams}
        onOpen={(eid) => setCurrentExamId(eid)} />
        }
        {view === "exams" && currentExamId &&
        <GradingView state={state} setState={setState} toast={toast} me={me}
        examId={currentExamId} onBack={() => setCurrentExamId(null)} />
        }
        {view === "inbox" && <StudentInbox state={state} setState={setState} me={me} />}
      </main>

      {showProfile && <ProfileModal me={me} state={state} setState={setState} toast={toast} onClose={() => setShowProfile(false)} />}
    </div>);

};

// ============ 考试列表（教师端） ============
const TeacherExams = ({ state, setState, toast, me, myExams, onOpen }) => {
  const [editing, setEditing] = React.useState(null);

  const newExam = () => setEditing({
    id: uid("E"),
    title: "", subject: me.subject || "", notice: "",
    questions: [{ id: "Q1", title: "第一题", maxScore: 20 }],
    startTime: Date.now() + 1000 * 60 * 60 * 24,
    endTime: Date.now() + 1000 * 60 * 60 * 24 * 3,
    paperFile: null, publicRanking: true, realMode: false, duration: 120,
    createdBy: me.id, graders: [me.id],
    _new: true
  });

  const saveExam = (exam) => {
    const next = { ...state };
    const i = next.exams.findIndex((e) => e.id === exam.id);
    const clean = { ...exam };delete clean._new;
    if (i >= 0) next.exams[i] = clean;else
    {
      next.exams.unshift(clean);
      const targets = (state.users || []).filter(u=>u.role==="student");
      next.messages = [
        ...targets.map(u=>makeMessage(u.id, "新考试发布", `新考试《${clean.title}》已发布。\n科目：${clean.subject || "未设置"}\n开始：${fmtTime(clean.startTime)}\n请前往「模拟测试」查看。`, "exam")),
        ...(next.messages || []),
      ];
    }
    setState(next);
    toast(exam._new ? "考试已发布" : "已保存", "ok");
    setEditing(null);
  };

  const removeExam = (id) => {
    if (!confirm("删除该考试将同时清除其提交与批改记录，是否继续？")) return;
    setState({
      ...state,
      exams: state.exams.filter((e) => e.id !== id),
      submissions: state.submissions.filter((s) => s.examId !== id),
      grades: state.grades.filter((g) => g.examId !== id)
    });
    toast("已删除");
  };

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">Teacher · Exams</div>
          <h1>考试管理</h1>
        </div>
        <div className="actions">
          <button className="btn" onClick={newExam}>＋ 发布新考试</button>
        </div>
      </div>

      {myExams.length === 0 ?
      <Empty title="尚未发布过考试" hint='点击右上角"发布新考试"' icon="—" /> :

      <div className="col gap-12">
          {myExams.map((e) => {
          const st = examStatus(e);
          const subs = state.submissions.filter((s) => s.examId === e.id);
          const totalCells = subs.length * e.questions.length;
          const doneCells = state.grades.filter((g) => g.examId === e.id).length;
          const isCreator = e.createdBy === me.id;
          const graderNames = (e.graders || []).map((tid) => {
            const u = state.users.find((x) => x.id === tid);
            return u ? u.name : tid;
          }).join("、");
          return (
            <div key={e.id} className="card">
                <div className="row between mb-8">
                  <div className="row gap-8">
                    <Tag kind={statusTagClass(st)}>{statusLabel(st)}</Tag>
                    {e.realMode && <Tag kind="accent">全真模拟</Tag>}
                    {isCreator ? <Tag>出题人</Tag> : <Tag>协同阅卷</Tag>}
                  </div>
                  <span className="muted tiny mono">{e.id}</span>
                </div>
                <div className="row between" style={{ gap: 24 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{e.title}</h3>
                    <div className="muted tiny mt-8">{e.subject} · {e.questions.length} 题 · 满分 {e.questions.reduce((s, q) => s + q.maxScore, 0)} 分</div>
                    <div className="kv mt-16"><span className="k" style={{ minWidth: 64 }}>开始</span><span className="v mono">{fmtTime(e.startTime)}</span></div>
                    <div className="kv"><span className="k" style={{ minWidth: 64 }}>截止</span><span className="v mono">{fmtTime(e.endTime)}</span></div>
                    <div className="kv"><span className="k" style={{ minWidth: 64 }}>阅卷人</span><span className="v">{graderNames}</span></div>
                    <div className="row gap-12 mt-16">
                      <div className="bar accent" style={{ flex: 1, maxWidth: 280 }}><span style={{ width: totalCells ? `${doneCells / totalCells * 100}%` : "0%" }}></span></div>
                      <span className="mono tiny muted">{doneCells}/{totalCells} 已批</span>
                    </div>
                  </div>
                  <div className="col gap-8" style={{ alignItems: "flex-end" }}>
                    <button className="btn" onClick={() => onOpen(e.id)} disabled={subs.length === 0}>
                      {subs.length === 0 ? "等待提交" : doneCells === totalCells ? "复阅" : "开始阅卷 →"}
                    </button>
                    {isCreator &&
                  <div className="row gap-8">
                        <button className="btn ghost sm" onClick={() => setEditing(e)}>编辑</button>
                        <button className="btn danger sm" onClick={() => removeExam(e.id)}>删除</button>
                      </div>
                  }
                  </div>
                </div>
              </div>);

        })}
        </div>
      }

      {editing &&
      <ExamEditor exam={editing} state={state} me={me}
      onClose={() => setEditing(null)} onSave={saveExam} />
      }
    </div>);

};

// ============ 考试编辑器（教师 / 管理员复用） ============
const ExamEditor = ({ exam, state, me, onClose, onSave }) => {
  const [e, setE] = React.useState({ ...exam });
  const [uploadPct, setUploadPct] = React.useState(null);
  const fileRef = React.useRef();
  const answerFileRef = React.useRef();

  const onFile = async (f) => {
    if (!f) return;
    try {
      setUploadPct(0);
      const file = await uploadRemote(f, setUploadPct);
      setE({ ...e, paperFile: file });
    } catch (err) {
      alert(err.message || "上传失败");
    } finally {
      setUploadPct(null);
    }
  };
  const updQ = (i, patch) => {
    const qs = [...e.questions];
    qs[i] = { ...qs[i], ...patch };
    setE({ ...e, questions: qs });
  };
  const addQ = () => {
    const i = e.questions.length + 1;
    const numStr = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][i - 1] || i;
    setE({ ...e, questions: [...e.questions, { id: "Q" + i, title: `第${numStr}题`, maxScore: 20 }] });
  };
  const delQ = (i) => {
    setE({ ...e, questions: e.questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, id: "Q" + (idx + 1) })) });
  };

  const toggleGrader = (tid) => {
    const set = new Set(e.graders || []);
    if (set.has(tid)) set.delete(tid);else set.add(tid);
    // 出题人始终在列
    if (e.createdBy) set.add(e.createdBy);
    setE({ ...e, graders: [...set] });
  };

  const teachers = state.users.filter((u) => u.role === "teacher");
  const canPublishAnswer = examStatus(e) === "closed";
  const onAnswerFile = async (f) => {
    if (!f) return;
    try {
      setUploadPct(0);
      const file = await uploadRemote(f, setUploadPct);
      setE({ ...e, answerKey: { ...(e.answerKey || {}), file } });
    } catch (err) {
      alert(err.message || "上传失败");
    } finally {
      setUploadPct(null);
    }
  };

  return (
    <Modal wide onClose={onClose} title={exam._new ? "发布新考试" : "编辑考试"}
    foot={<>
        <button className="btn ghost" onClick={onClose}>取消</button>
        <button className="btn" disabled={!e.title} onClick={() => onSave(e)}>保存</button>
      </>}>
      <div className="col">
        <div className="grid cols-2">
          <div className="field"><label>考试名称</label>
            <input className="input" value={e.title} onChange={(ev) => setE({ ...e, title: ev.target.value })} placeholder="如 民法典·物权编 期中模拟" /></div>
          <div className="field"><label>科目</label>
            <input className="input" value={e.subject} onChange={(ev) => setE({ ...e, subject: ev.target.value })} /></div>
          <div className="field"><label>开始时间</label>
            <input className="input" type="datetime-local" value={fmtTimeLocal(e.startTime)} onChange={(ev) => setE({ ...e, startTime: parseLocal(ev.target.value) })} /></div>
          <div className="field"><label>截止时间</label>
            <input className="input" type="datetime-local" value={fmtTimeLocal(e.endTime)} onChange={(ev) => setE({ ...e, endTime: parseLocal(ev.target.value) })} /></div>
        </div>

        <div className="field">
          <label>考试须知</label>
          <textarea className="textarea" value={e.notice} onChange={(ev) => setE({ ...e, notice: ev.target.value })}
          placeholder="本场测试共 X 题，答题时长 X 分钟……" />
        </div>

        <div className="field">
          <label>试卷文件</label>
          {e.paperFile ?
          <div className="file-row">
              <span style={{ color: "var(--accent)" }}>◧</span>
              <span className="name">{e.paperFile.name}</span>
              <span className="size">{fmtBytes(e.paperFile.size)}</span>
              <button className="btn sm subtle" onClick={() => fileRef.current.click()}>重新选择</button>
              <button className="btn sm danger" onClick={() => setE({ ...e, paperFile: null })}>移除</button>
            </div> :

          <div className="dropzone" onClick={() => fileRef.current.click()}>
              <div className="big">点击上传试卷</div>
              <div className="small">支持 PDF / 图片 · 学生将在开始时间后才能下载</div>
            </div>
          }
          <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={(ev) => onFile(ev.target.files[0])} />
          {uploadPct !== null && (
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${uploadPct}%` }}></div>
              <span>{uploadPct}%</span>
            </div>
          )}
        </div>

        <div className="field">
          <label>题目设置（决定按题上传的题号划分）</label>
          <div className="col" style={{ gap: 8 }}>
            {e.questions.map((q, i) =>
            <div key={i} className="row gap-8">
                <span className="mono muted" style={{ width: 30 }}>{q.id}</span>
                <input className="input flex-1" value={q.title} onChange={(ev) => updQ(i, { title: ev.target.value })} />
                <input className="input" style={{ width: 100 }} type="number" value={q.maxScore}
              onChange={(ev) => updQ(i, { maxScore: parseInt(ev.target.value) || 0 })} placeholder="满分" />
                <span className="muted tiny">分</span>
                <button className="btn ghost sm" onClick={() => delQ(i)} disabled={e.questions.length <= 1}>移除</button>
              </div>
            )}
            <button className="btn subtle sm" onClick={addQ}>＋ 新增题目</button>
          </div>
        </div>

        <div className="field">
          <label>阅卷人</label>
          <div className="muted tiny mb-8">出题老师默认为阅卷人，可勾选其他老师共同阅卷。</div>
          <div className="row gap-8" style={{ flexWrap: "wrap" }}>
            {teachers.map((t) => {
              const checked = (e.graders || []).includes(t.id);
              const isCreator = e.createdBy === t.id;
              return (
                <label key={t.id} className="row gap-4" style={{
                  cursor: isCreator ? "not-allowed" : "pointer",
                  padding: "6px 12px", border: "1px solid var(--ink-200)", borderRadius: "999px",
                  background: checked ? "var(--paper-2)" : "#fff",
                  opacity: isCreator ? 0.85 : 1
                }}>
                  <input type="checkbox" checked={checked} disabled={isCreator}
                  onChange={() => toggleGrader(t.id)} />
                  <span style={{ fontSize: 13 }}>{t.name}</span>
                  {isCreator && <span className="tag accent" style={{ fontSize: 10, padding: "0 6px" }}>出题人</span>}
                  {t.subject && <span className="muted tiny">{t.subject}</span>}
                </label>);

            })}
          </div>
        </div>

        <div className="row gap-12" style={{ flexWrap: "wrap" }}>
          <label className="row gap-8" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={e.publicRanking} onChange={(ev) => setE({ ...e, publicRanking: ev.target.checked })} />
            <span>公布排名（学生可见本场排行榜）</span>
          </label>
          <label className="row gap-8" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={!!e.realMode} onChange={(ev) => setE({ ...e, realMode: ev.target.checked })} />
            <span>全真模拟模式（全屏考场 · 模拟时钟 · 打铃）</span>
          </label>
          {e.realMode &&
          <div className="row gap-8" style={{ marginLeft: 24 }}>
              <span className="muted tiny">考试时长（分钟）</span>
              <input className="input" type="number" style={{ width: 100 }}
            value={e.duration || 120}
            onChange={(ev) => setE({ ...e, duration: parseInt(ev.target.value) || 120 })} />
            </div>
          }
        </div>

        <div className="field">
          <label>答案及解析（考试结束后发布）</label>
          {!canPublishAnswer && <div className="muted tiny mb-8">考试尚未结束。结束后可填写文字解析或上传解析文件，已提交学生可查看。</div>}
          <RichTextEditor
            disabled={!canPublishAnswer}
            value={e.answerKey?.content || ""}
            onChange={(html) => setE({ ...e, answerKey: { ...(e.answerKey || {}), content: html } })}
          />
          <div className="mt-12">
            {e.answerKey?.file ? (
              <div className="file-row">
                <span style={{ color: "var(--accent)" }}>◧</span>
                <span className="name">{e.answerKey.file.name}</span>
                <span className="size">{fmtBytes(e.answerKey.file.size)}</span>
                <button className="btn sm subtle" disabled={!canPublishAnswer} onClick={() => answerFileRef.current.click()}>替换解析文件</button>
                <button className="btn sm danger" disabled={!canPublishAnswer} onClick={() => setE({ ...e, answerKey: { ...(e.answerKey || {}), file: null } })}>移除</button>
              </div>
            ) : (
              <button className="btn subtle sm" disabled={!canPublishAnswer} onClick={() => answerFileRef.current.click()}>上传答案解析文件</button>
            )}
            <input ref={answerFileRef} type="file" accept=".pdf,.doc,.docx,image/*" style={{ display: "none" }} onChange={(ev) => onAnswerFile(ev.target.files[0])} />
          </div>
        </div>
      </div>
    </Modal>);

};

const RichTextEditor = ({ value, onChange, disabled }) => {
  const ref = React.useRef();
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) ref.current.innerHTML = value || "";
  }, [value]);
  const exec = (cmd) => {
    if (disabled) return;
    ref.current?.focus();
    document.execCommand(cmd, false, null);
    onChange(ref.current.innerHTML);
  };
  return (
    <div className={"rich-editor" + (disabled ? " disabled" : "")}>
      <div className="rich-toolbar">
        <button type="button" className="btn subtle sm" disabled={disabled} onClick={() => exec("bold")}>B</button>
        <button type="button" className="btn subtle sm" disabled={disabled} onClick={() => exec("underline")}>U</button>
        <button type="button" className="btn subtle sm" disabled={disabled} onClick={() => exec("insertUnorderedList")}>列表</button>
      </div>
      <div
        ref={ref}
        className="rich-input"
        contentEditable={!disabled}
        onInput={(ev) => onChange(ev.currentTarget.innerHTML)}
        data-placeholder={disabled ? "考试结束后可填写答案及解析" : "可输入文字解析，支持加粗、下划线和列表"}
      />
    </div>);
};

// ============ 阅卷（按学生 · 整卷展示） ============
const GradingView = ({ state, setState, toast, me, examId, onBack }) => {
  const exam = state.exams.find((e) => e.id === examId);
  const subs = state.submissions.
  filter((s) => s.examId === examId).
  sort((a, b) => a.studentId.localeCompare(b.studentId));

  const [idx, setIdx] = React.useState(() => {
    // 找到第一个未全批完的
    const firstUngraded = subs.findIndex((s) =>
    !exam.questions.every((q) => state.grades.find((g) => g.examId === examId && g.qid === q.id && g.studentId === s.studentId))
    );
    return firstUngraded >= 0 ? firstUngraded : 0;
  });
  const [hideName, setHideName] = React.useState(true);
  const [activeQ, setActiveQ] = React.useState(exam?.questions[0]?.id);

  // 当前学生的所有题目得分草稿
  const cur = subs[idx];
  const student = cur ? state.users.find((u) => u.id === cur.studentId) : null;

  const myGrade = (qid) => state.grades.find((g) => g.examId === examId && g.qid === qid && g.studentId === cur.studentId);

  const [draft, setDraft] = React.useState({}); // { qid: {score, comment} }
  React.useEffect(() => {
    if (!cur) return;
    const next = {};
    exam.questions.forEach((q) => {
      const g = myGrade(q.id);
      next[q.id] = { score: g ? String(g.score) : "", comment: g?.comment || "" };
    });
    setDraft(next);
    setActiveQ(exam.questions[0]?.id);
  }, [idx, cur?.studentId]);

  if (!exam) return <Empty title="考试不存在" />;
  if (subs.length === 0) return (
    <div>
      <div className="row gap-8 mb-16" style={{ color: "var(--ink-500)", cursor: "pointer", fontSize: 13 }} onClick={onBack}>← 返回考试列表</div>
      <Empty title="尚无学生提交" hint="待学生在截止前提交答卷后即可阅卷" icon="—" />
    </div>);


  const setQ = (qid, patch) => setDraft((d) => ({ ...d, [qid]: { ...d[qid], ...patch } }));

  // 保存：所有有效输入的题
  const saveCurrent = (autoNext = true) => {
    const nextState = { ...state };
    let savedQs = [];
    for (const q of exam.questions) {
      const d = draft[q.id];
      if (!d || d.score === "" || isNaN(parseInt(d.score))) continue;
      const sc = parseInt(d.score);
      if (sc < 0 || sc > q.maxScore) {
        toast(`${q.id} 分数需在 0 — ${q.maxScore} 之间`, "danger");
        return;
      }
      nextState.grades = nextState.grades.filter((g) => !(g.examId === examId && g.qid === q.id && g.studentId === cur.studentId));
      nextState.grades.push({
        examId, qid: q.id, studentId: cur.studentId,
        score: sc, comment: d.comment || "",
        gradedBy: me.id, gradedAt: Date.now()
      });
      savedQs.push(q.id);
    }

    // 若全部题目都批完，给该学生发通知
    const allGradedNow = exam.questions.every((qq) => {
      return nextState.grades.find((g) => g.examId === examId && g.qid === qq.id && g.studentId === cur.studentId);
    });
    const alreadyNotified = nextState.messages.find((m) =>
    m.userId === cur.studentId && m.title === `《${exam.title}》阅卷完成`);
    if (allGradedNow && !alreadyNotified) {
      nextState.messages.unshift({
        id: uid("M"), userId: cur.studentId,
        title: `《${exam.title}》阅卷完成`,
        body: `您参加的《${exam.title}》已全部完成阅卷。\n请前往「我的成绩」查看本场详情。${exam.publicRanking ? "\n本场已公布排名，可在「排行榜」中查看。" : ""}`,
        time: Date.now(), read: false
      });
    }

    setState(nextState);
    if (savedQs.length === 0) {toast("尚未填写任何分数", "danger");return;}
    toast(`已保存 ${savedQs.length} 题`, "ok");

    if (autoNext) {
      let n = idx + 1;
      while (n < subs.length) {
        const s = subs[n];
        const done = exam.questions.every((q) => nextState.grades.find((g) => g.examId === examId && g.qid === q.id && g.studentId === s.studentId));
        if (!done) break;
        n++;
      }
      if (n < subs.length) setIdx(n);
    }
  };

  const q = exam.questions.find((qq) => qq.id === activeQ);
  const ans = cur ? (cur.answers || []).find((a) => a.qid === activeQ) : null;
  const allDoneForCur = cur && exam.questions.every((qq) => {
    const g = state.grades.find((g) => g.examId === examId && g.qid === qq.id && g.studentId === cur.studentId);
    return !!g;
  });

  const commentChips = [
  "答题思路清晰，逻辑完整。",
  "概念基本准确，论证略显薄弱。",
  "请注意引用法条与具体条款。",
  "论述结构需更紧凑。",
  "举例可以更贴合题意。",
  "整体良好，注意收束。"];


  return (
    <div>
      <div className="row gap-8 mb-16" style={{ color: "var(--ink-500)", cursor: "pointer", fontSize: 13 }} onClick={onBack}>
        ← 返回考试列表
      </div>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="title">
          <div className="eyebrow">{exam.title}</div>
          <h1>阅卷 · {hideName ? `考生 ${pad2(idx + 1)}` : student?.name}</h1>
        </div>
        <div className="row gap-12">
          <label className="row gap-4" style={{ cursor: "pointer", fontSize: 12, color: "var(--ink-600)" }}>
            <input type="checkbox" checked={hideName} onChange={(e) => setHideName(e.target.checked)} />
            匿名阅卷
          </label>
          {cur?.delayStatus === "late" && <Tag kind="danger">延迟交卷</Tag>}
          {cur?.delayStatus === "grace" && <Tag kind="warn">宽限期提交</Tag>}
          <Tag>{idx + 1} / {subs.length}</Tag>
        </div>
      </div>

      {/* 学生导航 */}
      <div className="card mb-16" style={{ padding: "14px 18px" }}>
        <div className="grader-progress">
          {subs.map((s, i) => {
            const doneAll = exam.questions.every((qq) => state.grades.find((g) => g.examId === examId && g.qid === qq.id && g.studentId === s.studentId));
            return (
              <div key={i}
              className={"pip " + (doneAll ? "done" : "") + (i === idx ? " cur" : "")}
              onClick={() => setIdx(i)}
              title={hideName ? "考生 " + (i + 1) : state.users.find((u) => u.id === s.studentId)?.name}>
                {i + 1}
              </div>);

          })}
        </div>
      </div>

      <div className="grade-shell">
        {/* 左：答卷展示 + 题目切换 */}
        <div>
          <div className="card mb-16" style={{ padding: "10px 14px" }}>
            <div className="tabs" style={{ borderBottom: "none", margin: 0, gap: 2, flexWrap: "wrap" }}>
              {exam.questions.map((qq) => {
                const ga = state.grades.find((g) => g.examId === examId && g.qid === qq.id && g.studentId === cur?.studentId);
                return (
                  <div key={qq.id}
                  className={"tab" + (activeQ === qq.id ? " active" : "")}
                  onClick={() => setActiveQ(qq.id)}
                  style={{ padding: "8px 12px" }}>
                    {qq.id}
                    {ga && <span style={{ marginLeft: 6, color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 11 }}>{ga.score}</span>}
                  </div>);

              })}
            </div>
          </div>

          <div className="grade-image">
            <div className="placeholder">
              <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--ink-700)" }}>
                {hideName ? `考生 ${pad2(idx + 1)}` : student?.name} · {activeQ}
              </div>
              {ans && ans.files.length > 0 ?
              <div style={{ marginTop: 16, width: "100%", maxWidth: 380 }}>
                  <div className="muted tiny mb-8 center">学生上传的本题作答 · 共 {ans.files.length} 个文件</div>
                  <div className="col gap-4">
                    {ans.files.map((f, fi) =>
                  <div key={fi} className="file-row" style={{ background: "#fff" }}>
                        <span style={{ color: "var(--accent)" }}>◧</span>
                        <span className="name">{f.name}</span>
                        <span className="size">{fmtBytes(f.size)}</span>
                        {f.url && <a className="btn subtle sm" href={f.url} download={f.name}>下载</a>}
                      </div>
                  )}
                  </div>
                  <div className="muted tiny mt-16 center">
                    （示例占位 · 真实环境下显示对应作答图像或 PDF 内容）
                  </div>
                </div> :

              <div className="muted">学生未提交本题作答</div>
              }
            </div>
          </div>
        </div>

        {/* 右：评分区 */}
        <div className="grade-side">
          <div className="muted tiny" style={{ letterSpacing: ".25em" }}>当前批阅</div>
          <h3 className="mt-8">{q?.title}</h3>
          {!hideName && student && <div className="muted tiny mono mt-8">{student.id} · {student.className}</div>}

          <div className="divider"></div>

          <div className="field">
            <label>{q?.id} 得分（满分 {q?.maxScore}）</label>
            <input className="input" type="number" min={0} max={q?.maxScore} value={draft[activeQ]?.score || ""}
            onChange={(e) => setQ(activeQ, { score: e.target.value })} placeholder="输入分数" />
            <div className="row gap-4 mt-8" style={{ flexWrap: "wrap" }}>
              {[1, 0.85, 0.7, 0.5, 0].map((r) => {
                const v = Math.floor((q?.maxScore || 0) * r);
                return <button key={r} className="btn subtle sm" onClick={() => setQ(activeQ, { score: String(v) })}>{v}</button>;
              })}
            </div>
          </div>

          <div className="field">
            <label>{q?.id} 批注</label>
            <textarea className="textarea" value={draft[activeQ]?.comment || ""}
            onChange={(e) => setQ(activeQ, { comment: e.target.value })}
            placeholder="写下对该题的批注…" style={{ minHeight: 80 }} />
            <div className="row gap-4 mt-8" style={{ flexWrap: "wrap" }}>
              {commentChips.map((c) =>
              <button key={c} className="btn subtle sm" style={{ fontSize: 11 }}
              onClick={() => setQ(activeQ, { comment: (draft[activeQ]?.comment || "") + (draft[activeQ]?.comment ? draft[activeQ].comment.endsWith("。") ? " " : "。" : "") + c })}>
                  ＋ {c.slice(0, 8)}
                </button>
              )}
            </div>
          </div>

          {/* 快速跳到下一题 */}
          <div className="row gap-8 mt-8">
            <button className="btn ghost sm" style={{ flex: 1 }}
            onClick={() => {
              const i = exam.questions.findIndex((qq) => qq.id === activeQ);
              if (i > 0) setActiveQ(exam.questions[i - 1].id);
            }} disabled={exam.questions[0].id === activeQ}>← 上一题</button>
            <button className="btn ghost sm" style={{ flex: 1 }}
            onClick={() => {
              const i = exam.questions.findIndex((qq) => qq.id === activeQ);
              if (i < exam.questions.length - 1) setActiveQ(exam.questions[i + 1].id);
            }} disabled={exam.questions[exam.questions.length - 1].id === activeQ}>下一题 →</button>
          </div>

          <div className="divider"></div>

          <div className="row gap-8">
            <button className="btn ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← 上一份</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => saveCurrent(true)}>保存并下一份 →</button>
          </div>
          <div className="row mt-8">
            <button className="btn subtle sm" style={{ flex: 1 }} onClick={() => saveCurrent(false)}>仅保存</button>
            <button className="btn subtle sm" style={{ flex: 1 }}
            onClick={() => setIdx(Math.min(subs.length - 1, idx + 1))} disabled={idx === subs.length - 1}>跳过</button>
          </div>

          {allDoneForCur &&
          <div className="muted tiny mt-16" style={{ textAlign: "center" }}>该考生已批改完毕 · 复阅模式</div>
          }
        </div>
      </div>
    </div>);

};

Object.assign(window, { Teacher, ExamEditor });
