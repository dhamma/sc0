const fs=require("fs");
const Sax=require("sax");
const {palialpha,isPaliword}=require("pengine/paliutil")
const {unique0}=require("pengine/arrutil")
const extraheadword=require("./extraheadword");
const pdf_pg_txt=fs.readFileSync('./ped-pdf-pg.txt','utf8').split(/\r?\n/);
const pdf_pg={};

/*
 headword.txt格式說明
 khaleti,31330   字, 所在ped-raw.txt 行
 khallāta+sīsa  在khallāta 詞條中，定義組合字 khallātasīsa , sīsa 存在字典中
 khallātiya@khallāta,31340  khallāta詞條中，參考了 khallātiya
 khalu-pacchābhattika,31321 khalu 詞條中，組合的後半無<a>，字典無定義
 khandha+@rasa,69637 rasa 詞條定義了 khandharasa
*/
const build_pdf_pg=()=>{
	pdf_pg_txt.forEach(line=>{
		let [pg,w1,w2]=line.split('\t');
		if (!w1)return;
		w1=w1.replace('*','');
		w2=w2.replace('*','');
		if (!pdf_pg[w1]) pdf_pg[w1]=-parseInt(pg)*2;
		if (!pdf_pg[w2]) pdf_pg[w2]=-parseInt(pg)*2+1;
	})
}
build_pdf_pg();
let failed=0,passed=0;
const assert=(a,b,testname)=>{
	if (a!==b) {
		testname&&console.log('test:',testname);
		console.log('expecting',a);
		console.log('got',b);
		failed++;		
	} else passed++
}

const testdata=[
//["<i class='term'><a href='/define/hasati'>hasati</a></i>",'^^hasati '],
//["<i class='term'>heṣ</i>",'^heṣ '],
//["<sup>1<\/sup>","¹"]
]
inlineli=(m,m1)=>{
	const i=parseInt(m1);
	if (m1>0&&m1<10) {
		return String.fromCharCode(0x2473+i);
	}
	if (m1.match(/[a-z]/)){
		return String.fromCharCode((m1.charCodeAt(0)-0x61)+0x249c);
	}
	errors.push(rawtext.length+"\tinlineli\t"+m1)
	return m;
}


abbr=(m,m1)=>{
	return "㉆"+m1;
}
fatal=(msg)=>{
	throw msg+" at "+rawtext.length+" "+curword;
}


const unorderlist={compounds:' ——————————————————————————',
						plain:' ⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕⁕'}
const orderlist={
	'decimal':  ' ①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'                     //decimal,  level 1
	,'upper-latin': ' ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ'   //level 2 upper latin
	,'lower-latin': ' ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'   //level 2lower latin
	,'lower-greek': ' αβγδεζηθικλμνξοπρςστυφχψω'                    //level 3 lower greek
	,'upper-roman': ' ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ'                  
	,'little':'                            '

	   //upper-roman , replace decimal as level 1, used in anu gutta arahant rudati
}	   //

let curword='',curline='';
let prevtext='';
let headword=[];
let rawtext=[];
const errors=[];
const tagstack=[];
const liststack=[];
const listtypes=[];

let snippet='',linetext='';
const superscript={1:"¹",2:"²",3:"³",4:"⁴",5:"⁵",6:"⁶",7:"⁷",8:"⁸",9:"⁹"};
let listdepth=0,linkcount=0;
const O={}, H={};
O.ol=tag=>{
	oltype=orderlist[tag.attributes.class];
	if (!oltype) {
		oltype=orderlist.decimal;//for "gati" missing class
		// console.log("ol default to decimal",curword)
	}
	listtypes.push(oltype);
	liststack.push(0);

	if (linetext) rawtext.push(linetext);
	linetext='';

}
O.ul=tag=>{
	oltype=unorderlist[tag.attributes.class];
	if (!oltype) fatal("unknow ul type"+tag.attributes.class)
	listtypes.push(oltype);
	liststack.push(0);

	if (linetext) rawtext.push(linetext);
	linetext='';
}
let newcompound=false;
O.a=tag=>{
	if (tag.attributes.href && snippet=="-") {
		newcompound=true;
	}
}
H.a=tag=>{
	if (newcompound) {
		addheadword(curword+"+"+snippet);
		newcompound=false;
	}
}
H.ol=tag=>{
	listtypes.pop();
	liststack.pop();
}
H.ul=tag=>{
	listtypes.pop();
	liststack.pop();

}
O.li=tag=>{
	const licount=++liststack[liststack.length-1];
	const oltype=listtypes[listtypes.length-1];
	const mark=oltype.substr(licount,1)+' ';
	linetext+=indent()+mark;	
}
H.li=tag=>{
	rawtext.push(linetext);
	linetext='';
}

H.dfn=tag=>{
//	linetext+='\n%%'+snippet+"\n";
}

O.p=tag=>{
	const attrs=tag.attributes;
	if (attrs.class=='case'){
		linetext+="㉆";
	}
	rawtext.push(linetext);
	linetext='';
}
O.span=tag=>{
	const attrs=tag.attributes;
	if (attrs.class=='case'){
		linetext+="㉆";
	}
}


H.p=tag=>{
	if (tag.attributes.class=="eti") {
		linetext="Ĕ "+linetext; 
	}
	rawtext.push(indent()+linetext);
	linetext='';
}
H.h3=tag=>{}
H.h4=tag=>{}
H.em=tag=>{}
H.cite=tag=>{}
H.small=tag=>{}
H.abbr=tag=>{}

const indent=()=>{
	let str='';
	for (var i=0;i<listtypes.length;i++) str+='　';
	return str;
}

//grammar ㊠㊟㊫㊔㊞㉆㉄

const knownbook={'Dāvs':true,'Pp-a':true,'Thag':true,'Kp':true,'Dhs-a':true,
'Divy':true,'SN':true,'Mnd':true,'Vv-a':true,'Mil':true,'AN':true,'Dhp':true,
'Vism':true,'Pv-a':true,'DN-a':true,'Snp-a':true}
H.span=tag=>{
	const attrs=tag.attributes;
	const backward=snippet.length;

	if (attrs.class=='ref') {
		spaceat=snippet.indexOf(" ");
		if (spaceat>-1) {
			const bn=snippet.substr(0,spaceat);
			if(knownbook[bn]) {
				snippet=bn+'.'+snippet.substr(spaceat+1);
			} else {
				errors.push(rawtext.length+"\tref\t"+snippet )
			}
		}
		if (snippet.indexOf(";")>-1) { //SN.i.144; iv.290 v.263
			snippet=snippet.replace(';',',');
		}
		linetext=linetext.substr(0,linetext.length-backward);
		linetext+="@"+snippet+";";
		linkcount++;
	}
}
O.i=tag=>{
	const attrs=tag.attributes;
	if (attrs&&attrs.class&&attrs.class=='term') {
		linetext+="{";
	}	
}
//deal with sandhi
makecompound=str=>{
	return str.replace(/˚/g,curword);
}
H.i=tag=>{
	const attrs=tag.attributes;
	if (attrs&&attrs.class&&attrs.class=='term') {
		//console.log("i",snippet,snippet.indexOf("˚")>-1)
		const expand=snippet.indexOf("˚")>-1 && snippet.indexOf("-")==-1;
	
		if (expand){
			linetext=linetext.substr(0,linetext.length-snippet.length);
			//compound=makecompound(snippet);
			linetext+=snippet;
			
			const regex=new RegExp("(["+palialpha+"]+)",'gi');
			const expandword=snippet.split(regex);
			
			for (w of expandword){
				if (isPaliword(w)&& w.toLowerCase()!==curword){
					addheadword(w.toLowerCase()+"+@"+curword);
				}
			}
		} else if (snippet[0]=='-' && !newcompound) {
			//not enclosed by <a> , around 3000+ 
			//eg ghara-kapoṭa
			if (isPaliword(snippet.substr(1))) {
				//@ make it after master headword
				addheadword(curword+snippet); // snippet has no defination
			}
		} else {
			if (snippet!==curword){
				const arr=snippet.split(/ +/);
				for (w of arr){
					if (isPaliword(w) && w.toLowerCase()!=curword)
					  addheadword(w.toLowerCase()+"@"+curword);
				}
			}
		}
		
		linetext+="}";
	}
}
let entrycount=0,prevalpha='',pagestart=0;
H.dt=tag=>{
	//˚Khattuṃ invalid ˚ in <dfn>
	let alpha=linetext.match(/^[\*˚-]?([A-YĀŪĪpjÑṬḌḶ])/); //jalūkā (new insert pts pdf 580)
	if (!alpha) throw "invalid wordhead"+linetext;
	alpha=alpha[1].toUpperCase();

	if (prevalpha!==alpha){
		rawtext.push("::"+alpha);
		if (entrycount<5) {
			//console.log(entrycount,"too few page",linetext,rawtext.length)
		}
		entrycount=0;
		pagestart=rawtext.length;
	}
	addheadword(curword);

	if (pdf_pg[curword]) {
		// console.log('cannot find',curword,'in pdf pg mapping')
		if (pdf_pg[curword]<0) pdf_pg[curword]=-pdf_pg[curword];
	}

	rawtext.push(":"+(entrycount+1)+"-"+linetext);
	//may contains multiple terms
	
	entrycount++;
	prevalpha=alpha;
	linetext='';
}
H.dl=tag=>{
	if (linetext) rawtext.push(linetext);
	linetext='';
}
H.dd=tag=>{
	//const attrs=tag.attributes;
	//curword=attrs.id;
	//if (curword) linetext+="\n%%"+curword+"\n";
}
H.br=tag=>{
	rawtext.push(linetext);
	linetext=indent();
}
H.sup=tag=>{
	const s=superscript[snippet];
	const backward=snippet.length;
	linetext=linetext.substr(0,linetext.length-backward)
	if (s)linetext+=s;
	else linetext+="<s>"+snippet+"</s>";
}

onopentag=(tag)=>{
	handler=O[tag.name]
	handler&&handler(tag);
	tagstack.push(tag);
}
onclosetag=()=>{
	const tag=tagstack.pop();
	handler=H[tag.name];
	if (handler) {
		handler(tag);
	} else {
		console.log("unknown tag",tag.name)
	}
}
ontext=(t)=>{
	snippet=t;//.replace(/˚/g,curword);
	linetext+=snippet;
}
parsetext=text=>{
	text=text.replace(/<br>/g,'<br/>');
	text=text.replace(/&/g,'&amp;');

	var parser=Sax.parser(true);
	parser.onopentag=onopentag;
	parser.onclosetag=onclosetag;
	parser.ontext=ontext;
	parser.write(text);
}
const highfreq=[]
addheadword=w=>{
	headword.push([w,rawtext.length]);
	const ex=extraheadword[w];
	if (ex) {
		headword.push([ex,rawtext.length]);
		delete extraheadword[w]
	}
}
const epilog=lines=>{
	return lines.map(line=>line.replace(/\}([¹²³⁴⁵⁶⁷⁸⁹])/g,'$1}')); //移入義項標記
}
dofile=()=>{
	const pts=JSON.parse(fs.readFileSync("./pts.json","utf8"));
	const MAXWORD=pts.length
	let linenow=0;
	for (var i=0;i<MAXWORD;i++){
		curword=pts[i].word;
		const text=pts[i].text;
		
		m1=text.match(/<dd.+<\/dd>/);
		if (!m1) {
			console.log(text)
		}
		m2=prevtext.match(/<dd.+<\/dd>/);
		if (prevtext && m1[0]==m2[0]){
			//Māsati, Māsana, Māsin 未去除，dl#id 不同
			errors.push(rawtext.length+"\trepeated def"+"\t"+curword)
			continue;
		}
		prevtext=text;
		linenow=rawtext.length;
		const linknow=linkcount;
		parsetext(text);
		const entrylinecount=rawtext.length-linenow;
		
		if (entrylinecount>20 || linkcount-linknow>50) {
			highfreq.push([curword,entrylinecount,linkcount-linknow])
		}
	}
	rawtext=epilog(rawtext);
}

finalize=()=>{
	headword.sort((a,b)=>(a[0]==b[0])?0:((a[0]>b[0])?1:-1));	
	// headword=unique0(headword);不能去重 ，例Kasiṇa
	highfreq.sort((a,b)=>b[2]-a[2]);
}
writefile=()=>{
	fs.writeFileSync("ped-raw.txt",rawtext.join("\n"),"utf8");
	fs.writeFileSync("ped-headword.txt",headword.join("\n"),"utf8");
	fs.writeFileSync("ped-error.txt",errors.join("\n"),"utf8");
	fs.writeFileSync("ped-freq.txt",highfreq.join("\n"),"utf8");
}
testit=()=>{
	testdata.forEach(test=>assert(test[1],remarkup(test[0])));
	console.log("passed",passed,"failed",failed);	
}
testit();

dofile();
finalize();

for (const w in pdf_pg) {
	if (pdf_pg[w]<0) {
		console.log('not found',(-pdf_pg[w])/2,w)
	}
}
writefile();
