'use strict'
/* insert suttacentral segment breaker as \n*/
const {readFileSync,writeFileSync}=require('fs');
const {regPaliword,paliSylDiff}=require('pengine/paliutil');
const knownProblems={
    'dn1_371':'sc has Namo tassa *3',
    'sn4_24':'不太一致',
    'sn4_100':'不太一致',
    'sn4_101':'不太一致',
}
const purify=line=>{//make it closer to VRI
    return line
    .replace(/ṁ/g,'ṃ')
    .replace(/:/g,' –')
    .replace(/([^ ])—/g,'$1 –')
    // .replace(/\d+\./g,'')
    // .replace(/\([\d– ]+\)/g,'')
    .replace(/n([”’]+)ti/g,'$1nti')
    // .replace(/([^ ])–([^ ])/g,'$1 – $2');
}

const SyllableCount=text=>{
    let count=0;
    text.replace(regPaliword,()=>count++);
    return count;
}
const falseBreakUp=[];
const autobreak_diff=(bk,pn,VRI,SC)=>{
    const sc=purify(SC.join('句'));
    const vri=VRI.join('段');
    const diff=paliSylDiff(vri,sc);
    const breakat=[];
    let i=0,outstr='',diffcount=0;
    while (i<diff.length) {
        let d=diff[i];
        const dv=(d.value||'').replace(/段/g,'\n');
        const dvsylcount=SyllableCount(dv);
        if (d.value && !d.added &&!d.removed) {
            outstr+=dv;
        } else {
            if (d.removed) { //replacement
                if (diff[i+1] && diff[i+1].added ) {
                    const nv=diff[i+1].value;
                    let sentbreak=0;
                    nv.replace(/句/g,()=>sentbreak++);
                    if (sentbreak) {
                        if (dv.indexOf('\n')!==-1) sentbreak--; //與段號相抵消
                        while (sentbreak--) breakat.push(outstr.length+1);
                    }
                    const dc=Math.abs(SyllableCount(dv) -SyllableCount(nv))
                    if (dc>2 && nv.indexOf('Nikāya')==-1) { //拼讀差異不計入
                        // console.log('PN'+pn,dc,dv,1,nv)
                        diffcount+=dc; 
                    }
                    i++;
                }  else {
                    if (dvsylcount>2) diffcount+=dv; //拼讀差異不計入
                }
                outstr+=dv;
            } else {
                if (dvsylcount>2) diffcount+=dvsylcount; //拼讀差異不計入
            }
        }
        i++;
    }
    return breakat;
}


const segmentize=(bk,pn,vri,sc)=>{
    return autobreak_diff(bk,pn,vri,sc);
}
module.exports={segmentize,falseBreakUp};