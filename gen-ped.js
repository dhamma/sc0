const fs=require("fs");
const Sax=require("sax");
const {palialpha,isPaliword}=require("dengine")

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
const headword=[];
const rawtext=[];
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
		console.log("ol default to decimal",curword)
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
H.span=tag=>{
	const attrs=tag.attributes;
	const backward=snippet.length;

	if (attrs.class=='ref') {
		if (snippet.indexOf(" ")>-1) {
			errors.push(rawtext.length+"\tref\t"+snippet )
		}
		//snippet=snippet.replace(/ /g,'');
		linetext=linetext.substr(0,linetext.length-backward);
		linetext+="@["+snippet+"]";
		linkcount++;
	}
}
O.i=tag=>{
	const attrs=tag.attributes;
	if (attrs&&attrs.class&&attrs.class=='term') {
		linetext+="^[";
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
		const expand=snippet.indexOf("˚")>-1;
		if (expand){
			linetext=linetext.substr(0,linetext.length-snippet.length);
			compound=makecompound(snippet);
			linetext+=snippet;
			const regex=new RegExp("(["+palialpha+"]+)",'gi');
			const expandword=compound.split(regex);
			for (w of expandword){
				if (isPaliword(w)){
					addheadword(w.toLowerCase());
				}
			}
		} else if (snippet[0]=='-' && !newcompound) {
			//not enclosed by <a> , around 3000+ 
			//eg ghara-kapoṭa
			if (isPaliword(snippet.substr(1))) {
				addheadword(curword+snippet); // snippet has no defination
			}
		}
		linetext+="]";
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
	if (curword=="ghara") debugger
	rawtext.push(":"+(entrycount+1)+"-"+linetext);
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
}

finalize=()=>{
	headword.sort((a,b)=>(a[0]==b[0])?0:((a[0]>b[0])?1:-1));	
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
finalize()
writefile();
