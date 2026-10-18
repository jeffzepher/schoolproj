export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function parseDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('请选择有效日期');const d=new Date(`${s}T12:00:00`);if(!Number.isFinite(+d)||dateKey(d)!==s)throw Error('日期无效');return d;}
export function periodRange(date,period){const d=parseDate(date),start=new Date(d),end=new Date(d);if(period==='week'){start.setDate(d.getDate()-((d.getDay()+6)%7));end.setTime(+start);end.setDate(start.getDate()+6);}if(period==='month'){start.setDate(1);end.setMonth(d.getMonth()+1,0);}const dates=[];for(const x=new Date(start);x<=end;x.setDate(x.getDate()+1))dates.push(dateKey(x));return {start:dateKey(start),end:dateKey(end),dates};}
export const signed=n=>n>0?`+${n}`:String(n);
export const sortStudents=students=>[...students].sort((a,b)=>a.number.localeCompare(b.number,'zh-CN',{numeric:true}));
export function reportData(state,date,period,weekend=true,sort='number'){
 const range=periodRange(date,period),dates=range.dates.filter(d=>weekend||![0,6].includes(parseDate(d).getDay()));
 const records=state.records.filter(r=>dates.includes(r.date));
 const rows=sortStudents(state.students).map(s=>{const own=records.filter(r=>r.studentId===s.id);return {...s,total:own.reduce((n,r)=>n+r.value,0),daily:dates.map(d=>own.filter(r=>r.date===d&&r.value<0)),bonus:own.filter(r=>r.value>0)};});
 if(sort==='score')rows.sort((a,b)=>b.total-a.total||a.number.localeCompare(b.number,'zh-CN',{numeric:true}));
 return {...range,dates,rows,records};
}
export function importRows(rows,students){
 if(rows.length<2)throw Error('文件至少需要表头与一行学生数据');
 const headers=rows[0].map(x=>String(x??'').trim().replace(/^\uFEFF/,''));const ni=headers.indexOf('学号'),mi=headers.indexOf('姓名');if(ni<0||mi<0)throw Error('首行必须包含「学号」和「姓名」，可先下载模板');
 const incoming=[],seen=new Set(),errors=[];rows.slice(1).forEach((row,i)=>{if(row.every(x=>String(x??'').trim()===''))return;const number=String(row[ni]??'').trim(),name=String(row[mi]??'').trim();if(!number||!name||number.length>30||name.length>30){errors.push(`第 ${i+2} 行学号或姓名为空 / 超过 30 字`);return;}if(seen.has(number)){errors.push(`第 ${i+2} 行学号 ${number} 重复`);return;}seen.add(number);incoming.push({number,name,existing:students.some(s=>s.number===number)});});if(errors.length)throw Error(errors.slice(0,5).join('；'));if(!incoming.length)throw Error('没有可导入的学生');if(incoming.length>2000)throw Error('单次最多导入 2000 位学生');return incoming;
}
export function validateBackup(s){
 if(!s||s.version!==1||!Array.isArray(s.students)||!Array.isArray(s.categories)||!Array.isArray(s.records)||typeof s.className!=='string'||!s.className.trim()||s.className.length>50)throw Error('不是有效的星册备份文件');
 const unique=arr=>new Set(arr).size===arr.length;const validId=x=>typeof x==='string'&&x.length>0&&x.length<=100;
 if(!unique(s.students.map(x=>x.id))||!unique(s.students.map(x=>x.number))||!unique(s.categories.map(x=>x.id))||!unique(s.records.map(x=>x.id)))throw Error('备份包含重复数据');
 for(const x of s.students)if(!validId(x.id)||typeof x.name!=='string'||!x.name.trim()||x.name.length>30||typeof x.number!=='string'||!x.number.trim()||x.number.length>30)throw Error('学生数据无效');
 for(const x of s.categories)if(!validId(x.id)||typeof x.name!=='string'||!x.name.trim()||x.name.length>30||typeof x.short!=='string'||!x.short.trim()||x.short.length>6||!Number.isInteger(x.value)||!x.value||Math.abs(x.value)>999)throw Error('积分项数据无效');
 for(const r of s.records){if(!validId(r.id)||!s.students.some(x=>x.id===r.studentId)||!Number.isInteger(r.value)||!r.value||Math.abs(r.value)>999||typeof r.categoryName!=='string'||r.categoryName.length>30||typeof r.short!=='string'||r.short.length>6||typeof r.note!=='string'||r.note.length>100)throw Error('记分记录无效');parseDate(r.date);}
 return s;
}
