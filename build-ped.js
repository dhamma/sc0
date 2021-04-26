'use strict'
const fs=require("fs")
const {pack3}=require('pengine/packintarr');
const {createBuilder}=require('pengine/builder');
const MAXWORD=-1;

buildheadword=()=>{
	const arr=fs.readFileSync("ped-headword.txt","utf8").split(/\r?\n/);
	const x0arr=[],headwords=[];
	for (var i=0;i<arr.length;i++) {

		const at=arr[i].indexOf(",");
		headwords.push(arr[i].substr(0,at));
		x0arr.push(parseInt(arr[i].substr(at+1)));
	}
	const headwordx0=pack3(x0arr);
	return {headwords,headwordx0}
}

build=(payload,extra)=>{
	const arr=fs.readFileSync("ped-raw.txt","utf8").split(/\r?\n/);	
	const name="sc0ped";
	const builder=createBuilder({name});
	let prevbk='',prevpage=0,pagecount=0;
	for (var i=0;i<arr.length;i++) {
		const line=arr[i];
		if (line[0]==":") {
			if (line[1]==":") {
				builder.addline("::"+line.substr(2));
				if (prevbk) {
					builder.addbook(prevbk);
				}
				prevbk=line.substr(2);
			} else {
				pagecount++;
				if (MAXWORD>0 && pagecount>MAXWORD) {
					break;
				}
				const pagenum=parseInt(line.substr(1));;
				builder.newpage(pagenum,0,prevbk);

				builder.addline("㊔"+line.substr( pagenum.length +1));
			}
			continue
		}
		builder.addline(line);
	}
	builder.addbook(prevbk);
	builder.done(payload,extra);
	console.log("done")
}
const {headwords,headwordx0}=buildheadword();
build(headwords,{headwordx0});