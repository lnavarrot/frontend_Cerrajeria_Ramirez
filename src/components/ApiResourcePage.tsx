import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LuPlus, LuSearch, LuPencil, LuTrash2, LuX, LuRefreshCw } from 'react-icons/lu';
import { backendApi } from '@/adapters/backendApi';

type Option = { value: string; label: string };
type Field = { name: string; label: string; type?: string; required?: boolean; options?: Option[] };
type Props = {
  resource: string;
  title: string;
  fields: Field[];
  actions?: (id: string) => ReactNode;
};
type Row = Record<string, unknown> & { id: string | number };

export default function ApiResourcePage({ resource, title, fields, actions }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [catalogs, setCatalogs] = useState<Record<string, Option[]>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = async (term = search) => {
    setLoading(true);
    try {
      const { data } = await backendApi.get<{ data: Row[] }>(`/${resource}`, {
        params: { page: 1, limit: 100, ...(term ? { search: term } : {}) },
      });
      setRows(data.data ?? []);
    } catch {
      setError('No se pudieron cargar los registros.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load('');
  }, [resource]);
  useEffect(() => {
    if (resource === 'clients') return;
    void backendApi.get<{ data: Row[] }>('/clients', { params: { page: 1, limit: 100 } }).then(({ data }) => setClients((data.data ?? []).map(row => ({ value: String(row.id), label: String(row.name) }))));
  }, [resource]);
  useEffect(() => {
    if (!form.client_id || (resource !== 'branches' && resource !== 'tickets')) { setBranches([]); return; }
    void backendApi.get<{ data: Row[] }>(`/clients/${form.client_id}/branches`, { params: { page: 1, limit: 100 } }).then(({ data }) => setBranches((data.data ?? []).map(row => ({ value: String(row.id), label: String(row.name) }))));
  }, [form.client_id, resource]);
  useEffect(() => {
    const endpoints = resource === 'projects' ? ['statuses'] : resource === 'tickets' ? ['statuses', 'priorities'] : [];
    endpoints.forEach(catalog => { void backendApi.get<{ data: Option[] }>(`/${resource}/${catalog}`).then(({ data }) => setCatalogs(previous => ({ ...previous, [catalog]: data.data ?? [] }))); });
  }, [resource]);
  useEffect(() => {
    if (resource !== 'tickets') return;
    void backendApi.get<{ data: Row[] }>('/projects', { params: { page: 1, limit: 100 } }).then(({ data }) => setProjects((data.data ?? []).map(row => ({ value: String(row.id), label: String(row.name) }))));
  }, [resource]);
  const close = () => {
    setEditing(null);
    setForm({});
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing !== null) await backendApi.patch(`/${resource}/${editing}`, form);
      else await backendApi.post(`/${resource}`, form);
      close();
      await load();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'No se pudo guardar el registro.'
      );
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string | number) => {
    if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    try {
      await backendApi.delete(`/${resource}/${id}`);
      await load();
    } catch {
      setError('No se pudo eliminar el registro.');
    }
  };
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-default-500">Gestión</p>
          <h1 className="text-2xl font-semibold text-default-900">{title}</h1>
          <p className="mt-1 text-sm text-default-500">{rows.length} registros disponibles</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setError('');
            setForm(Object.fromEntries(fields.map(field => [field.name, ''])));
          }}
          className="btn flex items-center gap-2 bg-primary text-white shadow-sm"
        >
          <LuPlus /> Nuevo registro
        </button>
      </div>
      <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') void load();
            }}
            placeholder={`Buscar en ${title.toLowerCase()}...`}
            className="form-input pl-9"
          />
        </div>
        <button onClick={() => void load()} className="btn border border-default-200">
          <LuSearch className="mr-2 inline" />
          Buscar
        </button>
        <button
          onClick={() => void load()}
          className="btn border border-default-200"
          title="Actualizar"
        >
          <LuRefreshCw />
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-default-50 text-default-500">
              <tr>
                <th className="p-4">ID</th>
                {fields.map(f => (
                  <th key={f.name} className="whitespace-nowrap p-4">
                    {f.label}
                  </th>
                ))}
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={fields.length + 2} className="p-10 text-center text-default-500">
                    Cargando...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 2} className="p-10 text-center text-default-500">
                    No hay registros. Crea el primero con “Nuevo registro”.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="border-t border-default-100 hover:bg-default-50/70">
                    <td className="p-4 font-mono text-xs text-default-500">{row.id}</td>
                    {fields.map(f => (
                      <td key={f.name} className="max-w-[240px] p-4 text-default-700">
                        {String(row[f.name] ?? '—')}
                      </td>
                    ))}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(row.id);
                            setForm(
                              Object.fromEntries(
                                fields.map(f => [f.name, String(row[f.name] ?? '')])
                              )
                            );
                          }}
                          className="rounded p-2 text-default-500 hover:bg-primary/10 hover:text-primary"
                          title="Editar"
                        >
                          <LuPencil />
                        </button>
                        <button
                          onClick={() => void remove(row.id)}
                          className="rounded p-2 text-default-500 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <LuTrash2 />
                        </button>
                        {actions?.(String(row.id))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {(editing !== null || Object.keys(form).length > 0) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={e => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editing !== null ? 'Editar registro' : 'Nuevo registro'}
                </h2>
                <p className="text-sm text-default-500">Completa la información requerida</p>
              </div>
              <button onClick={close} className="rounded p-2 hover:bg-default-100">
                <LuX />
              </button>
            </div>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              {fields.map(field => (
                <label key={field.name} className="text-sm">
                  <span className="mb-1.5 block font-medium text-default-700">
                    {field.label}
                    {field.required !== false && <span className="text-red-500"> *</span>}
                  </span>
                  {field.name === 'client_id' || field.name === 'branch_id' || field.name === 'project_id' ? (
                    <select required={field.required !== false} value={form[field.name] ?? ''} onChange={e => setForm({ ...form, [field.name]: e.target.value, ...(field.name === 'client_id' ? { branch_id: '' } : {}) })} className="form-input">
                      <option value="">Selecciona una opción</option>
                      {(field.name === 'client_id' ? clients : field.name === 'branch_id' ? branches : projects).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (resource === 'projects' && field.name === 'status') || (resource === 'tickets' && (field.name === 'status' || field.name === 'priority')) ? (
                    <select required={field.required !== false} value={form[field.name] ?? ''} onChange={e => setForm({ ...form, [field.name]: e.target.value })} className="form-input"><option value="">Selecciona una opción</option>{(catalogs[field.name === 'priority' ? 'priorities' : 'statuses'] ?? []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  ) : field.name === 'description' || field.name === 'notes' ? (
                    <textarea
                      rows={3}
                      required={field.required !== false}
                      value={form[field.name] ?? ''}
                      onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                      className="form-input"
                    />
                  ) : (
                    <input
                      required={field.required !== false}
                      type={field.type ?? 'text'}
                      value={form[field.name] ?? ''}
                      onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                      className="form-input"
                    />
                  )}
                </label>
              ))}
              <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={close} className="btn border border-default-200">
                  Cancelar
                </button>
                <button disabled={saving} className="btn bg-primary text-white disabled:opacity-60">
                  {saving
                    ? 'Guardando...'
                    : editing !== null
                      ? 'Guardar cambios'
                      : 'Crear registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
