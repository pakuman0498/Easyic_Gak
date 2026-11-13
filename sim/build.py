# Builds sim/sim.html: the real game file with rendering/saving switched off and its internals exposed, plus bot.js.
import sys, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'ijikgak.html'), encoding='utf-8').read()
def rep(a, b):
    global src
    assert src.count(a) == 1, a
    src = src.replace(a, b)
rep("function save(){try", "function save(){return;try")
rep("function pushNote(m){", "function pushNote(m){return;")
rep("setTimeout(showBranch,50)", "0")
rep("setTimeout(showEnding,600)", "0")
rep("function celebrate(a,prev){", "function celebrate(a,prev){return;")
rep("document.addEventListener('visibilitychange',onVis);", "")
rep("showIntro();\nsetInterval(loop,100);",
    "window.G={get S(){return S},set S(v){S=v},UI,newGame,submitApp,tick,runDue,acceptOffer,startAct,calcPower,req,plevel,yrs,myKws,co,proj,appById,endJob,hidden,hops,maxTier,openMail,closeSheet,openInterview,answer,endInterview,CULT,CULT_REV,QS,T,TR,REQY,sig,clamp,nid,sched,RI,log,payBill,gradeOf};")
src = src.replace("</body>", '<script src="bot.js"></script>\n</body>')
open(os.path.join(here, 'sim.html'), 'w', encoding='utf-8').write(src)
print('built')
