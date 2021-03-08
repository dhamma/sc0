'use strict'
const fs=require("fs");
const {createbuilder}=require("pengine");
const lang=process.argv[2]||'en';
const folder="./"+lang+"-books/";
const booknames=['dn1','dn2','dn3',
	'mn1','mn2','mn3','sn1','sn2','sn3','sn4','sn5',
	'an1','an2','an3','an4','an5','an6','an7','an8','an9','an10','an11'
]

const build=()=>{
	let prevbk='',prevparanum,pagegroup=0,prevpagegroup=0;
	const builder=createbuilder({name:"sc0"+lang});

	booknames.forEach(bk=>{
		const fn=folder+bk+".txt";
		if (!fs.existsSync(fn))return;
		const rawlines=fs.readFileSync(fn,'utf8').split(/\r?\n/);
		for (var i=0;i<rawlines.length;i++) {
			const content=rawlines[i];
		
			if (prevbk&&bk!==prevbk){
				builder.newpage(-1,pagegroup);
				builder.addbook(prevbk);
				pagegroup=0;
				prevpagegroup=0;
			}

			prevbk=bk;
			
			const at2=content.indexOf("|");
			if (at2>-1 && parseInt(content)) {
				const grouppara=content.substr(0,at2);
				let paranum=parseInt(grouppara);
				const at3=grouppara.indexOf(".");
				if (at3>-1) {
					pagegroup=parseInt(grouppara);
				} else {
					pagegroup=0;
				}
		
				paranum=parseInt(grouppara.substr(at3+1));
				if (prevpagegroup&&prevpagegroup!==pagegroup) {
					builder.newpage(-1, prevpagegroup,bk);
				}
				prevpagegroup=pagegroup;
			
				builder.newpage(paranum,pagegroup,bk);
				prevparanum=paranum;
			}
			builder.addline(content);
		}

	})	
	//	builder.newpage(-1,pagegroup,bk);
	builder.addbook(prevbk);

	const payload=[];
	builder.done(payload,{});
}
build();