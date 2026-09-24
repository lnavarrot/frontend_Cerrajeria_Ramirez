import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { backendApi } from '@/adapters/backendApi';

type Payload={kpis:Record<string,number>;status:{status:string;value:number}[];trend:{day:string;created:number;closed:number}[]};
const labels:Record<string,string>={open:'Abiertos',assigned:'Asignados',in_progress:'En proceso',finished:'Finalizados',closed:'Cerrados'};
export default function AdminDashboardPage(){
 const [d,setD]=useState<Payload|null>(null);
 useEffect(()=>{backendApi.get('/dashboard/kpis').then(r=>setD(r.data.data));},[]);
 if(!d)return <div className="p-6">Cargando indicadores...</div>;
 const k=d.kpis;
 return <div className="p-4 md:p-6 space-y-6">
  <div><p className="text-sm text-default-500">Gestión operativa</p><h1 className="text-2xl font-semibold">Panel principal</h1><p className="text-sm text-default-500">KPIs y estado general de la atención de tickets</p></div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
   {[['Total',k.total],['Abiertos',k.open],['Asignados',k.assigned],['En proceso',k.in_progress],['Finalizados',k.completed],['Cumplimiento',`${k.completion_rate??0}%`]].map(([a,b])=><div className="card p-5" key={String(a)}><p className="text-sm text-default-500">{a}</p><p className="mt-2 text-3xl font-semibold">{b}</p></div>)}
  </div>
  <div className="grid gap-5 lg:grid-cols-2">
   <div className="card p-5"><h2 className="font-semibold">Distribución por estado</h2><p className="text-sm text-default-500">Indicador tipo SLA/KPI del estado actual</p><Chart type="donut" height={330} series={d.status.map(x=>x.value)} options={{labels:d.status.map(x=>labels[x.status]||x.status),legend:{position:'bottom'}}}/></div>
   <div className="card p-5"><h2 className="font-semibold">Tendencia de tickets - últimos 7 días</h2><p className="text-sm text-default-500">Tickets creados y finalizados por fecha</p><Chart type="line" height={330} series={[{name:'Creados',data:d.trend.map(x=>x.created)},{name:'Finalizados',data:d.trend.map(x=>x.closed)}]} options={{xaxis:{categories:d.trend.map(x=>new Date(x.day+'T00:00:00').toLocaleDateString('es-GT',{day:'2-digit',month:'short'}))},stroke:{curve:'smooth'}}}/></div>
  </div>
  <div className="card p-5"><h2 className="font-semibold">Tiempo promedio de atención</h2><p className="mt-2 text-3xl font-semibold">{k.average_hours??0} h</p><p className="text-sm text-default-500">Promedio desde la creación hasta el cierre; tickets abiertos se calculan hasta el momento actual.</p></div>
 </div>
}
