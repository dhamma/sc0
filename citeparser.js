'use strict';
const {parseRoman}=require("pengine");
/* parse Sutta Central PED citation */

const bookVolPage=(m,book,roman,page)=>{
	const v=parseRoman(roman);
	book=book.toLowerCase().replace("pts","ps");
	const bk=book.indexOf("-")>0?book.replace("-",v):book+v;
	//PTS jataka is cs jataka att  j6 ==> j6a
	return bk+((book=="j")?"a":"")+","+page;
}
const bookPage=(m,book,page)=>{
	const bk=book.toLowerCase()
		.replace("dhs","ds")
		.replace("netti","ne")
		.replace("tha-ap","thap");

	return bk.replace("-","0")+","+page;
}

const bookGroupGatha=(m,book,group,gatha)=>{
	return book.toLowerCase()+"_"+(gatha)+"g"+parseRoman(group);
}

const bookVaggaVatthuGatha=(m,book,vagga,vatthu,gatha)=>{
	return book.toLowerCase()+parseRoman(vagga)+"."+vatthu+"."+gatha;
}
const patterns=[
	[/^(V)in\.([iv]{1,3})\.(\d+)/	, bookVolPage],
	[/^([DMSA])N\.([i]{1,3})\.(\d+)/, bookVolPage],
	[/^(J)a\.([iv]{1,3})\.(\d+)/	, bookVolPage],
	[/^(Dhp-a|Pts|Dhp-a)\.([iv]{1,3})\.(\d+)/	,bookVolPage],

	[/^(Dhp-a|Pts|Dhp-a)\.([iv]{1,3})\.(\d+)/	,bookVolPage],

	[/^(Bv)\.([ivx]{1,5})\.(\d+)/	,bookGroupGatha],

	[/^(Vb|Pp|Ud|Mil|Kv|Iti|Mnd|Ne|Netti)\.(\d+)/,bookPage],
	[/^(Vv-a|Vb-a|Pv-a|Pp-a|Kv-a|Dhs-a|Snp-a|Tha-ap)\.(\d+)/,bookPage],

	//[/^(Pv-a)\.(\d+)/,bookPage],
	//[/^(Vb)\.(\d+)/,bookPage],
	
	[/^(Pv|Cp)\.([iv]{1,3})\.(\d+)#(\d+)/,bookVaggaVatthuGatha],
	[/^Snp\.(\d+)/,"snp_$1g1"],
	[/^Dhp\.(\d+)/,"dhp_$1"],
	[/^Vv\.(\d+)#(\d+)/,"vv$1.$2"],
	[/^Dhs\.(\d+)/,"ds_$1g3"],
	[/^Th([ai])g\.(\d+)/,"th$1g_$2"],
]
const parsePEDCite=cite=>{
	for (var i=0;i<patterns.length;i++) {
		const pat=patterns[i][0];
		const func=patterns[i][1];
		const o=cite.replace(pat,func);
		if (o!==cite) return o;
	}
	return cite;
}

module.exports={parsePEDCite};