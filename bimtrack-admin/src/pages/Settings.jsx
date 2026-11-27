import {PageHead,ThemePick,SessionCard,InstallCard,AccountCard} from '../shared/ui';
import {getTheme,setTheme} from '../shared/theme';
import {firebaseConfig} from '../firebase';
export default function Settings({u,onLogout}){
  return <div className="stack"><PageHead title="Pengaturan"/><div className="card"><div className="fld"><label>Tema</label><ThemePick get={getTheme} set={setTheme}/></div><p className="mut">Firebase project: {firebaseConfig.projectId}<br/>Admin UID: {u.uid}</p></div><SessionCard app="admin"/><InstallCard/><AccountCard onLogout={onLogout}/></div>}
