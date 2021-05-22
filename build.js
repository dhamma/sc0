'use strict'
const fs=require("fs");
const {pack_delta,pack,unpack_delta2d,unpack_delta, pack_delta2d}=require('pengine/packintarr');
const {createBuilder}=require("pengine/builder");
const {getSentenceBreak}=require('../cs0/sentencebreak');
const {NOTESEP,HEADSEP}=require('pengine/textutil')
const lang=process.argv[2]||'en';
const folder="./"+lang+"-books/";
const paranames_folder=lang+'-paranames/';
const booknames=['dn1','dn2','dn3',
	'mn1','mn2','mn3','sn1','sn2','sn3','sn4','sn5',
	'an1','an2','an3','an4','an5','an6','an7','an8','an9','an10','an11'
]
const getParaname=bk=>{
	const out=[];
	let ppn=-1.;
	const fn=paranames_folder+bk+'.txt';
	if (fs.existsSync(fn)) {
		const lines=fs.readFileSync(fn,'utf8').split(/\r?\n/);
		lines.forEach(line=>{
			let [pn,text]=line.split('\t');
			pn=parseInt(pn);
			if (out[pn]) console.log('warning repeated pn',pn,bk,line);
			out[pn]=text;
			if (ppn>=pn) console.log('error pn',bk,line,ppn,pn)
		})
	}
	for (let i=0;i<out.length;i++) {
		if (typeof out[i]=='undefined') out[i]='';
	}
	return out.join('|');
}
const build=()=>{
	let prevbk='';
	const paranames=[];
	const builder=createBuilder({name:"sc0"+lang});
	booknames.forEach(bk=>{
		const fn=folder+bk+".txt";
		if (!fs.existsSync(fn))return;
		const rawlines=fs.readFileSync(fn,'utf8').split(/\r?\n/);
		for (var i=0;i<rawlines.length;i++) {
			const content=rawlines[i];
			if (prevbk&&bk!==prevbk){
				builder.newpage(-1,0);
				paranames.push( getParaname(prevbk) );
				builder.addbook(prevbk);
			}
			prevbk=bk;
			const at2=content.indexOf(HEADSEP);
			const at4=content.indexOf(NOTESEP);
			if (at2>-1 && parseInt(content) && at2!==at4) {
				const paranum=parseInt(content.substr(0,at2));
				builder.newpage(paranum,0,bk);
			}
			builder.addline(content);
		}

	})
	paranames.push( getParaname(prevbk) );
	builder.addbook(prevbk);

	const sentencebreak=getSentenceBreak(builder,'sentencebreak.txt');
	
	const payload=paranames;
	builder.done(payload,{$sentencebreak:sentencebreak.join('\n')});
}

build();