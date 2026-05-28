/* ============ 法泽在线 — 我的课表（直播课） ============ */

const Schedule = ({state, setState, toast, me, canManage})=>{
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [openId, setOpenId] = React.useState(null);
  const [editing, setEditing] = React.useState(null);

  // 本周一起点
  const today = new Date(); today.setHours(0,0,0,0);
  const wd = (today.getDay()+6)%7;
  const monday = today.getTime() - wd*86400000 + weekOffset*7*86400000;
  const days = [...Array(7)].map((_,i)=> monday + i*86400000);

  const sessions = state.liveSessions || [];
  const visible = sessions.filter(s=> s.endTime >= monday && s.startTime < monday + 7*86400000);

  // 教师视角：本人主讲；学生视角：选课的（演示中全部学生默认选了所有）
  const my = sessions.filter(s=>{
    if(me.role==="teacher") return s.instructorId===me.id;
    if(me.role==="student") return (s.enrolled||[]).includes(me.id);
    return true;
  });

  const myVisible = visible.filter(s=>{
    if(me.role==="teacher") return s.instructorId===me.id;
    if(me.role==="student") return (s.enrolled||[]).includes(me.id);
    return true;
  });

  // 时间轴 8:00 - 22:00
  const hours = [...Array(15)].map((_,i)=> 8+i);
  const dayStart = 8, dayEnd = 22;
  const colSlots = (h)=> h;

  const positionFor = (s, dayStartMs)=>{
    const startMin = (s.startTime - dayStartMs) / 60000;
    const endMin   = (s.endTime - dayStartMs) / 60000;
    const top = Math.max(0, (startMin - dayStart*60) / ((dayEnd-dayStart)*60) * 100);
    const height = Math.max(3, (endMin - startMin) / ((dayEnd-dayStart)*60) * 100);
    return { top:`${top}%`, height:`${height}%` };
  };

  const upcomingMy = my
    .filter(s=> s.endTime > Date.now())
    .sort((a,b)=> a.startTime-b.startTime);

  const newSession = ()=> setEditing({
    id: uid("LV"), courseId: state.courses?.[0]?.id || "",
    subject: me.subject || "民法",
    title:"", instructor: me.name, instructorId: me.id,
    classroom:"在线 · 教学厅",
    startTime: monday + dayStart*3600*1000,
    endTime: monday + (dayStart+1.5)*3600*1000,
    enrolled: state.users.filter(u=>u.role==="student").map(u=>u.id),
    _new: true,
  });

  const saveSession = (s)=>{
    const next = {...state, liveSessions:[...(state.liveSessions||[])]};
    const i = next.liveSessions.findIndex(x=>x.id===s.id);
    const clean = {...s}; delete clean._new;
    if(i>=0) next.liveSessions[i] = clean;
    else next.liveSessions.unshift(clean);
    setState(next);
    toast(s._new?"直播课已创建":"已保存", "ok");
    setEditing(null);
  };

  const delSession = (id)=>{
    if(!confirm("删除此直播课？")) return;
    setState({...state, liveSessions: (state.liveSessions||[]).filter(s=>s.id!==id)});
    setOpenId(null);
    toast("已删除");
  };

  const cur = my.find(s=>s.id===openId);

  return (
    <div>
      <div className="page-head">
        <div className="title">
          <div className="eyebrow">{canManage?"Teacher · Schedule":"Student · Schedule"}</div>
          <h1>我的课表</h1>
        </div>
        <div className="actions row gap-8">
          <button className="btn ghost sm" onClick={()=>setWeekOffset(weekOffset-1)}>← 上一周</button>
          <button className="btn ghost sm" onClick={()=>setWeekOffset(0)} disabled={weekOffset===0}>本周</button>
          <button className="btn ghost sm" onClick={()=>setWeekOffset(weekOffset+1)}>下一周 →</button>
          {canManage && <button className="btn" onClick={newSession}>＋ 新建直播课</button>}
        </div>
      </div>

      {/* 顶部状态摘要 */}
      <div className="grid cols-3 mb-24">
        <div className="card" style={{padding:"16px 18px"}}>
          <div className="tiny muted" style={{letterSpacing:".2em"}}>本周课时</div>
          <div style={{fontFamily:"var(--serif)", fontSize:32, marginTop:4}}>{myVisible.length}</div>
        </div>
        <div className="card" style={{padding:"16px 18px"}}>
          <div className="tiny muted" style={{letterSpacing:".2em"}}>下一节</div>
          {upcomingMy[0] ? (
            <>
              <div style={{fontFamily:"var(--serif)", fontSize:16, marginTop:4}}>{upcomingMy[0].title}</div>
              <div className="muted tiny mono mt-8">{fmtTime(upcomingMy[0].startTime)}</div>
            </>
          ) : <div className="muted mt-8">暂无</div>}
        </div>
        <div className="card" style={{padding:"16px 18px"}}>
          <div className="tiny muted" style={{letterSpacing:".2em"}}>正在直播</div>
          {my.filter(s=>liveStatus(s)==="live").length>0
            ? <div style={{fontFamily:"var(--serif)", fontSize:16, marginTop:4, color:"var(--accent)"}}>{my.filter(s=>liveStatus(s)==="live").length} 节</div>
            : <div className="muted mt-8">无</div>}
        </div>
      </div>

      {/* 周视图 */}
      <div className="card mb-24" style={{padding:16}}>
        <div className="schedule-week" style={{position:"relative"}}>
          <div className="hd"></div>
          {days.map((d,i)=>{
            const isToday = new Date(d).toDateString() === new Date().toDateString();
            return (
              <div key={i} className={"hd"+(isToday?" today":"")}>
                <div className="wk">{["周一","周二","周三","周四","周五","周六","周日"][i]}</div>
                <div className="dt">{fmtDate(d).slice(5)}</div>
              </div>
            );
          })}

          {hours.map(h=>(
            <React.Fragment key={h}>
              <div className="time-col">{pad2(h)}:00</div>
              {days.map((d,di)=>{
                const isToday = new Date(d).toDateString() === new Date().toDateString();
                return <div key={di} className={"slot"+(isToday?" today":"")}></div>;
              })}
            </React.Fragment>
          ))}

          {/* 课程块覆盖 —— 每天独立列定位 */}
          {days.map((d,di)=>{
            const daySessions = myVisible.filter(s=>{
              const sd = new Date(s.startTime); sd.setHours(0,0,0,0);
              return sd.getTime() === d;
            });
            return (
              <div key={di} style={{
                position:"absolute",
                top: 38, // 表头高度
                bottom:0,
                left: `calc(60px + (100% - 60px) * ${di} / 7 + 1px)`,
                width: `calc((100% - 60px) / 7 - 2px)`,
              }}>
                {daySessions.map(s=>{
                  const pos = positionFor(s, d);
                  const ls = liveStatus(s);
                  return (
                    <div key={s.id} className={"cls "+ls} style={{position:"absolute", ...pos}}
                      onClick={()=>setOpenId(s.id)}>
                      <div className="tit">{s.title}</div>
                      <div className="meta">
                        <span className="when">{fmtClock(s.startTime)}–{fmtClock(s.endTime)}</span>
                        {ls==="live" && <span style={{marginLeft:6}}>● 直播中</span>}
                      </div>
                      <div className="meta">{s.instructor}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 近期列表 */}
      <h3 className="section-title">近期课程</h3>
      {upcomingMy.length===0 ? <Empty title="近期无安排" icon="—" /> : (
        <div className="col gap-12">
          {upcomingMy.slice(0,6).map(s=>{
            const d = new Date(s.startTime);
            const ls = liveStatus(s);
            return (
              <div key={s.id} className="live-card" onClick={()=>setOpenId(s.id)} style={{cursor:"pointer"}}>
                <div className="when-block">
                  <div className="d">{d.getDate()}</div>
                  <div className="m">{["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"][d.getMonth()]}</div>
                  <div className="t">{fmtClock(s.startTime)}</div>
                </div>
                <div className="body-block">
                  <div className="row gap-8 mb-8">
                    <Tag>{s.subject}</Tag>
                    {ls==="live" && <Tag kind="accent">● 直播中</Tag>}
                    {ls==="pending" && <Tag>未开始</Tag>}
                  </div>
                  <h3>{s.title}</h3>
                  <div className="meta">{s.instructor} · {s.classroom} · {fmtClock(s.startTime)} – {fmtClock(s.endTime)}</div>
                </div>
                <div>
                  {ls==="live"
                    ? <button className="btn accent">进入直播 →</button>
                    : <button className="btn ghost sm">查看</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cur && <SessionModal session={cur} state={state}
        canManage={canManage && cur.instructorId===me.id}
        onClose={()=>setOpenId(null)}
        onEdit={()=>{ setEditing(cur); setOpenId(null); }}
        onDelete={()=>delSession(cur.id)}
        toast={toast} />}

      {editing && <SessionEditor session={editing} state={state}
        onClose={()=>setEditing(null)} onSave={saveSession} />}
    </div>
  );
};

const SessionModal = ({session, state, canManage, onClose, onEdit, onDelete, toast})=>{
  const ls = liveStatus(session);
  const course = (state.courses||[]).find(c=>c.id===session.courseId);
  return (
    <Modal title={session.title} onClose={onClose} wide foot={
      canManage ? (
        <>
          <button className="btn danger" onClick={onDelete}>删除</button>
          <button className="btn ghost" onClick={onEdit}>编辑</button>
          <button className="btn" onClick={onClose}>关闭</button>
        </>
      ) : (
        ls==="live"
          ? <button className="btn accent" onClick={()=>{toast("正在进入直播间…","ok"); onClose();}}>进入直播</button>
          : ls==="ended"
            ? (course ? <button className="btn" onClick={onClose}>查看录播课程 →</button> : <button className="btn" onClick={onClose}>关闭</button>)
            : <button className="btn ghost" onClick={onClose}>关闭</button>
      )
    }>
      <div className="row gap-8 mb-16">
        <Tag>{session.subject}</Tag>
        {ls==="live" && <Tag kind="accent">● 直播中</Tag>}
        {ls==="pending" && <Tag>未开始</Tag>}
        {ls==="ended" && <Tag>已结束</Tag>}
      </div>
      <div className="kv mb-8"><span className="k" style={{minWidth:80}}>主讲教师</span><span className="v">{session.instructor}</span></div>
      <div className="kv mb-8"><span className="k" style={{minWidth:80}}>时间</span>
        <span className="v mono">{fmtTime(session.startTime)} — {fmtClock(session.endTime)}</span></div>
      <div className="kv mb-8"><span className="k" style={{minWidth:80}}>地点</span><span className="v">{session.classroom}</span></div>
      {course && <div className="kv mb-8"><span className="k" style={{minWidth:80}}>所属课程</span><span className="v">{course.title}</span></div>}
      <div className="kv mb-8"><span className="k" style={{minWidth:80}}>选课人数</span><span className="v mono">{(session.enrolled||[]).length} 人</span></div>

      {ls==="pending" && (
        <div className="card flat mt-16" style={{padding:"16px 18px", background:"var(--paper-2)"}}>
          <div className="muted tiny" style={{letterSpacing:".25em"}}>距离开始</div>
          <div className="countdown mt-8" style={{fontSize:32}}>
            <Countdown to={session.startTime} />
          </div>
        </div>
      )}
    </Modal>
  );
};

const SessionEditor = ({session, state, onClose, onSave})=>{
  const [s, setS] = React.useState({...session});
  const courses = state.courses || [];
  const subjects = [...new Set([...courses.map(c=>c.subject), "民法","刑法","法理学","宪法","行政法"])];
  return (
    <Modal wide title={session._new?"新建直播课":"编辑直播课"} onClose={onClose}
      foot={<>
        <button className="btn ghost" onClick={onClose}>取消</button>
        <button className="btn" disabled={!s.title} onClick={()=>onSave(s)}>保存</button>
      </>}>
      <div className="grid cols-2 gap-12">
        <div className="field"><label>课程名称</label>
          <input className="input" value={s.title} onChange={e=>setS({...s, title:e.target.value})} placeholder="如 民法物权编·第三讲" /></div>
        <div className="field"><label>学科</label>
          <select className="select" value={s.subject} onChange={e=>setS({...s, subject:e.target.value})}>
            {subjects.map(x=><option key={x} value={x}>{x}</option>)}
          </select></div>
        <div className="field"><label>开始时间</label>
          <input className="input" type="datetime-local" value={fmtTimeLocal(s.startTime)} onChange={e=>setS({...s, startTime:parseLocal(e.target.value)})} /></div>
        <div className="field"><label>结束时间</label>
          <input className="input" type="datetime-local" value={fmtTimeLocal(s.endTime)} onChange={e=>setS({...s, endTime:parseLocal(e.target.value)})} /></div>
        <div className="field"><label>地点</label>
          <input className="input" value={s.classroom} onChange={e=>setS({...s, classroom:e.target.value})} /></div>
        <div className="field"><label>关联录播课程</label>
          <select className="select" value={s.courseId||""} onChange={e=>setS({...s, courseId:e.target.value})}>
            <option value="">— 无 —</option>
            {courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
          </select></div>
      </div>
    </Modal>
  );
};

Object.assign(window, { Schedule });
