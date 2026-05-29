/* ============ 法泽在线 — 共享工具 / 状态 / UI 元件 ============ */

// ---------- 持久化存储 ----------
const STORE_KEY = "faze_online_v3";

const initialState = () => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const T0 = today.getTime();
  const dayMs = 86400000;
  // 以本周一为起点
  const weekday = (new Date(T0).getDay() + 6) % 7; // 周一=0
  const monday = T0 - weekday*dayMs;

  return ({
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
  },
  classes:["法学2401", "法学2402"],

  users: [
    { id:"admin", name:"系统管理员", role:"admin", password:"admin", firstLogin:false },
    { id:"T001", name:"陈砚清",  role:"teacher", password:"T001", firstLogin:true, subject:"民法" },
    { id:"T002", name:"沈昭明",  role:"teacher", password:"T002", firstLogin:true, subject:"刑法" },
    { id:"T003", name:"林婉如",  role:"teacher", password:"T003", firstLogin:true, subject:"法理学" },
    { id:"S2024001", name:"周予安", role:"student", password:"S2024001", firstLogin:true, className:"法学2401" },
    { id:"S2024002", name:"许若云", role:"student", password:"S2024002", firstLogin:true, className:"法学2401" },
    { id:"S2024003", name:"何之衡", role:"student", password:"S2024003", firstLogin:true, className:"法学2401" },
    { id:"S2024004", name:"赵璟笙", role:"student", password:"S2024004", firstLogin:true, className:"法学2402" },
    { id:"S2024005", name:"苏行简", role:"student", password:"S2024005", firstLogin:true, className:"法学2402" },
  ],

  exams: [
    {
      id:"E001",
      title:"民法典·物权编 期中模拟",
      subject:"民法",
      notice:"本场模拟测试共 5 题，含案例分析与论述。\n• 答题时长 120 分钟；\n• 请按题号分别上传每题的作答内容（支持图片或 PDF）；\n• 引用法条请注明条款编号；\n• 提交后不可修改，请检查后再上传。",
      questions:[
        { id:"Q1", title:"第一题 · 选择题（20分）", maxScore:20 },
        { id:"Q2", title:"第二题 · 名词解释（15分）", maxScore:15 },
        { id:"Q3", title:"第三题 · 简答题（20分）", maxScore:20 },
        { id:"Q4", title:"第四题 · 案例分析（25分）", maxScore:25 },
        { id:"Q5", title:"第五题 · 论述题（20分）", maxScore:20 },
      ],
      startTime: Date.now() - 1000*60*60*4,
      endTime:   Date.now() + 1000*60*60*48,
      paperFile: { name:"民法物权编_模拟卷.pdf", size: 482314 },
      publicRanking:true,
      realMode:false,
      duration: 120,
      createdBy:"T001",
      graders:["T001","T002"], // 出题老师 + 协同
    },
    {
      id:"E002",
      title:"刑法学·总论 阶段测验",
      subject:"刑法",
      notice:"考试范围：第一章至第六章。\n请按题号分别上传作答内容。\n请独立完成，禁止讨论。",
      questions:[
        { id:"Q1", title:"第一题 · 单选合集（30分）", maxScore:30 },
        { id:"Q2", title:"第二题 · 名词解释（20分）", maxScore:20 },
        { id:"Q3", title:"第三题 · 简答（20分）", maxScore:20 },
        { id:"Q4", title:"第四题 · 案例（30分）", maxScore:30 },
      ],
      startTime: Date.now() + 1000*60*60*6,
      endTime:   Date.now() + 1000*60*60*36,
      paperFile: { name:"刑法总论_阶段测验.pdf", size: 312000 },
      publicRanking:false,
      realMode:true,
      duration: 90,
      createdBy:"T002",
      graders:["T002"],
    },
    {
      id:"E003",
      title:"法理学·法的本体 综合测试",
      subject:"法理学",
      notice:"开卷测验。请按题号分别上传。",
      questions:[
        { id:"Q1", title:"第一题 · 概念辨析（30分）", maxScore:30 },
        { id:"Q2", title:"第二题 · 简答（30分）", maxScore:30 },
        { id:"Q3", title:"第三题 · 论述（40分）", maxScore:40 },
      ],
      startTime: Date.now() - 1000*60*60*24*10,
      endTime:   Date.now() - 1000*60*60*24*3,
      paperFile: { name:"法理学_综合测试.pdf", size: 220000 },
      publicRanking:true,
      realMode:false,
      duration: 120,
      createdBy:"T003",
      graders:["T003","T001"],
    },
  ],

  courses: [
    {
      id:"C001", subject:"民法", title:"民法典·物权编精讲",
      instructor:"陈砚清", instructorId:"T001",
      cover:"#3b4d6f",
      description:"系统梳理民法典物权编的基本制度：所有权、用益物权与担保物权。配合最高法院最新司法解释与指导性案例。",
      lessons:[
        {id:"L1", title:"第一讲 · 物权法概述与基本原则", kind:"video", duration:"58:21",
          file:{name:"01_物权法概述.mp4", size:118*1024*1024}, createdAt: Date.now()-1000*60*60*24*30, createdBy:"T001"},
        {id:"L2", title:"第二讲 · 不动产物权变动", kind:"video", duration:"1:02:14",
          file:{name:"02_不动产物权变动.mp4", size:132*1024*1024}, createdAt: Date.now()-1000*60*60*24*23, createdBy:"T001"},
        {id:"L3", title:"讲义·所有权与共有", kind:"pdf", duration:"42 页",
          file:{name:"讲义_所有权与共有.pdf", size:2.4*1024*1024}, createdAt: Date.now()-1000*60*60*24*15, createdBy:"T001"},
        {id:"L4", title:"补充 · 最高法院指导案例选读", kind:"article",
          content:"指导案例第 8 号：【案情】甚为经典的一个不动产二重买卖案。\n\n【裁判要点】不动产物权变动以登记为准。未经登记，不发生物权变动的法律效果。仅能产生债权性法律关系。\n\n【学习要求】掌握物权变动的公示、公信原则，区分负担行为与处分行为。",
          createdAt: Date.now()-1000*60*60*24*7, createdBy:"T001"},
      ],
      createdAt: Date.now()-1000*60*60*24*45,
    },
    {
      id:"C002", subject:"刑法", title:"刑法学总论·犯罪论",
      instructor:"沈昭明", instructorId:"T002",
      cover:"#5a3a3a",
      description:"从犯罪构成三阶层体系出发，梳理构成要件该当性、违法性与有责性三大部分。",
      lessons:[
        {id:"L1", title:"第一讲 · 犯罪构成要件", kind:"video", duration:"48:30",
          file:{name:"01_犯罪构成要件.mp4", size:96*1024*1024}, createdAt: Date.now()-1000*60*60*24*20, createdBy:"T002"},
        {id:"L2", title:"第二讲 · 违法性阶层", kind:"video", duration:"52:11",
          file:{name:"02_违法性阶层.mp4", size:104*1024*1024}, createdAt: Date.now()-1000*60*60*24*14, createdBy:"T002"},
        {id:"L3", title:"课后习题集·第一章", kind:"pdf", duration:"18 题",
          file:{name:"习题_犯罪论第一章.pdf", size:840*1024}, createdAt: Date.now()-1000*60*60*24*10, createdBy:"T002"},
      ],
      createdAt: Date.now()-1000*60*60*24*30,
    },
    {
      id:"C003", subject:"法理学", title:"法的本体与法律运行",
      instructor:"林婉如", instructorId:"T003",
      cover:"#3a5a4a",
      description:"从法的概念、法律规范、法律体系出发，理解法的运行与实现。",
      lessons:[
        {id:"L1", title:"导论 · 什么是法理学", kind:"article",
          content:"法理学（jurisprudence）是以法为研究对象的学科。\n\n不同于部门法学着重于具体规范的阐释，法理学考察法的一般原理。它探讨什么是法、法与道德的关系、法的价值、法的渊源与效力等根本问题。",
          createdAt: Date.now()-1000*60*60*24*40, createdBy:"T003"},
        {id:"L2", title:"第一讲 · 法的概念与特征", kind:"video", duration:"45:00",
          file:{name:"01_法的概念.mp4", size:88*1024*1024}, createdAt: Date.now()-1000*60*60*24*35, createdBy:"T003"},
      ],
      createdAt: Date.now()-1000*60*60*24*60,
    },
  ],

  // 我的课表 · 直播课
  liveSessions: [
    {
      id:"LV001", courseId:"C001", subject:"民法",
      title:"民法物权编·第三讲 担保物权（直播）",
      instructor:"陈砚清", instructorId:"T001",
      classroom:"在线 · 教学一号厅",
      startTime: monday + 2*dayMs + 9*3600*1000 + 30*60*1000,   // 周三 09:30
      endTime:   monday + 2*dayMs + 11*3600*1000 + 10*60*1000,  // 11:10
      enrolled:["S2024001","S2024002","S2024003","S2024004","S2024005"],
    },
    {
      id:"LV002", courseId:"C002", subject:"刑法",
      title:"刑法总论·第三讲 有责性",
      instructor:"沈昭明", instructorId:"T002",
      classroom:"在线 · 教学二号厅",
      startTime: monday + 1*dayMs + 14*3600*1000,
      endTime:   monday + 1*dayMs + 15*3600*1000 + 40*60*1000,
      enrolled:["S2024001","S2024002","S2024003","S2024004","S2024005"],
    },
    {
      id:"LV003", courseId:"C003", subject:"法理学",
      title:"法理学·第二讲 法的渊源与效力",
      instructor:"林婉如", instructorId:"T003",
      classroom:"在线 · 教学三号厅",
      startTime: monday + 3*dayMs + 10*3600*1000,
      endTime:   monday + 3*dayMs + 11*3600*1000 + 30*60*1000,
      enrolled:["S2024001","S2024002","S2024003","S2024004","S2024005"],
    },
    {
      id:"LV004", courseId:"C001", subject:"民法",
      title:"民法物权编·答疑直播",
      instructor:"陈砚清", instructorId:"T001",
      classroom:"在线 · 答疑厅",
      startTime: monday + 4*dayMs + 19*3600*1000,
      endTime:   monday + 4*dayMs + 20*3600*1000 + 30*60*1000,
      enrolled:["S2024001","S2024002","S2024003","S2024004","S2024005"],
    },
  ],

  // 提交：按题分别上传 [{qid, files:[{name,size}]}]
  submissions: [
    {
      examId:"E001", studentId:"S2024001",
      answers:[
        { qid:"Q1", files:[{name:"周予安_第一题.jpg", size:380*1024}] },
        { qid:"Q2", files:[{name:"周予安_第二题.jpg", size:420*1024}] },
        { qid:"Q3", files:[{name:"周予安_第三题.jpg", size:560*1024}] },
        { qid:"Q4", files:[{name:"周予安_第四题.pdf", size:840*1024}] },
        { qid:"Q5", files:[{name:"周予安_第五题.pdf", size:760*1024}] },
      ],
      submittedAt: Date.now() - 1000*60*60*2,
    },
    {
      examId:"E001", studentId:"S2024002",
      answers:[
        { qid:"Q1", files:[{name:"许若云_Q1.jpg", size:340*1024}] },
        { qid:"Q2", files:[{name:"许若云_Q2.jpg", size:380*1024}] },
        { qid:"Q3", files:[{name:"许若云_Q3.pdf", size:520*1024}] },
        { qid:"Q4", files:[{name:"许若云_Q4.pdf", size:720*1024}] },
        { qid:"Q5", files:[{name:"许若云_Q5.pdf", size:680*1024}] },
      ],
      submittedAt: Date.now() - 1000*60*60*1,
    },
    {
      examId:"E001", studentId:"S2024003",
      answers:[
        { qid:"Q1", files:[{name:"何之衡_Q1.jpg", size:300*1024}] },
        { qid:"Q2", files:[{name:"何之衡_Q2.jpg", size:330*1024}] },
        { qid:"Q3", files:[{name:"何之衡_Q3.pdf", size:480*1024}] },
        { qid:"Q4", files:[{name:"何之衡_Q4.pdf", size:660*1024}] },
        { qid:"Q5", files:[{name:"何之衡_Q5.pdf", size:620*1024}] },
      ],
      submittedAt: Date.now() - 1000*60*30,
    },
    ...["S2024001","S2024002","S2024003","S2024004","S2024005"].map(sid=>({
      examId:"E003", studentId:sid,
      answers:[
        { qid:"Q1", files:[{name:`${sid}_Q1.pdf`, size:520*1024}] },
        { qid:"Q2", files:[{name:`${sid}_Q2.pdf`, size:610*1024}] },
        { qid:"Q3", files:[{name:`${sid}_Q3.pdf`, size:720*1024}] },
      ],
      submittedAt: Date.now() - 1000*60*60*24*5,
    })),
  ],

  examAttempts: [],

  // 批改记录
  grades: (()=>{
    const seed = [];
    const e3scores = {
      "S2024001":{Q1:26,Q2:25,Q3:34},
      "S2024002":{Q1:24,Q2:22,Q3:30},
      "S2024003":{Q1:28,Q2:26,Q3:36},
      "S2024004":{Q1:20,Q2:18,Q3:28},
      "S2024005":{Q1:25,Q2:24,Q3:32},
    };
    const comments = {
      Q1:"概念辨析准确，举例若再具体些更佳。",
      Q2:"基本观点正确，论证略显单薄。",
      Q3:"论述结构清晰，引用恰当，注意收束。",
    };
    Object.entries(e3scores).forEach(([sid, qs])=>{
      Object.entries(qs).forEach(([qid, sc])=>{
        seed.push({
          examId:"E003", qid, studentId:sid, score:sc,
          comment:comments[qid], gradedBy:"T003",
          gradedAt: Date.now() - 1000*60*60*24*4,
        });
      });
    });
    return seed;
  })(),

  // 站内消息
  messages:[
    {id:"M1", userId:"S2024001", title:"《法理学·法的本体 综合测试》阅卷完成",
      body:"您的本场综合测试已全部完成阅卷。请前往「我的成绩」查看详情，并可在「排行榜」查看本场排名。", time:Date.now()-1000*60*60*24*3, read:false},
    {id:"M2", userId:"S2024001", title:"欢迎使用法泽在线",
      body:"您好，欢迎使用法泽在线学习平台。本平台提供模拟测试、课程学习、直播课表与批改反馈。如遇问题请联系教学秘书。", time:Date.now()-1000*60*60*24*15, read:true},
  ],

  // 课程问答：[{id, courseId, lessonId, studentId, text, time, replies:[{id, by, text, time}]}]
  courseQA: [
    {
      id:"Q-1", courseId:"C001", lessonId:"L2", studentId:"S2024002",
      text:"老师好，关于不动产善意取得制度，登记错误时第三人善意取得的判断标准应如何把握？",
      time: Date.now() - 1000*60*60*24*2,
      replies:[
        { id:"R-1", by:"T001", text:"善意的判断时点为登记完成时；判断标准为'不知且不应知'。结合最高法院司法解释第 15 条把握。", time:Date.now()-1000*60*60*24*2+1000*60*60*4 },
      ],
    },
    {
      id:"Q-2", courseId:"C001", lessonId:"L2", studentId:"S2024003",
      text:"动产抵押与质押在公示方式上有何区别？",
      time: Date.now() - 1000*60*60*8,
      replies:[],
    },
  ],
  });
};

const loadState = () => {
  try{
    const init = initialState();
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return init;
    const parsed = JSON.parse(raw);
    // 向前兼容：补齐缺失字段
    for(const k of Object.keys(init)){
      if(!(k in parsed)) parsed[k] = init[k];
    }
    parsed.exams = (parsed.exams||[]).map(e=>({
      realMode:false, duration:120, graders:[e.createdBy].filter(Boolean), ...e,
    }));
    return parsed;
  }catch(e){ return initialState(); }
};
const saveState = (s)=> localStorage.setItem(STORE_KEY, JSON.stringify(s));
const resetState = ()=>{ localStorage.removeItem(STORE_KEY); localStorage.removeItem("faze_session"); };

const DEFAULT_TERMS = "1. 平台账号由管理员统一创建，用户应妥善保管账号和密码，不得转借他人使用。\n2. 用户上传的课程资料、试卷、答卷、解析等内容应符合法律法规和教学管理要求。\n3. 考试期间应遵守考试规则，系统会记录开始答题、提交时间及延迟交卷等状态。\n4. 平台仅用于教学、训练和考试管理场景。未经授权，不得复制、传播课程内容或他人答卷。\n5. 继续登录即表示您已阅读、理解并同意遵守本条款。";
const defaultQuotes = [
  {text:"法不阿贵，绳不挠曲。", source:"《韩非子》"},
  {text:"徒善不足以为政，徒法不能以自行。", source:"《孟子》"},
  {text:"法律是治国之重器，良法是善治之前提。", source:""},
];
const classOptions = (state)=> {
  const set = new Set([...(state.classes || [])]);
  (state.users || []).forEach(u=>{ if(u.role === "student" && u.className) set.add(u.className); });
  return [...set].filter(Boolean).sort((a,b)=>a.localeCompare(b, "zh-Hans-CN"));
};
const studentsInClass = (state, className)=> (state.users || []).filter(u=>u.role === "student" && (!className || u.className === className));
const makeMessage = (userId, title, body, type="notice")=>({
  id:uid("M"), userId, title, body, type, time:Date.now(), read:false,
});
const notifyUsers = (state, users, title, body, type="notice")=>({
  ...state,
  messages:[...users.map(u=>makeMessage(u.id, title, body, type)), ...(state.messages || [])],
});

const apiJSON = async (url, options={}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || `API ${res.status}`);
  return data;
};
const loadStateRemote = async () => apiJSON("/api/state");
const saveStateRemote = async (state) => apiJSON("/api/state", {
  method: "PUT",
  body: JSON.stringify(state),
});
const loginRemote = async (id, password) => apiJSON("/api/login", {
  method:"POST",
  body:JSON.stringify({id, password}),
});
const changePasswordRemote = async (payload) => apiJSON("/api/change-password", {
  method:"POST",
  body:JSON.stringify(payload),
});
const toUploadFile = (file, blob)=>({
  name:file.name,
  storedName:blob.pathname || blob.url,
  size:file.size,
  type:file.type || blob.contentType || "application/octet-stream",
  url:blob.url,
  downloadUrl:blob.downloadUrl,
  uploadedAt:Date.now(),
  storage:"vercel-blob",
});
const waitForBlobUpload = () => new Promise((resolve, reject)=>{
  if(window.fazeBlobUpload) { resolve(window.fazeBlobUpload); return; }
  const timer = setTimeout(()=>reject(new Error("上传组件加载超时，请刷新页面后重试")), 12000);
  window.addEventListener("faze-blob-ready", ()=>{
    clearTimeout(timer);
    resolve(window.fazeBlobUpload);
  }, {once:true});
});
const uploadBlobDirect = async (file, onProgress) => {
  if(onProgress) onProgress(1);
  const upload = await waitForBlobUpload();
  if(onProgress) onProgress(3);
  const blob = await upload(`uploads/${Date.now()}-${file.name}`, file, {
    access:"public",
    handleUploadUrl:"/api/blob-upload",
    contentType:file.type || "application/octet-stream",
    multipart:file.size > 8 * 1024 * 1024,
    onUploadProgress:(evt)=>{
      if(onProgress) onProgress(Math.max(3, Math.round(evt.percentage || 0)));
    },
  });
  if(onProgress) onProgress(100);
  return toUploadFile(file, blob);
};
const uploadRemote = async (file, onProgress) => {
  const shouldUseBlobDirect = /^video\//.test(file.type || "") || file.size > 4 * 1024 * 1024;
  if(shouldUseBlobDirect) {
    try{
      return await uploadBlobDirect(file, onProgress);
    }catch(err){
      const msg = err?.message || "上传失败";
      if(/token|BLOB|store|not found|unauthorized|forbidden|未配置/i.test(msg)) {
        throw new Error("视频需要先配置 Vercel Blob 云存储后才能上传。请确认 Vercel 项目里有 BLOB_READ_WRITE_TOKEN。");
      }
      throw new Error(msg);
    }
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload?filename=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (evt) => {
      if(evt.lengthComputable && onProgress) onProgress(Math.round(evt.loaded / evt.total * 100));
    };
    xhr.onload = () => {
      try{
        const data = JSON.parse(xhr.responseText || "{}");
        if(xhr.status < 200 || xhr.status >= 300) throw new Error(data.error || "上传失败");
        resolve(data.file);
      }catch(err){
        const raw = (xhr.responseText || "").slice(0, 120);
        reject(new Error(raw ? `上传接口返回异常：${raw}` : (err.message || "上传失败")));
      }
    };
    xhr.onerror = () => reject(new Error("上传失败，请检查网络"));
    xhr.send(file);
  });
};

// ---------- 工具函数 ----------
const fmtBytes = (n)=>{
  if(!n) return "—";
  if(n < 1024) return n+" B";
  if(n < 1024*1024) return (n/1024).toFixed(1)+" KB";
  return (n/1024/1024).toFixed(1)+" MB";
};
const pad2 = (n)=> String(n).padStart(2,"0");
const fmtTime = (t)=>{
  if(!t) return "—";
  const d = new Date(t);
  return `${d.getFullYear()}/${pad2(d.getMonth()+1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtDate = (t)=>{
  if(!t) return "—";
  const d = new Date(t);
  return `${d.getFullYear()}/${pad2(d.getMonth()+1)}/${pad2(d.getDate())}`;
};
const fmtClock = (t)=>{
  if(!t) return "—";
  const d = new Date(t);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtRel = (t)=>{
  const d = Date.now() - t;
  if(d < 0) return "刚刚";
  if(d < 60*1000) return "刚刚";
  if(d < 3600*1000) return Math.floor(d/60000)+" 分钟前";
  if(d < 86400*1000) return Math.floor(d/3600000)+" 小时前";
  if(d < 7*86400*1000) return Math.floor(d/86400000)+" 天前";
  return fmtTime(t).slice(0,10);
};
const fmtTimeLocal = (t)=>{
  if(!t) return "";
  const d = new Date(t);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const parseLocal = (s)=> s ? new Date(s).getTime() : null;

const examStatus = (e)=>{
  const now = Date.now();
  if(now < e.startTime) return "pending";
  if(now > e.endTime)   return "closed";
  return "open";
};
const statusLabel = (s)=>({pending:"未开始", open:"进行中", closed:"已截止"})[s];
const statusTagClass = (s)=>({pending:"", open:"ok", closed:""})[s];

const liveStatus = (s)=>{
  const now = Date.now();
  if(now < s.startTime) return "pending";
  if(now > s.endTime)   return "ended";
  return "live";
};

const uid = (p="X")=> p + Math.random().toString(36).slice(2,8).toUpperCase();

// ---------- 通用 UI 元件 ----------
const Toast = ({stack, remove})=>(
  <div className="toast-stack">
    {stack.map(t=>(
      <div key={t.id} className={"toast "+(t.kind||"")} onClick={()=>remove(t.id)}>{t.msg}</div>
    ))}
  </div>
);

const Modal = ({onClose, title, children, foot, wide})=>(
  <div className="modal-backdrop" onClick={(e)=>{ if(e.target.classList.contains("modal-backdrop")) onClose && onClose(); }}>
    <div className={"modal"+(wide?" wide":"")}>
      <div className="modal-head">
        <h3>{title}</h3>
        {onClose && <div className="close" onClick={onClose}>✕</div>}
      </div>
      {children}
      {foot && <div className="modal-foot">{foot}</div>}
    </div>
  </div>
);

const Empty = ({title, hint, icon="无"})=>(
  <div className="empty">
    <div className="icon">{icon}</div>
    <div className="t">{title}</div>
    {hint && <div className="h">{hint}</div>}
  </div>
);

const Tag = ({children, kind})=> <span className={"tag "+(kind||"")}>{children}</span>;

// 倒计时 hook
const useNow = (ms=1000)=>{
  const [n, setN] = React.useState(Date.now());
  React.useEffect(()=>{
    const t = setInterval(()=> setN(Date.now()), ms);
    return ()=> clearInterval(t);
  },[ms]);
  return n;
};

const Countdown = ({to})=>{
  const now = useNow(1000);
  const d = Math.max(0, to - now);
  const days = Math.floor(d / 86400000);
  const h = Math.floor((d % 86400000) / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  const s = Math.floor((d % 60000) / 1000);
  return (
    <div className="countdown">
      {days > 0 && <span>{days}<small>天</small> </span>}
      {pad2(h)}<small>:</small>{pad2(m)}<small>:</small>{pad2(s)}
    </div>
  );
};

// ---------- 模拟时钟 ----------
const AnalogClock = ({size=280, dark=false})=>{
  const now = useNow(1000);
  const d = new Date(now);
  const sec = d.getSeconds();
  const min = d.getMinutes() + sec/60;
  const hr  = d.getHours()%12 + min/60;
  const stroke = dark ? "#e7e1d2" : "#0f1726";
  const dial   = dark ? "#1a2538" : "#fff";
  const accent = "#c79a5d";
  const handle = (deg, len, w, color)=>{
    const a = (deg - 90) * Math.PI/180;
    return <line x1="50" y1="50"
      x2={50+Math.cos(a)*len} y2={50+Math.sin(a)*len}
      stroke={color} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{filter: dark?"drop-shadow(0 8px 24px rgba(0,0,0,.4))":"none"}}>
      <circle cx="50" cy="50" r="48" fill={dial} stroke={stroke} strokeWidth="1.5" />
      <circle cx="50" cy="50" r="46" fill="none" stroke={stroke} strokeWidth=".3" opacity=".3" />
      {[...Array(60)].map((_,i)=>{
        const a = (i*6 - 90) * Math.PI/180;
        const isHour = i%5===0;
        const r1 = isHour ? 41 : 44;
        const r2 = 46;
        return <line key={i}
          x1={50+Math.cos(a)*r1} y1={50+Math.sin(a)*r1}
          x2={50+Math.cos(a)*r2} y2={50+Math.sin(a)*r2}
          stroke={stroke} strokeWidth={isHour?1.2:.4} />;
      })}
      {[12,3,6,9].map(n=>{
        const a = ((n%12)*30 - 90) * Math.PI/180;
        return <text key={n}
          x={50+Math.cos(a)*36} y={50+Math.sin(a)*36+2}
          fontFamily="var(--serif)" fontSize="6" textAnchor="middle" fill={stroke}>{n}</text>;
      })}
      {handle(hr*30,  22, 2.4, stroke)}
      {handle(min*6, 32, 1.7, stroke)}
      {handle(sec*6, 36, .8, accent)}
      <circle cx="50" cy="50" r="2" fill={stroke} />
      <circle cx="50" cy="50" r=".8" fill={accent} />
    </svg>
  );
};

// ---------- 铃声 ----------
let _audioCtx = null;
const playBell = (kind="open")=>{
  try{
    if(!_audioCtx) _audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const ctx = _audioCtx;
    if(ctx.state==="suspended") ctx.resume();
    const now = ctx.currentTime;
    const tones = kind==="end"
      ? [[1320,0],[1320,.25],[1320,.5]]
      : kind==="warn"
        ? [[880,0]]
        : [[880,0],[660,.5]];
    tones.forEach(([f, delay])=>{
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t0 = now + delay;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.35, t0+0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0+1.4);
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = f*2;
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, t0);
      gain2.gain.linearRampToValueAtTime(0.12, t0+0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, t0+0.8);
      osc.connect(gain).connect(ctx.destination);
      osc2.connect(gain2).connect(ctx.destination);
      osc.start(t0); osc.stop(t0+1.5);
      osc2.start(t0); osc2.stop(t0+1.0);
    });
  }catch(e){}
};

const enterFullscreen = (el)=>{
  el = el || document.documentElement;
  if(el.requestFullscreen) el.requestFullscreen().catch(()=>{});
  else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
};
const exitFullscreen = ()=>{
  if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  else if(document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
};

// ============ 通用：个人设置 / 修改密码 弹窗 ============
const ProfileModal = ({me, state, setState, onClose, toast})=>{
  const [tab, setTab] = React.useState("profile");

  // profile
  const [name, setName] = React.useState(me.name);
  const [className, setClassName] = React.useState(me.className||"");
  const [subject, setSubject] = React.useState(me.subject||"");

  // password
  const [oldPw, setOldPw] = React.useState("");
  const [p1, setP1] = React.useState("");
  const [p2, setP2] = React.useState("");
  const [pwErr, setPwErr] = React.useState("");

  const saveProfile = ()=>{
    setState({
      ...state,
      users: state.users.map(u=> u.id===me.id ? {...u, name, className, subject} : u),
    });
    toast("个人资料已保存", "ok");
    onClose();
  };

  const changePw = async ()=>{
    setPwErr("");
    if(p1.length < 6){ setPwErr("新密码至少 6 位"); return; }
    if(p1 !== p2){ setPwErr("两次输入不一致"); return; }
    if(p1 === me.id){ setPwErr("新密码不能与账号相同"); return; }
    try{
      const result = await changePasswordRemote({userId:me.id, oldPassword:oldPw, newPassword:p1});
      if(result.state) setState(result.state);
      else setState({
        ...state,
        users: state.users.map(u=> u.id===me.id ? {...u, firstLogin:false} : u),
      });
      toast("密码已修改", "ok");
      onClose();
    }catch(err){
      setPwErr(err.message || "修改失败");
    }
  };

  return (
    <Modal title="个人设置" onClose={onClose}>
      <div className="tabs" style={{marginBottom:16}}>
        <div className={"tab"+(tab==="profile"?" active":"")} onClick={()=>setTab("profile")}>个人资料</div>
        <div className={"tab"+(tab==="password"?" active":"")} onClick={()=>setTab("password")}>修改密码</div>
      </div>

      {tab==="profile" && (
        <div>
          <div className="field"><label>账号</label>
            <input className="input" value={me.id} readOnly style={{background:"var(--ink-50)"}} /></div>
          <div className="field"><label>姓名</label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} /></div>
          {me.role==="student" && (
            <div className="field"><label>班级</label>
              <input className="input" value={className} onChange={e=>setClassName(e.target.value)} /></div>
          )}
          {me.role==="teacher" && (
            <div className="field"><label>所授学科</label>
              <input className="input" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="如 民法、刑法" /></div>
          )}
          <div className="modal-foot">
            <button className="btn ghost" onClick={onClose}>取消</button>
            <button className="btn" disabled={!name} onClick={saveProfile}>保存</button>
          </div>
        </div>
      )}

      {tab==="password" && (
        <div>
          <div className="field"><label>当前密码</label>
            <input className="input" type="password" value={oldPw} onChange={e=>{setOldPw(e.target.value); setPwErr("");}} /></div>
          <div className="field"><label>新密码</label>
            <input className="input" type="password" value={p1} onChange={e=>{setP1(e.target.value); setPwErr("");}} placeholder="至少 6 位" /></div>
          <div className="field"><label>确认新密码</label>
            <input className="input" type="password" value={p2} onChange={e=>{setP2(e.target.value); setPwErr("");}} /></div>
          {pwErr && <div style={{color:"var(--danger)", fontSize:12, marginBottom:8}}>{pwErr}</div>}
          <div className="modal-foot">
            <button className="btn ghost" onClick={onClose}>取消</button>
            <button className="btn" onClick={changePw}>修改密码</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// 暴露
Object.assign(window, {
  STORE_KEY, loadState, saveState, resetState,
  loadStateRemote, saveStateRemote, loginRemote, changePasswordRemote, uploadRemote,
  defaultQuotes, DEFAULT_TERMS, classOptions, studentsInClass, makeMessage, notifyUsers,
  fmtBytes, fmtTime, fmtDate, fmtClock, fmtRel, fmtTimeLocal, parseLocal,
  examStatus, statusLabel, statusTagClass, liveStatus, uid, pad2,
  Toast, Modal, Empty, Tag, Countdown, useNow,
  AnalogClock, playBell, enterFullscreen, exitFullscreen,
  ProfileModal,
});
