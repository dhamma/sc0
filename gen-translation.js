/* need to gen-root first */
'use strict'
const lang=process.argv[3]||'en';
const filter=process.argv[2]||'';
const {genbook}=require('./gen');
genbook({lang,writetodisk:!!filter,filter})
