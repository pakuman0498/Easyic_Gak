// Headless play bots for 이직각. Drives the real game functions exposed as window.G (see build.py).
(function(){
const G=window.G;
const PERSONAS={
 diligent:{label:'성실형',checkP:.9,smart:true,applyMinP:.38,maxPending:4,minTenure:540,actHp:55,restHp:35,branch:'ic',margin:.5},
 climber:{label:'야망형',checkP:.9,smart:true,applyMinP:.16,maxPending:8,minTenure:200,actHp:45,restHp:25,branch:'m',margin:.2},
 balancer:{label:'워라밸형',checkP:.8,smart:true,applyMinP:.38,maxPending:3,minTenure:730,actHp:70,restHp:55,branch:'ic',margin:.5,wlb:true,quitAfterLeave:true},
 casual:{label:'무심형',checkP:.35,smart:false,applyMinP:.3,maxPending:4,minTenure:540,actHp:55,restHp:35,branch:null,margin:.5},
 grinder:{label:'갈아넣기형',checkP:.9,smart:true,applyMinP:.38,maxPending:4,minTenure:540,actHp:15,restHp:5,branch:'ic',margin:.5}
};
const pick=a=>a[Math.floor(Math.random()*a.length)];
function guessCulture(c,P){
 if(!P.smart)return pick(G.CULT);
 if(c.known||c.insider)return c.culture;
 for(const k of G.CULT)if(G.CULT_REV[k].includes(c.rv[0]))return k;
 return pick(G.CULT);
}
function buildRes(p,P){
 const S=G.S,mine=G.myKws();
 const kws=mine.filter(k=>p.kws.includes(k)).slice(0,3);
 const prs=S.projects.slice().sort((a,b)=>(b.tags.filter(t=>p.kws.includes(t)).length*3+b.q/12)-(a.tags.filter(t=>p.kws.includes(t)).length*3+a.q/12)).slice(0,2).map(x=>x.id);
 const tone=guessCulture(G.co(p.co),P);
 return {kws,projects:prs,tone};
}
function pDoc(p,res){return G.clamp(G.sig((G.calcPower(p,res)-G.req(p))/10),0.02,0.95);}
function value(p,P){const c=G.co(p.co);let v=p.tier*1.0+p.level*1.2+p.salary/3000;if(P.wlb)v+=((c.known||c.insider)?(c.wlb+c.env)/2:(c.dw+c.de)/2)*0.9;return v;}
function curValue(P){const j=G.S.job;if(!j)return -99;let v=j.tier+j.level*1.2+j.salary/3000;if(P.wlb)v+=(j.wlb+j.env)/2*0.9;return v;}
function tenure(){const j=G.S.job;return j?G.S.day-j.start:0;}
function hunting(P){const S=G.S;if(!S.job)return true;if(S.job.leaveUntil)return false;return tenure()>=P.minTenure;}

function checkMail(P,st){
 const S=G.S;
 const unread=S.mails.filter(m=>!m.read).reverse();
 for(const m of unread){G.openMail(m.id);G.closeSheet();}
 // bills: pay the first option if it leaves a cushion, else the cheaper one
 for(const m of S.mails){if(m.type==='bill'&&!m.done){const o=m.opts[0];G.payBill(m,(S.money+(o.money||0)>=(P.wlb?300:800))?0:m.opts.length-1);st.bills++;}}
 // headhunter
 for(const m of S.mails){if(m.type==='hh'&&!m.done){m.done=true;const p=m.post;
  if(hunting(P)&&value(p,P)>curValue(P)+P.margin){const res={kws:p.kws.filter(k=>G.myKws().includes(k)),projects:S.projects.slice(0,2).map(x=>x.id),tone:null};
   const app={id:G.nid(),p,res,pw:G.calcPower(p,res)+6,rq:G.req(p),pDoc:1,stage:'hhwait',day:S.day};S.apps.unshift(app);S.stats.applied++;G.sched(S.day+G.RI(1,4),'hh',{app:app.id});st.hh++;}}}
 // interviews
 for(const a of S.apps){if(a.stage==='invite'&&!G.hidden(a)){
  G.openInterview(a.id);const iv=G.UI.iv,c=G.co(a.p.co);
  for(let s=0;s<3;s++){const q=iv.qs[s];let v;
   if(q.type==='c')v='c:'+(P.smart?guessCulture(c,P):pick(G.CULT));
   else if(q.type==='h')v='h:'+(P.smart?0:G.RI(0,3));
   else{const best=S.projects.filter(x=>x.tags.includes(q.kw)).sort((x,y)=>y.q-x.q)[0];v='p:'+(best?best.id:0);}
   G.answer(v);iv.react=null;iv.step++;}
  G.endInterview();G.closeSheet();st.ivScores.push(a.score);
 }}
 // offers
 const offers=S.apps.filter(a=>a.stage==='offer'&&!G.hidden(a));
 if(offers.length){
  offers.sort((x,y)=>value(y.p,P)-value(x.p,P));
  const best=offers[0];
  const take=!S.job||(value(best.p,P)>curValue(P)+P.margin&&(tenure()>=P.minTenure*0.6||best.p.tier-S.job.tier>=2));
  if(take){st.moves.push({day:S.day,tier:best.p.tier,level:best.p.level,salary:best.p.salary,fromTenure:S.job?tenure():null});G.acceptOffer(best);offers.slice(1).forEach(a=>{a.stage='declined';});}
  else offers.forEach(a=>{if(S.day>=a.deadline-1){a.stage='declined';st.declined++;}});
 }
}
function applyJobs(P,st){
 const S=G.S;if(!hunting(P)||S.hp<15)return;
 const pending=S.apps.filter(a=>['doc','wait','hhwait','invite','offer'].includes(a.stage)).length;
 let room=Math.min(2,P.maxPending-pending);if(room<=0)return;
 const y=G.yrs(),cv=curValue(P);
 const cands=S.postings.filter(p=>!p.applied&&!(p.level===1&&y>=2)).map(p=>{const res=buildRes(p,P);return {p,res,pd:pDoc(p,res),v:value(p,P)};})
  .filter(x=>x.pd>=P.applyMinP&&x.v>cv+P.margin).sort((a,b)=>(b.v*b.pd)-(a.v*a.pd));
 for(const x of cands.slice(0,room)){G.submitApp(x.p,x.res);st.pdocs.push(x.pd);}
}
function doActivity(P){
 const S=G.S;if(S.action||P.noAct)return;
 const j=S.job;
 if(j){if(j.leaveUntil)return;
  if(S.hp<P.restHp&&S.leave>=3)return G.startAct('rest');
  if(S.hp>P.actHp){const r=Math.random();return G.startAct(r<.4?'study':r<.8?'side':'network');}
 }else{
  if(S.hp<35&&S.money>=200)return G.startAct('trip');
  const r=Math.random();if(r<.2&&S.money>=10)return G.startAct('network');return G.startAct(r<.6?'study':'side');
 }
}
function runOne(pk,track,maxYears){
 const P=PERSONAS[pk];
 G.newGame('봇',track||pick(Object.keys(G.TR)));
 const S=G.S;S.speed=0;
 const branch=P.branch||pick(['ic','m']);
 const st={persona:pk,track:S.track,hh:0,declined:0,ivScores:[],pdocs:[],moves:[],reach:{1:0},tierReach:{},unempDays:0,leaveDays:0,negDays:0,minMoney:S.money,salaryAt:{},neverReadExpired:0,quitAfterLeave:0,hpLowDays:0,bills:0};
 const end=maxYears*365;
 while(S.day<end&&!S.over){
  S.frac=0.8;G.runDue();
  if(Math.random()<P.checkP){checkMail(P,st);if(!S.over){applyJobs(P,st);doActivity(P);}}
  if(S.over)break;
  if(P.quitAfterLeave&&S.job&&S.job.leaves>=1&&!S.job.leaveUntil&&S.job.wlb<=3){G.endJob('퇴사');st.quitAfterLeave++;}
  if(G.yrs()>=3&&!S.branch)S.branch=branch;
  S.frac=0;
  // count expiries that happen while the result mail was never opened
  const before=S.apps.filter(a=>a.stage==='expired').length;
  const hiddenNow=new Set(S.apps.filter(a=>(a.stage==='invite'||a.stage==='offer')&&G.hidden(a)).map(a=>a.id));
  G.tick();
  S.apps.forEach(a=>{if(a.stage==='expired'&&hiddenNow.has(a.id))st.neverReadExpired++;});
  if(!S.job)st.unempDays++;else if(S.job.leaveUntil)st.leaveDays++;
  if(S.money<0)st.negDays++;st.minMoney=Math.min(st.minMoney,S.money);if(S.hp<20)st.hpLowDays++;
  const pl=G.plevel();for(let L=2;L<=pl;L++)if(st.reach[L]==null)st.reach[L]=S.day;
  const mt=G.maxTier();for(let t=1;t<=mt;t++)if(st.tierReach[t]==null)st.tierReach[t]=S.day;
  if(S.day%(365*5)===0)st.salaryAt[S.day/365]=S.job?S.job.salary:0;
 }
 const exp=S.apps.filter(a=>a.stage==='expired').length;
 return {persona:pk,label:P.label,track:S.track,won:!!S.won,ending:S.over?S.over.kind:'none',grade:S.over&&S.over.grade||null,nw:Math.round(S.money+(S.homeVal||0)),life:Math.round(S.life),car:!!S.car,home:!!S.home,ev:S.ev,bills:st.bills,days:S.day,years:+(S.day/365).toFixed(2),careerYears:+(S.careerDays/365).toFixed(2),
  level:G.plevel(),maxTier:G.maxTier(),branch:S.branch,jobTier:S.job?S.job.tier:0,salary:S.job?S.job.salary:0,employed:!!S.job,
  applied:S.stats.applied,interviews:S.stats.interviews,offers:S.stats.offers,moves:S.stats.moves,leaves:S.stats.leaves,
  fired:S.history.filter(h=>h.reason==='권고사직').length,hops:G.hops(),expired:exp,neverReadExpired:st.neverReadExpired,declined:st.declined,hh:st.hh,
  ghosts:S.apps.filter(a=>a.stage==='ghost').length,unempDays:st.unempDays,leaveDays:st.leaveDays,negDays:st.negDays,minMoney:Math.round(st.minMoney),money:Math.round(S.money),hpLowDays:st.hpLowDays,
  prac:Math.round(S.skill.prac),collab:Math.round(S.skill.collab),lead:Math.round(S.skill.lead),projects:S.projects.length,
  reach:st.reach,tierReach:st.tierReach,salaryAt:st.salaryAt,avgIv:st.ivScores.length?+(st.ivScores.reduce((a,b)=>a+b,0)/st.ivScores.length).toFixed(2):null,
  avgPdoc:st.pdocs.length?+(st.pdocs.reduce((a,b)=>a+b,0)/st.pdocs.length).toFixed(2):null,firstJobDay:st.moves[0]?st.moves[0].day:null,quitAfterLeave:st.quitAfterLeave,
  moveLog:st.moves.map(m=>[m.day,m.tier,m.level,m.salary])};
}
window.SIM={PERSONAS,runOne,results:[],errors:[],running:false,
 async batch(per,maxYears){this.running=true;const keys=Object.keys(PERSONAS);
  for(let i=0;i<per;i++)for(const k of keys){try{this.results.push(runOne(k,null,maxYears));}catch(e){this.errors.push(k+': '+e.message+' '+(e.stack||'').split('\n')[1]);}await new Promise(r=>setTimeout(r,0));}
  this.running=false;}};
})();
