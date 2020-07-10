'use strict'
const {parsePEDCite}=require("./citeparser");
let failed=0,passed=0;
const assert=(a,b,testname)=>{
	if (a!==b) {
		testname&&console.log('test:',testname);
		console.log('expecting',a);
		console.log('got',b);
		failed++;		
	} else passed++
}

//unsupported
//Sdhp Mhvs Dhtp Mvu Avs Dpvs Dhtm Tikp Abhp Pgdp Jtm Mhbv Lal Nd Kacc Duka-pa Asl

const testdata=[
	['Vin.i.188'	,'v1,188'	],
	['Ja.vi.537'	,'j6a,537'	],
	['DN.i.51'		,'d1,51'	],
	['MN.ii.133'	,'m2,133'	],
	['SN.ii.90'		,'s2,90'	],
	['AN.ii.209'	,'a2,209'	],
	['Dhp-a.iii.46'	,'dhp3a,46'	],
	['Pts.ii.241'	,'ps2,241'	],

	['Vb.208'		,'vb,208'	],
	['Vv-a.264'		,'vv0a,264'	],
	['Vb-a.175'		,'vb0a,175'	],
	['Pp.18'		,'pp,18'	],
	['Pp-a.225'		,'pp0a,225'	],

	['Dhp.294'		,'dhp_294'	],
	['Dhp-a.iii.175','dhp3a,175'],
	['Pv-a.151'		,'pv0a,151'	],
	['Vv.37#1'		,'vv37.1'	], //vatthu, gatha
	['Pv.iv.16#71'	,'pv4.16.71'],
	['Cp.i.9#56'	,'cp1.9.56'	],
	['Ud.62'		,'ud,62'	], 
	['Bv.xxiii.23'	,'bv_23g23'	],
	['Thag.1268'	,'thag_1268'],
	['Thig.241'		,'thig_241'	],
	['Mil.207'		,'mil,207'	],
	['Kv.208'		,'kv,208'	],
	['Iti.114'		,'iti,114'	],
	['Dhs.146'		,'ds_146g3'	],
	['Dhs-a.320'	,'ds0a,320'	],
	['Mnd.114'		,'mnd,114'	],
	['Tha-ap.103'	,'thap,103'	],
	['Ne.54'		,'ne,54'	],
	['Netti.54'		,'ne,54'	],
	['Snp-a.160'	,'snp0a,160']
	//Cnd.601
	//Mil.ii.278
/*  MN-a DN DN-a 
Snp-a
Thag-a  不符合 
Vism  缺pts 頁碼 
Cnd 數字太大
Kp Kp-a  //kp 為了和 kp0a 對應，最前面多了 1.1-8  2.1-14 , 與PTS差2
*/

]
testdata.forEach(test=>{
	assert(test[1],parsePEDCite(test[0]))
})
console.log("passed",passed,"failed",failed)