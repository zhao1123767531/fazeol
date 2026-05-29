/* ============ 法泽在线 — 课程学习模块 ============ */
/* 同时为学生（浏览）、教师/管理员（管理）提供入口 */

const SUBJECTS = ["民法","刑法","法理学","宪法","行政法","民事诉讼","刑事诉讼","商法","经济法","国际法"];
const SUBJECT_SHORT = {
  "民法":"民法", "刑法":"刑法", "法理学":"法理", "宪法":"宪法",
  "行政法":"行政", "民事诉讼":"民诉", "刑事诉讼":"刑诉",
  "商法":"商法", "经济法":"经济", "国际法":"国际",
};
const subjectShort = (s)=> SUBJECT_SHORT[s] || String(s || "课程").slice(0,2);

const KIND_LABEL = { video:"视频", pdf:"讲义", article:"图文" };
const KIND_GLYPH = { video:"▶", pdf:"◧", article:"❖" };

const Courses = ({state, setState, toast, me, canManage})=>{
  const [subj, setSubj] = React.useState("全部");
  const [openId, setOpenId] = React.useState(null);
  const [editing, setEditing] = React.useState(null);

  const courses = (state.courses||[]).filter(c=> subj==="全部" ? true : c.subject===subj);
  const open = (state.courses||[]).find(c=>c.id===openId);

  const saveCourse = (c)=>{
    const next = {...state, courses: [...(state.courses||[])]};
    const idx = next.courses.findIndex(x=>x.id===c.id);
    if(idx>=0) next.courses[idx] = c;
    else next.courses.unshift({...c, createdAt: Date.now()});
    setState(next);
    toast(idx>=0 ? "课程已保存" : "课程已创建", "ok");
    setEditing(null);
  };

  const removeCourse = (id)=>{
    if(!confirm("删除课程将同时清除所有课时，确认？")) return;
    setState({...state, courses: (state.courses||[]).filter(c=>c.id!==id)});
    setOpenId(null);
    toast("已删除");
  };

  // 学科分布统计
  const allCourses = state.courses || [];
  const counts = SUBJECTS.reduce((m,s)=>{ m[s] = allCourses.filter(c=>c.subject===s).length; return m; }, {全部: allCourses.length});

  if(open){
    return (
      <CourseDetail
        course={open} state={state} setState={setState} toast={toast} me={me}
        canManage={canManage}
        onBack={()=>setOpenId(null)}
        onEdit={()=>setEditing(open)}
        onRemove={()=>removeCourse(open.id)}
      />
    );
  }

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">{canManage ? "Manage · Courses" : "Student · Courses"}</div>
          <h1>课程学习</h1>
        </div>
        {canManage && (
          <div className="actions">
            <button className="btn" onClick={()=>setEditing({
              id: uid("C"), subject: SUBJECTS[0], title:"", description:"",
              instructor: me.name, instructorId: me.id,
              cover:"#3b4d6f", lessons:[], _new:true,
            })}>＋ 新建课程</button>
          </div>
        )}
      </div>

      {/* 学科筛选 */}
      <div className="subj-chips mb-24">
        {["全部", ...SUBJECTS].map(s=>(
          <div key={s} className={"subj-chip"+(subj===s?" active":"")+(!counts[s]&&s!=="全部"?" empty":"")}
            onClick={()=>setSubj(s)}>
            {s}<span className="cnt">{counts[s]||0}</span>
          </div>
        ))}
      </div>

      {courses.length===0 ? (
        <Empty title={subj==="全部"?"尚无课程":`${subj} 学科暂无课程`}
          hint={canManage?'点击右上角"新建课程"创建':"待教师上传课程后将在此显示"} icon="—" />
      ) : (
        <div className="grid cols-3">
          {courses.map(c=>(
            <div key={c.id} className="course-card" onClick={()=>setOpenId(c.id)}>
              <div className="course-cover" style={{background: c.cover || "#3b4d6f"}}>
                <div className="subj-tag">{subjectShort(c.subject)}</div>
                <div className="cover-mark">{subjectShort(c.subject)}</div>
              </div>
              <div className="course-body">
                <h3>{c.title}</h3>
                <div className="muted tiny mt-8">主讲 · {c.instructor}</div>
                <div className="row gap-8 mt-16">
                  <span className="muted tiny">{c.lessons.length} 课时</span>
                  <span className="muted tiny" style={{marginLeft:"auto"}}>{fmtRel(c.createdAt||Date.now())}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CourseEditor course={editing} onClose={()=>setEditing(null)} onSave={saveCourse} />
      )}
    </div>
  );
};

// ============ 课程详情 ============
const CourseDetail = ({course, state, setState, toast, me, canManage, onBack, onEdit, onRemove})=>{
  const [openLesson, setOpenLesson] = React.useState(course.lessons[0]?.id);
  const lesson = course.lessons.find(l=>l.id===openLesson);

  // 学习进度（仅学生有意义；存于 state.progress）
  const progress = state.progress || {};
  const key = `${me.id}:${course.id}`;
  const myProg = progress[key] || { completed: [] };
  const toggleDone = (lid)=>{
    const set = new Set(myProg.completed);
    set.has(lid) ? set.delete(lid) : set.add(lid);
    const np = {...progress, [key]:{ completed:[...set] }};
    setState({...state, progress: np});
  };

  const completed = myProg.completed.length;
  const total = course.lessons.length;

  const addLesson = ()=>{
    const idx = course.lessons.length + 1;
    const newL = {
      id: uid("L"), title:`第${idx}讲`, kind:"video", duration:"",
      file:null, content:"", createdAt: Date.now(), createdBy: me.id,
    };
    const next = {...course, lessons:[...course.lessons, newL]};
    saveCourseInState(next);
    setOpenLesson(newL.id);
    toast("已新增课时，请编辑内容", "ok");
  };

  const saveCourseInState = (c)=>{
    setState({...state, courses: state.courses.map(x=>x.id===c.id?c:x)});
  };

  const updLesson = (lid, patch)=>{
    const next = {...course, lessons: course.lessons.map(l=>l.id===lid?{...l, ...patch}:l)};
    saveCourseInState(next);
  };

  const delLesson = (lid)=>{
    if(!confirm("删除该课时？")) return;
    const next = {...course, lessons: course.lessons.filter(l=>l.id!==lid)};
    saveCourseInState(next);
    setOpenLesson(next.lessons[0]?.id);
    toast("已删除");
  };

  return (
    <div>
      <div className="row gap-8 mb-16" style={{color:"var(--ink-500)", cursor:"pointer", fontSize:13}} onClick={onBack}>
        ← 返回课程列表
      </div>

      <div className="course-hero" style={{background:`linear-gradient(135deg, ${course.cover} 0%, ${course.cover}cc 100%)`}}>
        <div className="row gap-8 mb-8" style={{opacity:.85}}>
          <span className="tag" style={{background:"rgba(255,255,255,.15)", color:"#fff", border:"none"}}>{subjectShort(course.subject)}</span>
          <span className="muted tiny" style={{color:"rgba(255,255,255,.7)"}}>{course.lessons.length} 课时</span>
        </div>
        <h1 style={{color:"#fff", fontSize:32, maxWidth:680}}>{course.title}</h1>
        <div style={{color:"rgba(255,255,255,.85)", maxWidth:680, marginTop:8, lineHeight:1.7}}>{course.description}</div>
        <div className="row between mt-24">
          <div>
            <div className="tiny" style={{color:"rgba(255,255,255,.6)", letterSpacing:".2em"}}>主讲教师</div>
            <div style={{color:"#fff", fontFamily:"var(--serif)", fontSize:18, marginTop:4}}>{course.instructor}</div>
          </div>
          {!canManage && total > 0 && (
            <div style={{textAlign:"right"}}>
              <div className="tiny" style={{color:"rgba(255,255,255,.6)", letterSpacing:".2em"}}>我的进度</div>
              <div style={{color:"#fff", fontFamily:"var(--serif)", fontSize:18, marginTop:4}}>{completed}/{total}</div>
            </div>
          )}
          {canManage && (
            <div className="row gap-8">
              <button className="btn subtle sm" onClick={onEdit}>编辑课程信息</button>
              <button className="btn danger sm" onClick={onRemove}>删除课程</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid mt-24" style={{gridTemplateColumns:"320px 1fr", gap:20}}>
        {/* 课时目录 */}
        <div className="card" style={{padding:0, height:"fit-content"}}>
          <div className="row between" style={{padding:"14px 16px", borderBottom:"1px solid var(--ink-100)"}}>
            <h3 style={{fontSize:14}}>课时目录</h3>
            {canManage && <button className="btn subtle sm" onClick={addLesson}>＋ 新增</button>}
          </div>
          {course.lessons.length===0 ? (
            <div className="empty"><div className="t">尚无课时</div></div>
          ) : course.lessons.map((l, i)=>{
            const done = myProg.completed.includes(l.id);
            return (
              <div key={l.id}
                className={"lesson-row"+(openLesson===l.id?" active":"")}
                onClick={()=>setOpenLesson(l.id)}>
                <div className="lesson-num">{pad2(i+1)}</div>
                <div className="lesson-body">
                  <div className="lesson-title">{l.title}</div>
                  <div className="lesson-meta">
                    <span className="glyph">{KIND_GLYPH[l.kind]}</span>
                    {KIND_LABEL[l.kind]}
                    {l.duration && <span style={{marginLeft:6}}>· {l.duration}</span>}
                  </div>
                </div>
                {!canManage && done && <span className="tag ok" style={{fontSize:10}}>已学</span>}
              </div>
            );
          })}
        </div>

        {/* 课时内容 */}
        <div>
          {lesson ? (
            <LessonView
              lesson={lesson} course={course} canManage={canManage}
              isDone={myProg.completed.includes(lesson.id)}
              onToggleDone={()=>toggleDone(lesson.id)}
              onUpdate={(patch)=>updLesson(lesson.id, patch)}
              onDelete={()=>delLesson(lesson.id)}
              toast={toast}
              state={state} setState={setState} me={me}
            />
          ) : (
            <Empty title="选择左侧课时查看内容" icon="—" />
          )}
        </div>
      </div>
    </div>
  );
};

// ============ 单个课时 ============
const LessonView = ({lesson, course, canManage, isDone, onToggleDone, onUpdate, onDelete, toast, state, setState, me})=>{
  const [edit, setEdit] = React.useState(false);
  const [draft, setDraft] = React.useState({...lesson});
  const [uploadPct, setUploadPct] = React.useState(null);
  const fileRef = React.useRef();

  React.useEffect(()=>{ setDraft({...lesson}); setEdit(false); }, [lesson.id]);

  const onFile = async (f)=>{
    if(!f) return;
    try{
      setUploadPct(0);
      const file = await uploadRemote(f, setUploadPct);
      const nextDraft = {...draft, file};
      setDraft(nextDraft);
      onUpdate(nextDraft);
      toast("文件已上传并保存", "ok");
    }catch(err){
      toast(err.message || "上传失败", "danger");
    }finally{
      setUploadPct(null);
    }
  };

  if(edit){
    return (
      <div className="card">
        <div className="row between mb-16">
          <h3>编辑课时</h3>
          <div className="row gap-8">
            <button className="btn ghost sm" onClick={()=>{setDraft({...lesson}); setEdit(false);}}>取消</button>
            <button className="btn sm" onClick={()=>{ onUpdate(draft); setEdit(false); toast("已保存","ok"); }}>保存</button>
          </div>
        </div>

        <div className="grid cols-2 gap-12">
          <div className="field"><label>标题</label>
            <input className="input" value={draft.title} onChange={e=>setDraft({...draft, title:e.target.value})} /></div>
          <div className="field"><label>类型</label>
            <select className="select" value={draft.kind} onChange={e=>setDraft({...draft, kind:e.target.value})}>
              <option value="video">视频</option>
              <option value="pdf">讲义 / PDF</option>
              <option value="article">图文 / 文字</option>
            </select></div>
          <div className="field"><label>时长 / 篇幅（选填）</label>
            <input className="input" value={draft.duration||""} onChange={e=>setDraft({...draft, duration:e.target.value})} placeholder="如 45:20、18 页、5 分钟" /></div>
        </div>

        {draft.kind === "article" ? (
          <div className="field"><label>正文内容</label>
            <textarea className="textarea" value={draft.content||""} onChange={e=>setDraft({...draft, content:e.target.value})}
              style={{minHeight:200}} placeholder="撰写课时正文…" /></div>
        ) : (
          <div className="field"><label>上传文件（{draft.kind==="video"?"视频":"PDF"}）</label>
            {draft.file ? (
              <div className="file-row">
                <span style={{color:"var(--accent)"}}>{KIND_GLYPH[draft.kind]}</span>
                <span className="name">{draft.file.name}</span>
                <span className="size">{fmtBytes(draft.file.size)}</span>
                <button className="btn subtle sm" onClick={()=>fileRef.current.click()}>替换</button>
                <button className="btn danger sm" onClick={()=>setDraft({...draft, file:null})}>移除</button>
              </div>
            ) : (
              <div className="dropzone" onClick={()=>fileRef.current.click()}>
                <div className="big">点击上传</div>
                <div className="small">{draft.kind==="video"?"支持 mp4 / mov":"支持 PDF"}</div>
              </div>
            )}
            <input ref={fileRef} type="file"
              accept={draft.kind==="video"?"video/*":".pdf"}
              style={{display:"none"}} onChange={e=>onFile(e.target.files[0])} />
            {uploadPct !== null && (
              <div className="upload-progress">
                <div className="upload-progress-bar" style={{width:`${uploadPct}%`}}></div>
                <span>{uploadPct}%</span>
              </div>
            )}
          </div>
        )}

        <div className="row mt-16">
          <button className="btn danger sm" onClick={onDelete}>删除课时</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-16">
        <div className="row between mb-16">
          <div>
            <div className="muted tiny">{KIND_LABEL[lesson.kind]} {lesson.duration && `· ${lesson.duration}`}</div>
            <h2 className="mt-8">{lesson.title}</h2>
          </div>
          <div className="row gap-8">
            {!canManage && (
              <button className={"btn "+(isDone?"subtle":"")} onClick={onToggleDone}>
                {isDone ? "✓ 已学完" : "标为已学"}
              </button>
            )}
            {canManage && <button className="btn ghost sm" onClick={()=>setEdit(true)}>编辑</button>}
          </div>
        </div>

        {/* 内容预览区 */}
        {lesson.kind === "video" && (
          <div>
            {lesson.file?.url ? (
              <VideoPlayer lesson={lesson} />
            ) : (
              <div className="video-stage">
                <div className="play-btn">▶</div>
                <div className="vid-meta">
                  <div className="muted tiny">视频文件</div>
                  <div style={{fontFamily:"var(--mono)", fontSize:13, marginTop:4}}>{lesson.file?.name || "未上传"}</div>
                  {lesson.file && <div className="muted tiny mt-8">{fmtBytes(lesson.file.size)}{lesson.duration && ` · ${lesson.duration}`}</div>}
                </div>
                <div className="vid-shimmer"></div>
              </div>
            )}
            <div className="row between mt-12">
              <div className="muted tiny">{lesson.file?.name || "尚未上传视频"}</div>
              {lesson.file?.url && <a className="btn subtle sm" href={lesson.file.url} download={lesson.file.name}>下载视频</a>}
            </div>
          </div>
        )}
        {lesson.kind === "pdf" && (
          <div className="pdf-stage">
            <div className="pdf-cover">
              <div style={{fontFamily:"var(--serif)", fontSize:18, color:"var(--ink-700)"}}>{lesson.title}</div>
              <div className="muted tiny mt-8 mono">{lesson.file?.name}</div>
            </div>
            {lesson.file?.url ? (
              <a className="btn mt-16" href={lesson.file.url} download={lesson.file.name}>↓ 下载讲义</a>
            ) : (
              <button className="btn mt-16" onClick={()=>toast("尚未上传文件", "danger")}>↓ 下载讲义</button>
            )}
          </div>
        )}
        {lesson.kind === "article" && (
          <div className="article-stage">
            {lesson.content ? (
              <div style={{whiteSpace:"pre-wrap", lineHeight:1.85, fontSize:15}}>{lesson.content}</div>
            ) : <div className="muted">（暂无正文内容）</div>}
          </div>
        )}
      </div>

      {/* 笔记区（学生） */}
      {!canManage && <LessonNotes lessonId={lesson.id} courseId={course.id} />}

      {/* 课程问答（所有人可见，学生可问，老师可答） */}
      <LessonQA
        course={course} lesson={lesson}
        state={state} setState={setState} me={me} canManage={canManage} toast={toast}
      />
    </div>
  );
};

const VideoPlayer = ({lesson})=>{
  const ref = React.useRef();
  const [speed, setSpeed] = React.useState(1);
  const [muted, setMuted] = React.useState(false);

  const setRate = (rate) => {
    setSpeed(rate);
    if(ref.current) ref.current.playbackRate = rate;
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if(ref.current) ref.current.muted = next;
  };

  return (
    <div className="player-shell">
      <video ref={ref} className="video-player" src={lesson.file.url} controls preload="metadata" playsInline></video>
      <div className="player-toolbar">
        <div className="muted tiny mono">{lesson.file.name}</div>
        <div className="row gap-8">
          <button className="btn subtle sm" onClick={()=>{
            if(ref.current) ref.current.requestPictureInPicture?.();
          }}>画中画</button>
          <button className="btn subtle sm" onClick={toggleMute}>{muted ? "取消静音" : "静音"}</button>
          <select className="select sm-select" value={speed} onChange={(e)=>setRate(Number(e.target.value))}>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ============ 课程问答 ============
const LessonQA = ({course, lesson, state, setState, me, canManage, toast})=>{
  const [text, setText] = React.useState("");
  const [replyOf, setReplyOf] = React.useState(null);
  const [replyText, setReplyText] = React.useState("");

  const allQA = state.courseQA || [];
  const thread = allQA.filter(q=> q.courseId===course.id && q.lessonId===lesson.id)
    .sort((a,b)=> b.time - a.time);

  const isTeacherOfCourse = me.role==="teacher" && course.instructorId===me.id;

  const ask = ()=>{
    if(!text.trim()) return;
    const q = {
      id: uid("Q"), courseId: course.id, lessonId: lesson.id,
      studentId: me.id, text: text.trim(), time: Date.now(), replies: [],
    };
    const next = {...state, courseQA: [q, ...(state.courseQA||[])]};
    // 通知课程主讲教师
    if(course.instructorId && course.instructorId !== me.id){
      next.messages = [{
        id: uid("M"), userId: course.instructorId,
        title: `《${course.title}》收到学生提问`,
        body: `${me.name}（${me.id}）在「${lesson.title}」中提问：\n\n${text.trim()}\n\n请前往「课程管理」中的对应课时回复。`,
        time: Date.now(), read: false,
      }, ...(next.messages||[])];
    }
    setState(next);
    setText("");
    toast("已提交问题，老师将尽快回复", "ok");
  };

  const reply = (qid)=>{
    if(!replyText.trim()) return;
    const target = allQA.find(x=>x.id===qid);
    if(!target) return;
    const r = { id: uid("R"), by: me.id, text: replyText.trim(), time: Date.now() };
    const next = {
      ...state,
      courseQA: state.courseQA.map(q=> q.id===qid ? {...q, replies:[...(q.replies||[]), r]} : q),
    };
    // 通知提问的学生
    if(target.studentId && target.studentId !== me.id){
      next.messages = [{
        id: uid("M"), userId: target.studentId,
        title: `老师回复了您的提问`,
        body: `《${course.title}》「${lesson.title}」中您的提问已得到回复：\n\n${replyText.trim()}\n\n请前往「课程学习」查看完整对话。`,
        time: Date.now(), read: false,
      }, ...(next.messages||[])];
    }
    setState(next);
    setReplyText("");
    setReplyOf(null);
    toast("回复已发送", "ok");
  };

  const delQA = (qid)=>{
    if(!confirm("删除该提问及其所有回复？")) return;
    setState({...state, courseQA: state.courseQA.filter(q=>q.id!==qid)});
  };

  const nameOf = (uid)=> state.users.find(u=>u.id===uid)?.name || uid;
  const roleOf = (uid)=> state.users.find(u=>u.id===uid)?.role;

  return (
    <div className="card mt-16">
      <div className="row between mb-16">
        <h3>课程问答</h3>
        <span className="muted tiny">本课时共 {thread.length} 条提问</span>
      </div>

      {/* 提问框：学生 + 任何人都可以问 */}
      {me.role !== "teacher" || !isTeacherOfCourse ? (
        <div className="mb-16">
          <textarea className="textarea" value={text} onChange={e=>setText(e.target.value)}
            placeholder={`向 ${course.instructor} 老师提问…`}
            style={{minHeight:60}} />
          <div className="row end mt-8">
            <button className="btn sm" disabled={!text.trim()} onClick={ask}>提交提问</button>
          </div>
        </div>
      ) : null}

      {thread.length === 0 ? (
        <div className="muted center" style={{padding:"20px 0"}}>暂无提问，欢迎在此提出疑问。</div>
      ) : (
        thread.map(q=>(
          <div key={q.id} className="qa-thread">
            <div className="qa-q">
              <div className="qa-avatar">{nameOf(q.studentId)[0]}</div>
              <div className="qa-body">
                <div className="qa-head">
                  <span className="qa-name">{nameOf(q.studentId)}</span>
                  <span className="muted tiny">{state.users.find(u=>u.id===q.studentId)?.className||""}</span>
                  <span className="qa-time" style={{marginLeft:"auto"}}>{fmtRel(q.time)}</span>
                </div>
                <div className="qa-text">{q.text}</div>
              </div>
            </div>

            {(q.replies||[]).map(r=>(
              <div key={r.id} className="qa-reply">
                <div className={"qa-avatar"+(roleOf(r.by)==="teacher"?" teacher":"")}>{nameOf(r.by)[0]}</div>
                <div className="qa-body">
                  <div className="qa-head">
                    <span className="qa-name">{nameOf(r.by)}</span>
                    {roleOf(r.by)==="teacher" && <Tag kind="accent">教师</Tag>}
                    <span className="qa-time" style={{marginLeft:"auto"}}>{fmtRel(r.time)}</span>
                  </div>
                  <div className="qa-text">{r.text}</div>
                </div>
              </div>
            ))}

            {/* 回复区 */}
            {isTeacherOfCourse && (
              <div className="qa-replybox">
                {replyOf === q.id ? (
                  <div>
                    <textarea className="textarea" value={replyText} onChange={e=>setReplyText(e.target.value)}
                      placeholder="撰写回复…" style={{minHeight:60}} autoFocus />
                    <div className="row end gap-8 mt-8">
                      <button className="btn ghost sm" onClick={()=>{setReplyOf(null); setReplyText("");}}>取消</button>
                      <button className="btn sm" disabled={!replyText.trim()} onClick={()=>reply(q.id)}>发送回复</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn ghost sm" onClick={()=>setReplyOf(q.id)}>＋ 回复</button>
                )}
              </div>
            )}

            {(q.studentId === me.id || isTeacherOfCourse) && (
              <div className="row end mt-8">
                <button className="btn danger sm" onClick={()=>delQA(q.id)}>删除</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// 学生本地笔记（localStorage）
const LessonNotes = ({lessonId, courseId})=>{
  const k = `note:${courseId}:${lessonId}`;
  const [note, setNote] = React.useState(()=> localStorage.getItem(k) || "");
  const [saved, setSaved] = React.useState(false);
  React.useEffect(()=>{
    setNote(localStorage.getItem(k) || "");
  }, [k]);
  return (
    <div className="card">
      <div className="row between mb-16">
        <h3>我的笔记</h3>
        <span className="muted tiny">{saved ? "已保存" : "本地保存 · 不会上传"}</span>
      </div>
      <textarea className="textarea" value={note}
        onChange={e=>{ setNote(e.target.value); localStorage.setItem(k, e.target.value); setSaved(true); setTimeout(()=>setSaved(false), 800); }}
        placeholder="记下要点、疑问、引用条文……" style={{minHeight:120}} />
    </div>
  );
};

// ============ 课程编辑（基本信息） ============
const CourseEditor = ({course, onClose, onSave})=>{
  const [c, setC] = React.useState({...course});
  const covers = ["#3b4d6f","#5a3a3a","#3a5a4a","#5a4a3a","#3a4a5a","#5a3a5a","#1a2538"];
  return (
    <Modal wide onClose={onClose} title={course._new?"新建课程":"编辑课程信息"}
      foot={<>
        <button className="btn ghost" onClick={onClose}>取消</button>
        <button className="btn" disabled={!c.title} onClick={()=>{
          const clean = {...c}; delete clean._new;
          onSave(clean);
        }}>保存</button>
      </>}>
      <div className="grid cols-2 gap-12">
        <div className="field"><label>课程名称</label>
          <input className="input" value={c.title} onChange={e=>setC({...c, title:e.target.value})} placeholder="如 民法典·物权编精讲" /></div>
        <div className="field"><label>所属学科</label>
          <select className="select" value={c.subject} onChange={e=>setC({...c, subject:e.target.value})}>
            {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select></div>
        <div className="field"><label>主讲教师</label>
          <input className="input" value={c.instructor} onChange={e=>setC({...c, instructor:e.target.value})} /></div>
        <div className="field"><label>封面色</label>
          <div className="row gap-8">
            {covers.map(col=>(
              <div key={col} onClick={()=>setC({...c, cover:col})}
                style={{width:32, height:32, borderRadius:8, background:col, cursor:"pointer",
                  border: c.cover===col ? "2px solid var(--accent)" : "2px solid transparent"}} />
            ))}
          </div>
        </div>
      </div>
      <div className="field"><label>课程简介</label>
        <textarea className="textarea" value={c.description} onChange={e=>setC({...c, description:e.target.value})} placeholder="本课程将带你系统学习……" /></div>
    </Modal>
  );
};

Object.assign(window, { Courses, SUBJECTS, subjectShort });
