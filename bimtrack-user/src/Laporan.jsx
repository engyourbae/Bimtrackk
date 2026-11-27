import {PageHead,Segmented} from './shared/ui';
import {navigate} from '@shared/router';
import Summary from './Summary';
import ImportExport from './ImportExport';
/** Laporan Bimbingan = Ringkasan + CSV dan Backup. tab: 'rin' | 'csv'. */
export default function Laporan({uid,tab,prof}){
  return <div><PageHead title="Laporan Bimbingan" sub="Ringkasan untuk dosen, ekspor CSV, dan cadangan data"/>
    <div className="subtabs"><Segmented label="Bagian" value={tab} onChange={v=>navigate(v)} options={[{value:'rin',label:'Ringkasan',icon:'ringkasan'},{value:'csv',label:'CSV dan Backup',icon:'backup'}]}/></div>
    {tab==='rin'?<Summary uid={uid} prof={prof} embedded/>:<ImportExport uid={uid} embedded/>}</div>}
