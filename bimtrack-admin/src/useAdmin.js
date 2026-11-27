import {collection,onSnapshot,query,orderBy,limit} from 'firebase/firestore';
import {db} from './firebase';
import {useLive} from '@shared/data-state';
import {shareSub,peekShared,resetShared} from '@shared/live-store';
export const ACT_HEAD=50,ACT_PAGE=50;
const SRC={reqs:()=>collection(db,'registrationRequests'),users:()=>collection(db,'users'),rst:()=>collection(db,'resetRequests'),
  act:()=>query(collection(db,'aktivitas'),orderBy('createdAt','desc'),limit(ACT_HEAD))};
const K=(k,uid)=>'a|'+k+'|'+uid;
/** Langganan koleksi admin dengan listener bersama (dipakai ulang antar halaman, ditahan 30 dtk). Tiap pemanggilan punya status sendiri,
 *  jadi galat satu koleksi hanya memengaruhi bagian yang memakainya. keys ⊂ {reqs,users,rst,act}. */
export const useAdminCols=(keys,uid)=>useLive(keys,k=>(ok,er)=>shareSub(K(k,uid),(o,e)=>onSnapshot(SRC[k](),{includeMetadataChanges:true},sn=>o(sn.docs.map(d=>({...d.data(),id:d.id})),{fromCache:sn.metadata.fromCache}),e),{ok,er}),uid,{enabled:!!uid,peek:k=>peekShared(K(k,uid))});
export const resetAdminData=resetShared;
/** Props DataState dari hasil useAdminCols. */
export const ds=x=>({status:x.status,error:x.error,onRetry:x.retry});
