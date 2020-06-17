/*
   generate pts-refs.txt
            [number_of_occurence, full_citation]
            pts-refs-bk.txt    
            [number_of_occurence, bookname,  headword|headword ]


use pts-refs-bk.txt  to fix citation typo

example1: (empty book name, missing ".")

   3,,kusala|patthīna|pharaṇa

"word": "patthīna", missing "." between book and page number
<span class='ref'>Vism262</span>

"word": "pharaṇa",
<span class='ref'>Dhs-a166</span>  ==><span class='ref'>Dhs-a.166</span>

example2:
   1,sn,roga

"word": "roga"
<span class='ref'>sn.311</span>

change to Snp.311 

*/

const fn='./pts.json'; //from suttacentral
const pat=/<span class='ref'>(\S+)<\/span>/g
const fs=require("fs")

const ptsjson=JSON.parse(fs.readFileSync(fn,'utf8'));
const refs={},refs_source={};
let uniqrefcount=0,refcount=0;

for (var j in ptsjson){
	const headword=ptsjson[j].word;
	const content=ptsjson[j].text;
	content.replace(pat,(m,m1)=>{
		if (!refs[m1]) {
			refs[m1]=0;
			uniqrefcount++;
		}
		refcount++;
		refs[m1]++;

		const at=m1.indexOf(".");
		const bk=m1.substr(0,at);

		if (!refs_source[bk]) refs_source[bk]=[];
		if (refs_source[bk].length<10) {
			refs_source[bk].push(headword);
		}
	})

}

console.log('ref count',refcount,'unique ref',uniqrefcount)
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

out.unshift('number_of_occurence, full_citation');
fs.writeFileSync('pts-refs.txt',out.join("\n"),"utf8")

const out2=[];
for (var b in bknames){
	out2.push([bknames[b],b]);
}
out2.sort((a,b)=>b[0]-a[0]);

for (var i=0;i<out2.length;i++) {
	if (out2[i][0]<10) {
		out2[i][2]= refs_source[ out2[i][1]].join("|");
	}
}

out2.unshift('number_of_occurence, citation_bookname, from_headword');
fs.writeFileSync('pts-refs-bk.txt',out2.join("\n"),"utf8")

