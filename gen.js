'use strict'
const fs=require("fs");
const bilara_folder='../bilara-data/';
const reffolder=bilara_folder+'reference/pli/ms/sutta/';
const extraseg=require('./extraseg');
const knowngap={
	'an4.107:1.1':true, // VRI missing an4.106
	'sn23.26:1.1':true,
	'sn45.171:1.1':true,
	'sn48.115-124:1.1':true,'sn48.169-178:1.1':true,'sn49.23-34:1.1':true,
'sn50.45-54:1.1':true,'sn50.89-98:1.1':true,'sn51.77-86:1.1':true,'sn53.45-54:1.1':true,
}

const booknames={
	dn:{1:'dn1',14:'dn2',24:'dn3'},
	mn:{1:'mn1',51:'mn2',101:'mn3'},
	sn:{1:'sn1',12:'sn2',22:'sn3',35:'sn4',45:'sn5'}
}

const hassub={'dn':false,'mn':false,'sn':true,'an':true};
const msdiv=require('./msdiv');
const getRef=(refs,id)=>(typeof msdiv[id]!=='undefined')?msdiv[id]:refs[id]||'';

const sortFilenames=filenames=>{
	filenames.sort((f1,f2)=>{
		const m2f1=f1.match(/(\d+)\.(\d+)/);
		const mf1=f1.match(/(\d+)/);
		const m2f2=f2.match(/(\d+)\.(\d+)/);
		const mf2=f2.match(/(\d+)/);

		if (!m2f1) return parseInt(mf1[1])-parseInt(mf2[1]);
		
		return m2f1[1]==m2f2[1]?(parseInt(m2f1[2])-parseInt(m2f2[2])):
			(parseInt(m2f1[1])<parseInt(m2f2[1])?1:-1)
	})
}

const json2txt=json=>{
	json=json.replace(/ *\"(\S+)\": \"(.*?)\"\,?/g,(m,id,line)=>id+'|'+line.trimRight());
	json=json.replace(/\{/g,'');
	json=json.replace(/\}\{\r?\n/g,'');
	json=json.replace(/\r?\n\}/g,'');
	return json.trim();
}

const dobook=(bookcontent,{fn,lang,comments,references,idarr})=>{
	const lines=json2txt(bookcontent).split(/\r?\n/);
    const output=[];
    lines.forEach(line=>{
		const arr=line.split("|");
		let id=arr[0], text=arr[1];
		let PN='',paranum='';
        const ref=getRef(references,id);
		if (ref.indexOf("msdiv")>-1 && !extraseg[id]){
			const pn=[];
			ref.replace(/msdiv([\-\d]+)/g,(m,n)=>{
				pn.push(n);
			})
			const pnlast=pn[pn.length-1];
			// const at=pnlast.indexOf("-");
			// let endnum=parseInt( at>0? pnlast.substr(at+1):pnlast);
			paranum=pn.length>1? pn[0]+'-'+pnlast: pn[0];

			PN='\t'+paranum;
		} else PN='';
		idarr&&idarr.push(id+PN);

        if (extraseg[id]) {
            const {pn}=extraseg[id];
            let at=text.indexOf( extraseg[id][lang]);
            if (at==-1) {
                console.log(fn,pn,extraseg[id],text)
                throw "error extraseg for id "+id;
            }
            output.push(text.substr(0,at)+(comments&&comments[id]?"|||"+comments[id]:""));
            output.push((pn+'|'+text.substr(at)));
            idarr&&idarr.push(id+'+\t'+pn); //+表示拆分段, 英譯相同段號
        } else {
            output.push((paranum?paranum+'|':'')+text+(comments&&comments[id]?"|||"+comments[id]:""));
        }
    });
    
    let ppn=0;
    for (let i=1;i<idarr.length;i++) { //need to check contin
        const at=idarr.indexOf('\t');
        if (at==-1)continue;
        pn=parseInt(idarr[i].substr(at+1));
        if (ppn+1!==pn) {
            if (!knowngap[id]) console.log("paranum gap",pn,ppn);
        }
        ppn=pn;
    }
	return output.join("\n");
}

const readdir=(filenames,mainfolder,opts)=>{
    const {lang,comments,references,multibook}=opts||{};
	sortFilenames(filenames);
	let bookname='',lastfn='';
	let bookcontent='';
	filenames.forEach(fn=>{
		const prefix=fn.match(/[^\d]+/)[0];
		const bkn=fn.match(/\d+/)[0];
		const content=fs.readFileSync(mainfolder+fn,'utf8');
		if (booknames[prefix] && booknames[prefix][bkn]) {
			if (bookname&&bookname!==booknames[prefix][bkn] && multibook) {
				const idarr=[];
				const content=dobook(bookcontent,{fn,lang,comments,references,idarr});
				writeresult(bookname,content,idarr,opts);
				idarr.length=0;
				bookcontent='';
			}
			bookname=booknames[prefix][bkn];
		}
        bookcontent+=content;
        lastfn=fn;
	})
	if (multibook) {
		const idarr=[];
		const res=dobook(bookcontent,{fn:lastfn,lang,comments,references,idarr});
		writeresult(bookname,res,idarr,opts);
	}
	return bookcontent;
}

const genbook=opts=>{
    const {filter,lang='pli',pitaka='sutta'}=opts;
	const folder=bilara_folder+ {pli:'root/pli/ms/'+pitaka+'/', 
	en:'translation/en/sujato/'+pitaka+'/',my:'translation/my/my-team/'+pitaka+'/'}[lang];
    const comfolder=(lang=='en'&&pitaka=='sutta')?(bilara_folder+ 'comment/en/sujato/'+pitaka+'/'):''

	for (let ni in hassub) {
        if (filter&& filter.indexOf(ni)==-1 ) continue;
        const files=fs.readdirSync(folder+ni);
		const comment_files=comfolder?fs.readdirSync(comfolder+ni):[];
		const reference_files=fs.readdirSync(reffolder+ni);
		let bookcontent='',comments,references;
		if (hassub[ni]) {
			sortFilenames(files);
			let bookname='';
			const idarr=[];
			files.forEach(sub=>{
				const fo=ni+'/'+sub+'/';
				const subfiles=fs.readdirSync(folder+fo);
				const comfiles=fs.existsSync(comfolder+fo)&&fs.readdirSync(comfolder+fo);
				const reffiles=fs.readdirSync(reffolder+fo);
				comments=comfiles?JSON.parse(readdir(comfiles,comfolder+fo).replace(/\}\{/g,",")):{};
				references=JSON.parse(readdir(reffiles,reffolder+fo,opts).replace(/\}\{/g,","));
				
				const bkn=sub.match(/\d+/)[0];

				if (booknames[ni]&&booknames[ni][bkn]) { //SN
					if (bookname&&bookname!==booknames[ni][bkn]) {
						writeresult(bookname,bookcontent,idarr,opts);
						bookcontent='';
						idarr.length=0;
					}
					bookname=booknames[ni][bkn];
                }
				const rawcontent=readdir(subfiles,folder+fo);
				const content=dobook(rawcontent,{fn:sub,lang,comments,references,idarr});
				if (bookcontent) bookcontent='\n'+bookcontent;
				bookcontent+=content;
				if (!bookname) {
					writeresult(sub,bookcontent,idarr,opts);
					bookcontent='';
					idarr.length=0;
				}
			});
			
			if (bookname) {
				writeresult(bookname,bookcontent,idarr,opts);
			}
		} else {
			comments=comfolder?JSON.parse(readdir(comment_files,comfolder+ni+'/').replace(/\}\{/g,",")):null;
            references=JSON.parse(readdir(reference_files,reffolder+ni+'/').replace(/\}\{/g,","));
            const newopts=Object.assign({comments,references,multibook:true},opts)
            readdir(files,folder+ni+'/',newopts);
		}
	}
}
const writeresult=(bookname,content,idarr,{lang,filter,writetodisk=false})=>{
    if (filter&& filter.indexOf(bookname)==-1 ) return;
    const lines=content.split('\n');
    if (lang=='pli') {
        const error=(lines.length!==idarr.length)?'not equal to linecount='+lines.length:'';
        console.log(bookname+".txt size",content.length,'id count',idarr.length,error,'written:'+writetodisk);            
    } else {
        const pliid=fs.readFileSync('pli.id/'+bookname+'.js','utf8')
        .replace(/`/g,'')
        .replace('module.exports=','')
        .split(/\r?\n/)
            // .map(item=> item.split('\t')[0]);
        const out=[],missing=[];
        //因為定位是以 pli 為準，譯文可能缺段。但必須留空行。
        pliid.forEach(id=>{
            const at=idarr.indexOf(id);
            if (at==-1) {
                missing.push(id);
                out.push('');
            } else {
                out.push(lines[at]); 
            }
        })
        content=out.join('\n');
        missing.length&&console.log('missing',missing);
    }
    
    
	if (writetodisk) {
		fs.writeFileSync(lang+'-books/'+bookname+'.txt',content,'utf8');
		if (lang=='pli') fs.writeFileSync('pli.id/'+bookname+'.js','module.exports=`'+idarr.join('\n')+'`','utf8');
    }
}

module.exports={genbook}