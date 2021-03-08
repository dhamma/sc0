'use strict'

const {genbook}=require('./gen');
const filter=process.argv[2]||''; // dn1 , dn2  
genbook({lang:'pli',writetodisk:!!filter,filter})