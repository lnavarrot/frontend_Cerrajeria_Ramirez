import { useEffect, useState } from 'react';
import { backendApi } from '@/adapters/backendApi';

export default function MetricSummaryPage({ endpoint, title, subtitle }: { endpoint: string; title: string; subtitle: string }) {
  const [data, setData] = useState<Record<string, number>>({}); const [loading, setLoading] = useState(true);
  useEffect(() => { backendApi.get<{ data: Record<string, number> }>(endpoint).then(({ data: result }) => setData(result.data ?? {})).finally(() => setLoading(false)); }, [endpoint]);
  return <div className="p-4 md:p-6"><div className="mb-6"><p className="mb-1 text-sm text-default-500">Gestión operativa</p><h1 className="text-2xl font-semibold text-default-900">{title}</h1><p className="mt-1 text-sm text-default-500">{subtitle}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{loading ? <div className="card p-6">Cargando indicadores...</div> : Object.entries(data).map(([key, value]) => <div key={key} className="card border border-default-100 p-5 shadow-sm"><p className="text-sm capitalize text-default-500">{key.replaceAll('_', ' ')}</p><p className="mt-2 text-3xl font-semibold text-default-900">{value}</p></div>)}</div></div>;
}
