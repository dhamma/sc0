const fn='/tipitaka/sc-data/dictionaries/en/pts.json'
const pat=/<span class='ref'>(\S+)<\/span>/g
const fs=require("fs")

const content=fs.readFileSync(fn,'utf8');
const refs={};
content.replace(pat,(m,m1)=>{
	if (!refs[m1]) refs[m1]=0;
	refs[m1]++;

})
const out=[];
const bknames={};

for (var r in refs) {
	out.push([refs[r],r]);

	const at=r.indexOf(".");
	const bk=r.substr(0,at);

	if (!bknames[bk]) bknames[bk]=0;
	bknames[bk]++;
}

out.sort((a,b)=>b[0]-a[0]);

fs.writeFileSync('pts-refs.txt',out.join("\n"),"utf8")

const out2=[];
for (var b in bknames){
	out2.push([bknames[b],b]);
}
out2.sort((a,b)=>b[0]-a[0]);

fs.writeFileSync('pts-refs-bk.txt',out2.join("\n"),"utf8")

