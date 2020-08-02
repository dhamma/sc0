'use strict'
const fs=require("fs");
const bilara_folder='../bilara-data/';
const folder=bilara_folder+'translation/en/sujato/sutta/';
const comfolder=bilara_folder+'comment/en/sujato/sutta/';
const reffolder=bilara_folder+'/reference/pli/ms/sutta/';
const nikaya={'dn':false,'mn':false,'sn':true,'an':true};

const booknames={
	dn:{1:'dn1',14:'dn2',24:'dn3'},
	mn:{1:'mn1',51:'mn2',101:'mn3'},
	sn:{1:'sn1',12:'sn2',22:'sn3',35:'sn4',45:'sn5'}
}
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
const writetodisk=true;

var lastparanum=0;
const knowngap={
	'an4.107:1.1':true, // VRI missing an4.106
	'sn23.26:1.1':true,
	'sn45.171:1.1':true,
	'sn48.115-124:1.1':true,'sn48.169-178:1.1':true,'sn49.23-34:1.1':true,
'sn50.45-54:1.1':true,'sn50.89-98:1.1':true,'sn51.77-86:1.1':true,'sn53.45-54:1.1':true,
}
const dobook=(bookcontent,comments,refs)=>{
	const lines=json2txt(bookcontent).split(/\r?\n/);
	
	const output=lines.map(line=>{
		const arr=line.split("|");
		const id=arr[0], text=arr[1];
		let prefix='';
		if (refs[id] && refs[id].indexOf("msdiv")>-1){
			const pn=[];
			refs[id].replace(/msdiv([\-\d]+)/g,(m,n)=>{
				pn.push(n);
			})
			const pnlast=pn[pn.length-1];
			const at=pnlast.indexOf("-");
			let endnum=parseInt( at>0? pnlast.substr(at+1):pnlast);
			let paranum=pn.length>1? pn[0]+'-'+pnlast: pn[0];
			
			if (id=="an1.171:1.1" && paranum=="17") { //report to sc issue bilara-data#220
				paranum="171";
				endnum=171;
			}

			prefix=paranum+"|";
			if (parseInt(paranum)!==lastparanum+1) {
				if (!knowngap[id])console.log("paranum gap",id,lastparanum,paranum);
			}
			
			lastparanum=endnum;
		}
		if (id=="sn23.25:1.1") prefix='184|';
		else if (id=="sn45.170:2.1") prefix='171|'

		return prefix+text+(comments[id]?"|||"+comments[id]:"");
	}).filter(item=>item);
	return output.join("\n");
}
const writefile=(bookname,content)=>{
	console.log("write ",bookname+".txt length",content.length);
	lastparanum=0;
	if (writetodisk) fs.writeFileSync('books/'+bookname+'.txt',content,'utf8');
}

const readdir=(filenames,bk,folder,comments,refs,multibook)=>{
	sortFilenames(filenames);
	let bookname='';
	let bookcontent='';

	filenames.forEach(file=>{
		const prefix=file.match(/[^\d]+/)[0];
		const bkn=file.match(/\d+/)[0];
		const content=fs.readFileSync(folder+file,'utf8');
		if (booknames[prefix] && booknames[prefix][bkn]) {
			if (bookname&&bookname!==booknames[prefix][bkn] && multibook) {
				const content=dobook(bookcontent,comments,refs);
				writefile(bookname,content);
				bookcontent='';
			}
			bookname=booknames[prefix][bkn];
		}
		bookcontent+=content;
	})
	if (multibook) {
		const content=dobook(bookcontent,comments,refs);
		writefile(bookname,content);
	}
	return bookcontent;
}

const genbook=(folder)=>{
	for (let ni in nikaya) {
		const files=fs.readdirSync(folder+ni);
		const comment_files=fs.readdirSync(comfolder+ni);
		const reference_files=fs.readdirSync(reffolder+ni);
		const subfolder=nikaya[ni];
		let bookcontent='',comments,references;
		if (subfolder) {
			sortFilenames(files);
			let bookname='';
			files.forEach(sub=>{
				const fo=ni+'/'+sub+'/';
				const subfiles=fs.readdirSync(folder+fo);
				const comfiles=fs.existsSync(comfolder+fo)&&fs.readdirSync(comfolder+fo);
				const reffiles=fs.readdirSync(reffolder+fo);
				comments=comfiles?JSON.parse(readdir(comfiles,ni,comfolder+fo).replace(/\}\{/g,",")):{};
				references=JSON.parse(readdir(reffiles,ni,reffolder+fo).replace(/\}\{/g,","));

				const bkn=sub.match(/\d+/)[0];

				if (booknames[ni]&&booknames[ni][bkn]) {
					if (bookname&&bookname!==booknames[ni][bkn]) {
						writefile(bookname,bookcontent);
						bookcontent='';
					}
					bookname=booknames[ni][bkn];
				}
				
				const rawcontent=readdir(subfiles,sub,folder+fo);
				bookcontent+= "\n"+dobook(rawcontent,comments,references);
				if (!bookname) {
					writefile(sub,bookcontent);
					bookcontent='';
				}

			});
			
			if (bookname) writefile(bookname,bookcontent);
		} else {
			comments=JSON.parse(readdir(comment_files,ni,comfolder+ni+'/').replace(/\}\{/g,","));
			references=JSON.parse(readdir(reference_files,ni,reffolder+ni+'/').replace(/\}\{/g,","));
			readdir(files,ni,folder+ni+'/',comments,references,true);
		}
		
	}

}
genbook(folder)