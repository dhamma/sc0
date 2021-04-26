'use strict'
//從 cs0 搬過來已不用 2021/4/25

const { count } = require('console');
/* insert suttacentral segment breaker as \n*/
const fs=require('fs');
const {regPaliword,paliSylDiff}=require('pengine/paliutil');
const folder='pli-books/';
const STARTPN='0';
const knownProblems={
    'dn1_371':'sc has Namo tassa *3',
    'sn4_24':'不太一致',
    'sn4_100':'不太一致',
    'sn4_101':'不太一致',
}

const extractTag=line=>{
    let plaintext='', p=0,tags=[];
    line.replace(/(<[^>]+>)/g,(m,tag,offset)=>{
        plaintext+=line.substring(p,offset); //tag holder
        if (tags.length && tags[tags.length-1][0]==plaintext.length) {
            tags[tags.length-1][1]+=tag;
        } else {
            tags.push([plaintext.length,tag]);
        }
        p=offset+tag.length;
    })
    return {plaintext,tags}
}

const injectTag=(vri,alltags)=>{
    return vri.map((line,idx)=>{
        let p=0,str='';
        alltags[idx].forEach( ([offset,tag])=>{
            str+=line.substring(p,offset);
            str+=tag;
            p=offset;
        });
        str+=line.substr(p);
        return str;
    })
}
const textWithId=content=>{
    const lines=content.split(/\r?\n/);
    let pn=STARTPN;
    return lines.map(line=>{
        const m=line.match(/pn="([^>]+?)"/);
        if (m) pn=m[1];
        const {plaintext,tags}=extractTag(line);
        return [pn,plaintext,tags]; 
    })
}
const purify=line=>{//make it closer to VRI
    return line
    .replace(/ṁ/g,'ṃ')
    .replace(/[:—]/g,'–')
    .replace(/\d+\./g,'')
    .replace(/\([\d– ]+\)/g,'')
    .replace(/n[”’]+ti/g,'$1nti')
    .replace(/([^ ])–([^ ])/g,'$1 – $2');
}
const segmentSC=content=>{
    const lines=content.split(/\r?\n/);
    let pn=STARTPN;
    return lines.map( (line,idx)=>{
        const at=line.indexOf('|');
        if (at>0) {
            pn=line.substr(0,at); // for mn1 119-135
            line=line.substr(at+1);
        }
        return [pn,purify(line)]
    })
    
}

//vri 270,280    sc 270-279,280
const prepare=(VRI,SC,fn)=>{
    const O=[], scO={};
    let ppn='',pn=STARTPN,vri=[],tags=[];

    for (let i=0;i<SC.length;i++){
        pn=SC[i][0].replace(/\-.+/,'');
        if (!scO[pn]) scO[pn]=[];
        scO[pn].push( SC[i][1] );
    }

    for (let i=0;i<VRI.length;i++) { //top line is Namo tassa, not found in SC
        pn=VRI[i][0]||pn;
        if (ppn!==pn && ppn || i==VRI.length-1) {
            let sc=scO[ppn];
            if (!sc) sc=scO[ppn.replace(/\-.+/,'')];
            if (!sc) {
                if (!(fn=="mn1"&&(parseInt(pn)>=121&&parseInt(pn)<=136))) { //known gap
 	               console.log('missing parallels ',fn,pn)
                }
            }
            O.push([ppn,{vri,tags,sc}])
            vri=[],tags=[];
        }
        vri.push(  VRI[i][1]); 
        tags.push( VRI[i][2]); 
        ppn=pn;
    }


    return O;
}
const SyllableCount=text=>{
    let count=0;
    text.replace(regPaliword,()=>count++);
    return count;
}
const falseBreakUp=[];
const autobreak_diff=(fn,pn,SC,VRI,tags)=>{
    if (!SC) {
        return injectTag(VRI,tags).join('\n');
    } 
    const sc=SC.join('句');
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
                        while (sentbreak--) breakat.push([outstr.length+1,'\t']);
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

    if (diffcount>10 &&!knownProblems[fn+'_'+pn]) {
        console.log(fn+'_'+pn,'diff',diffcount,'sylcount',SyllableCount(vri))
    }
    let lineLen=0,Tags=[];
    tags.forEach((ptags,idx)=>{
        Tags=Tags.concat(ptags.map(tag=>[lineLen+tag[0],tag[1]]));
        lineLen+=VRI[idx].length+1;//\n
    })

    const putback=breakat.concat(Tags);
    putback.sort((a,b)=>a[0]-b[0])

//fix here
        //correct false breakup

    const res=injectTag([outstr],[putback]);
    res[0]=res[0].replace(/([bcdghjklmnprstvyṅñṇḍṭḷṁṃŋaāiīuūeoṁṃ])\t/g,(m,m1,offset)=>{
        falseBreakUp.push([fn+'_'+pn,offset]);
        return m1;
    })

    return res;
}

const segmentize=(content,fn)=>{
    const plifn=folder+fn+'.txt';
    let SC=null;
    if (fs.existsSync(plifn)) {
        SC=segmentSC(fs.readFileSync(plifn,'utf8'));
    } else {
        //console.log('cannot find segmented SC books');
        return content;
    }
    const VRI=textWithId(content);
    const O=prepare(VRI,SC,fn);
    let out=O.map( ([k,v])=>[k,autobreak_diff(fn,k,v.sc,v.vri,v.tags)]);

    return out.map(item=>item[1]).join('\n')
        .replace(/\t /g,'\t')
        .replace(/\t– ?/g,'–\t').replace(/\t\. /g,'.\t');;
} 


module.exports={segmentize,falseBreakUp};