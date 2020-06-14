const fs=require("fs")
const ptsjson=fs.readFileSync("./pts.json","utf8");//form suttacentral/sc-data/dictionaries
console.log('parsing json');
const ped=JSON.parse(ptsjson);
//available symbols:  $ ^  
//māsati māsana māsin duplicate with | , and jimha , only 4 |

const refs=[];
ped.forEach( entry=>{
	const text=entry.text;
	//text.replace(/<dfn>(.+?)<\/dfn>/g,(m,dfn)=>{
	//	console.log(dfn,entry.word)
	//})

	text.replace(/<span class='ref'>(.+?)<\/span>/g,(m,ref)=>{
		refs.push(ref);
	})
})
console.log('stat')
refs.sort();
const books={};
refs.forEach(ref=>{
	const at=ref.indexOf(".");
	if (at==-1){
		console.log(ref);
		return;
	}
	const bk=ref.substr(0,at)
	if (!books[bk]) books[bk]=0;
	books[bk]++;
})
let out=[],total=0;
for (bk in books){
	out.push([bk,books[bk]])
	total+=books[bk];
}
out.sort((a,b)=>b[1]-a[1]);
let acc=0;
for (var i=0;i<out.length;i++){
	acc+=out[i][1];
	out[i][2]=(acc/total).toFixed(2);
	out[i]=out[i].join("\t")
}
fs.writeFileSync("ped-refs.txt",out.join("\n")+"\n"+refs.join("\n"),"utf8");
