export const nimEmail=(n,v=1)=>`${n.trim().toLowerCase()}${v>1?'.v'+v:''}@auth.bimtrack.app`;
export const validNim=n=>/^[0-9A-Za-z]{5,20}$/.test(n.trim());
