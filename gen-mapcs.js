'use strict';
const {segmentize}=require('./mapcs');
const plifolder='pli-books/';
const {readFileSync,readdirSync,writeFileSync}=require('fs');
const {NOTESEP}=require('pengine/textutil');
const vribooks={},scbooks={};  //book , paranum , line
const genVRIbooks=()=>{ 
    let paranum='';
    const mul=readFileSync('../cs0/m-raw.txt','utf8').split(/\r?\n/);
    for (let i=0;i<mul.length;i++) {
        const linetext=mul[i];
        const at=linetext.indexOf('\t');
        const addr=linetext.substr(0,at);
        const at3=addr.indexOf('_');
        const bk=addr.substr(0,at3);
        if (bk=='kp') break;

        let linebody=linetext.substr(at+1);
        const at2=linebody.indexOf(NOTESEP);
        if (at2>-1) linebody=linebody.substr(0,at2);
        const at4=linebody.indexOf('|');
        if (at4>-1) {
            const header=linebody.substr(0,at4);
            linebody=linebody.substr(at4+1);
            const m=header.match(/[\d\.]+/);
            if (m) paranum=m[0];
            else paranum=''; //stopped by subhead
        }

        if (!vribooks[bk]) vribooks[bk]={};
        if (!paranum) continue;
        if (!vribooks[bk][paranum]) vribooks[bk][paranum]=[];
        vribooks[bk][paranum].push(linebody);
    }
}
const genSCBooks=()=>{
    const plibooks=readdirSync(plifolder);
    plibooks.forEach(fn=>{
        const lines=readFileSync(plifolder+fn,'utf8').split(/\r?\n/);
        fn=fn.replace('.txt','');
        scbooks[fn]={};
        let paranum='';
        for (let i=0;i<lines.length;i++) {
            let linetext=lines[i];
            const at=linetext.indexOf('|');
            if (at>-1) {
                paranum=linetext.substr(0,at);
                linetext=linetext.substr(at+1);
            } else {
                if (parseInt(linetext)>0) {
                    paranum=''; //stopped by sc segment id 
                }
            }
            if (!paranum) continue;
            if (!scbooks[fn][paranum]) scbooks[fn][paranum]=[];
            scbooks[fn][paranum].push(linetext);
        }
    });
}
//產生方便diff的文件，差別在換行的數量不同，只比對段落文字，因為兩者的標題不太一致
genVRIbooks();  
genSCBooks();
//console.log(vribooks['dn1']['1']);
//console.log(scbooks['dn1']['1']);
const out=[];
const genmap=()=>{
    for (let bk in scbooks) {
        console.log(bk);
        for (let pn in scbooks[bk]) {
            if (vribooks[bk] && vribooks[bk][pn]) {
                const segmentpos=segmentize(bk,pn,vribooks[bk][pn],scbooks[bk][pn]);
                // console.log(bk,pn,segmentpos);
                out.push(bk+'_'+pn+'\t'+segmentpos.join(','));
                if (false) {
                    console.log(segmentpos.length,segmentpos.join(','))
                    const vri=vribooks['an1'][pn].join('\n');
                    for (let i=0;i<segmentpos.length;i++) {
                        const end=segmentpos[i+1]||vri.length;
                        if (i==0) {
                         //   console.log(vri.substring(0,segmentpos[i])+'$');
                        }
                        //console.log(vri.substring(segmentpos[i],end)+'$');
                    }    
        	    }
        
            }
        }
    }
}

genmap();
writeFileSync('mapcs.txt',out.join('\n'),'utf8')