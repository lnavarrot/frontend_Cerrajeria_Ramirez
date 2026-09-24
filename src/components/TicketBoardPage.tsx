import { useEffect, useState, type FormEvent } from 'react';
import {
  LuCalendarDays,
  LuEye,
  LuPencil,
  LuPlus,
  LuRefreshCw,
  LuTicket,
  LuTrash2,
  LuUserRound,
  LuX
} from 'react-icons/lu';

import { backendApi } from '@/adapters/backendApi';

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  work_type?: string;
  location?: string;
  client_id?: string | number;
  branch_id?: string | number;
  project_id?: string | number;
  required_date?: string | null;
  created_at?: string;
};

type Option = {
  id: string;
  name: string;
};

type TicketForm = {
  client_id: string;
  branch_id: string;
  project_id: string;
  title: string;
  description: string;
  work_type: string;
  priority: string;
  status: string;
  location: string;
  required_date: string;
};

const emptyForm: TicketForm = {
  client_id: '',
  branch_id: '',
  project_id: '',
  title: '',
  description: '',
  work_type: '',
  priority: 'medium',
  status: 'open',
  location: '',
  required_date: ''
};

const columns = [
  {
    value: 'open',
    label: 'Abiertos',
    color: 'border-sky-400',
    badge: 'bg-sky-50 text-sky-700'
  },
  {
    value: 'assigned',
    label: 'Asignados',
    color: 'border-violet-400',
    badge: 'bg-violet-50 text-violet-700'
  },
  {
    value: 'in_progress',
    label: 'En proceso',
    color: 'border-amber-400',
    badge: 'bg-amber-50 text-amber-700'
  },
  {
    value: 'finished',
    label: 'Finalizados',
    color: 'border-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700'
  },
  {
    value: 'closed',
    label: 'Cerrados',
    color: 'border-default-400',
    badge: 'bg-default-100 text-default-700'
  }
];

const priorities: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

export default function TicketBoardPage() {

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dragged, setDragged] = useState<Ticket | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<TicketForm>(emptyForm);

  const [detail, setDetail] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);

  const load = () => {

    setLoading(true);
    setError('');

    backendApi
      .get<{ data: Ticket[] }>('/tickets', {
        params: {
          page: 1,
          limit: 100,
          ...(search ? { search } : {})
        }
      })
      .then(({ data }) => {
        setTickets(data.data ?? []);
      })
      .catch(() => {
        setError('No se pudieron cargar los tickets.');
      })
      .finally(() => {
        setLoading(false);
      });
  };


  useEffect(() => {

    load();

    void backendApi
      .get<{ data: Option[] }>('/clients', {
        params: {
          page: 1,
          limit: 100
        }
      })
      .then(({ data }) => {
        setClients(data.data ?? []);
      });

    void backendApi
      .get<{ data: Option[] }>('/projects', {
        params: {
          page: 1,
          limit: 100
        }
      })
      .then(({ data }) => {
        setProjects(data.data ?? []);
      });

  }, []);


  useEffect(() => {

    if (!form.client_id) {
      setBranches([]);
      return;
    }

    void backendApi
      .get<{ data: Option[] }>(
        `/clients/${form.client_id}/branches`,
        {
          params: {
            page: 1,
            limit: 100
          }
        }
      )
      .then(({ data }) => {
        setBranches(data.data ?? []);
      });

  }, [form.client_id]);


  const changeStatus = async (
    ticket: Ticket,
    status: string
  ) => {

    if (ticket.status === status) return;

    const previous = tickets;

    setSaving(ticket.id);

    setTickets(items =>
      items.map(item =>
        item.id === ticket.id
          ? { ...item, status }
          : item
      )
    );

    try {

      await backendApi.patch(
        `/tickets/${ticket.id}`,
        { status }
      );

    } catch {

      setTickets(previous);
      setError('No se pudo actualizar el estado.');

    } finally {

      setSaving(null);
      setDragged(null);
    }
  };


  const openCreate = () => {

    setEditing(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  };


  const openEdit = (ticket: Ticket) => {

    setEditing(ticket.id);

    setForm({
      client_id: String(ticket.client_id ?? ''),
      branch_id: String(ticket.branch_id ?? ''),
      project_id: String(ticket.project_id ?? ''),
      title: ticket.title,
      description: ticket.description,
      work_type: ticket.work_type ?? '',
      priority: ticket.priority,
      status: ticket.status,
      location: ticket.location ?? '',
      required_date:
        ticket.required_date
          ? ticket.required_date.slice(0, 10)
          : ''
    });

    setFormOpen(true);
  };


  const openDetail = async (ticket: Ticket) => {

    setDetail(ticket);

    try {

      const result =
        await backendApi.get<{
          data: Record<string, unknown>[]
        }>(
          `/tickets/${ticket.id}/history`
        );

      setHistory(result.data.data ?? []);

    } catch {

      setHistory([]);
    }
  };


  // ============================================================
  // ELIMINAR TICKET
  // ============================================================

  const deleteTicket = async (ticket: Ticket) => {

    const confirmed = window.confirm(
      `¿Está seguro de eliminar el ticket #${ticket.id}?\n\n` +
      `${ticket.title}\n\n` +
      `Esta acción eliminará el ticket y no se puede deshacer.`
    );

    if (!confirmed) return;

    setError('');
    setSaving(ticket.id);

    try {

      await backendApi.delete(
        `/tickets/${ticket.id}`
      );

      setTickets(items =>
        items.filter(item => item.id !== ticket.id)
      );

      if (detail?.id === ticket.id) {
        setDetail(null);
      }

    } catch (err: any) {

      setError(
        err?.response?.data?.error?.message ||
        'No se pudo eliminar el ticket.'
      );

    } finally {

      setSaving(null);
    }
  };


  const submit = async (event: FormEvent) => {

    event.preventDefault();
    setError('');

    try {

      if (editing) {

        await backendApi.patch(
          `/tickets/${editing}`,
          form
        );

      } else {

        await backendApi.post(
          '/tickets',
          form
        );
      }

      setFormOpen(false);
      setForm({ ...emptyForm });

      load();

    } catch {

      setError(
        'No se pudo guardar el ticket. Revisa los campos requeridos.'
      );
    }
  };


  return (
    <div className="p-4 md:p-6">

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

        <div>

          <p className="mb-1 text-sm text-default-500">
            Operación
          </p>

          <h1 className="text-2xl font-semibold text-default-900">
            Tickets e incidencias
          </h1>

          <p className="mt-1 text-sm text-default-500">
            Gestiona, mueve y resuelve tickets desde un solo tablero.
          </p>

        </div>


        <div className="flex gap-2">

          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            onKeyDown={event => {
              if (event.key === 'Enter') {
                load();
              }
            }}
            placeholder="Buscar ticket"
            className="form-input w-48"
          />

          <button
            onClick={load}
            className="btn border border-default-200"
            title="Actualizar"
          >
            <LuRefreshCw />
          </button>

          <button
            onClick={openCreate}
            className="btn flex items-center gap-2 bg-primary text-white"
          >
            <LuPlus />
            Crear ticket
          </button>

        </div>

      </div>


      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}


      {loading ? (

        <div className="card p-10 text-center">
          Cargando tablero...
        </div>

      ) : (

        <div className="grid min-w-[1100px] grid-cols-5 gap-4 overflow-x-auto pb-4">

          {columns.map(column => {

            const items =
              tickets.filter(
                ticket =>
                  ticket.status === column.value
              );

            return (

              <section
                key={column.value}
                onDragOver={event =>
                  event.preventDefault()
                }
                onDrop={() =>
                  dragged &&
                  void changeStatus(
                    dragged,
                    column.value
                  )
                }
                className={
                  `min-h-[520px] rounded-xl border-t-4 ` +
                  `${column.color} bg-default-50/70 p-3`
                }
              >

                <div className="mb-4 flex items-center justify-between">

                  <h2 className="font-semibold">
                    {column.label}
                  </h2>

                  <span
                    className={
                      `rounded-full px-2 py-1 text-xs font-semibold ` +
                      column.badge
                    }
                  >
                    {items.length}
                  </span>

                </div>


                <div className="space-y-3">

                  {items.map(ticket => (

                    <article
                      key={ticket.id}
                      draggable
                      onDragStart={() =>
                        setDragged(ticket)
                      }
                      className="cursor-grab rounded-xl border border-default-100 bg-card p-4 shadow-sm"
                    >

                      <div className="mb-3 flex items-start justify-between">

                        <span className="text-xs font-mono text-default-400">
                          #{ticket.id}
                        </span>

                        <span className="text-xs font-semibold text-orange-600">
                          {priorities[ticket.priority] ?? ticket.priority}
                        </span>

                      </div>


                      <h3 className="mb-2 line-clamp-2 font-medium">
                        {ticket.title}
                      </h3>


                      <p className="mb-4 line-clamp-2 text-xs text-default-500">
                        {ticket.description}
                      </p>


                      <div className="mb-3 space-y-1 text-xs text-default-500">

                        <p className="flex items-center gap-2">
                          <LuUserRound />
                          Cliente #{ticket.client_id ?? '—'}
                        </p>

                        <p className="flex items-center gap-2">
                          <LuTicket />
                          Proyecto #{ticket.project_id ?? '—'}
                        </p>

                        {ticket.required_date && (

                          <p className="flex items-center gap-2">

                            <LuCalendarDays />

                            {new Date(
                              ticket.required_date
                            ).toLocaleDateString(
                              'es-GT'
                            )}

                          </p>

                        )}

                      </div>


                      <div className="flex items-center gap-1">

                        <select
                          disabled={
                            saving === ticket.id
                          }
                          value={ticket.status}
                          onChange={event =>
                            void changeStatus(
                              ticket,
                              event.target.value
                            )
                          }
                          className="form-input flex-1 text-xs"
                        >

                          <option value="open">
                            Abierto
                          </option>

                          <option value="assigned">
                            Asignado
                          </option>

                          <option value="in_progress">
                            En proceso
                          </option>

                          <option value="finished">
                            Finalizado
                          </option>

                          <option value="closed">
                            Cerrado
                          </option>

                        </select>


                        <button
                          type="button"
                          title="Ver detalle"
                          onClick={() =>
                            void openDetail(ticket)
                          }
                          className="rounded p-2 hover:bg-primary/10"
                        >
                          <LuEye />
                        </button>


                        <button
                          type="button"
                          title="Editar ticket"
                          onClick={() =>
                            openEdit(ticket)
                          }
                          className="rounded p-2 hover:bg-primary/10"
                        >
                          <LuPencil />
                        </button>


                        <button
                          type="button"
                          title="Eliminar ticket"
                          disabled={
                            saving === ticket.id
                          }
                          onClick={() =>
                            void deleteTicket(ticket)
                          }
                          className="rounded p-2 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <LuTrash2 />
                        </button>

                      </div>

                    </article>

                  ))}

                </div>

              </section>

            );

          })}

        </div>

      )}


      {/* ======================================================
          CREAR / EDITAR TICKET
      ====================================================== */}

      {formOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card p-6 shadow-xl">

            <div className="mb-5 flex justify-between">

              <h2 className="text-xl font-semibold">
                {editing
                  ? 'Editar ticket'
                  : 'Crear ticket'}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setFormOpen(false)
                }
              >
                <LuX />
              </button>

            </div>


            <form
              onSubmit={submit}
              className="grid gap-4 sm:grid-cols-2"
            >

              <label className="text-sm">

                Cliente

                <select
                  required
                  value={form.client_id}
                  onChange={event =>
                    setForm({
                      ...form,
                      client_id:
                        event.target.value,
                      branch_id: ''
                    })
                  }
                  className="form-input mt-1"
                >

                  <option value="">
                    Selecciona un cliente
                  </option>

                  {clients.map(option => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {option.name}
                    </option>
                  ))}

                </select>

              </label>


              <label className="text-sm">

                Sucursal

                <select
                  value={form.branch_id}
                  onChange={event =>
                    setForm({
                      ...form,
                      branch_id:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                >

                  <option value="">
                    Selecciona una sucursal
                  </option>

                  {branches.map(option => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {option.name}
                    </option>
                  ))}

                </select>

              </label>


              <label className="text-sm">

                Proyecto

                <select
                  value={form.project_id}
                  onChange={event =>
                    setForm({
                      ...form,
                      project_id:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                >

                  <option value="">
                    Sin proyecto
                  </option>

                  {projects.map(option => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {option.name}
                    </option>
                  ))}

                </select>

              </label>


              <label className="text-sm">

                Prioridad

                <select
                  required
                  value={form.priority}
                  onChange={event =>
                    setForm({
                      ...form,
                      priority:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                >

                  <option value="low">
                    Baja
                  </option>

                  <option value="medium">
                    Media
                  </option>

                  <option value="high">
                    Alta
                  </option>

                  <option value="urgent">
                    Urgente
                  </option>

                </select>

              </label>


              <label className="text-sm sm:col-span-2">

                Título

                <input
                  required
                  value={form.title}
                  onChange={event =>
                    setForm({
                      ...form,
                      title:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                />

              </label>


              <label className="text-sm sm:col-span-2">

                Descripción

                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={event =>
                    setForm({
                      ...form,
                      description:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                />

              </label>


              <label className="text-sm">

                Tipo de trabajo

                <input
                  value={form.work_type}
                  onChange={event =>
                    setForm({
                      ...form,
                      work_type:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                />

              </label>


              <label className="text-sm">

                Fecha requerida

                <input
                  type="date"
                  value={form.required_date}
                  onChange={event =>
                    setForm({
                      ...form,
                      required_date:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                />

              </label>


              <label className="text-sm">

                Ubicación

                <input
                  value={form.location}
                  onChange={event =>
                    setForm({
                      ...form,
                      location:
                        event.target.value
                    })
                  }
                  className="form-input mt-1"
                />

              </label>


              {editing && (

                <label className="text-sm">

                  Estado

                  <select
                    value={form.status}
                    onChange={event =>
                      setForm({
                        ...form,
                        status:
                          event.target.value
                      })
                    }
                    className="form-input mt-1"
                  >

                    {columns.map(column => (
                      <option
                        key={column.value}
                        value={column.value}
                      >
                        {column.label}
                      </option>
                    ))}

                  </select>

                </label>

              )}


              <div className="flex justify-end gap-2 sm:col-span-2">

                <button
                  type="button"
                  onClick={() =>
                    setFormOpen(false)
                  }
                  className="btn border border-default-200"
                >
                  Cancelar
                </button>

                <button className="btn bg-primary text-white">
                  Guardar ticket
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================================
          DETALLE DEL TICKET
      ====================================================== */}

      {detail && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-card p-6 shadow-xl">

            <div className="mb-5 flex justify-between">

              <h2 className="text-xl font-semibold">
                Detalle del ticket #{detail.id}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setDetail(null)
                }
              >
                <LuX />
              </button>

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

              <div className="sm:col-span-2">

                <p className="text-sm text-default-500">
                  Título
                </p>

                <p className="font-medium">
                  {detail.title}
                </p>

              </div>


              <div>

                <p className="text-sm text-default-500">
                  Estado
                </p>

                <p>
                  {
                    columns.find(
                      column =>
                        column.value ===
                        detail.status
                    )?.label
                  }
                </p>

              </div>


              <div>

                <p className="text-sm text-default-500">
                  Prioridad
                </p>

                <p>
                  {priorities[
                    detail.priority
                  ] ?? detail.priority}
                </p>

              </div>


              <div>

                <p className="text-sm text-default-500">
                  Cliente
                </p>

                <p>
                  #{detail.client_id ?? '—'}
                </p>

              </div>


              <div>

                <p className="text-sm text-default-500">
                  Proyecto
                </p>

                <p>
                  #{detail.project_id ?? '—'}
                </p>

              </div>


              <div className="sm:col-span-2">

                <p className="text-sm text-default-500">
                  Descripción
                </p>

                <p className="whitespace-pre-wrap">
                  {detail.description}
                </p>

              </div>

            </div>


            <h3 className="mt-6 border-b border-default-100 pb-2 font-semibold">
              Historial
            </h3>


            {history.length ? (

              <div className="mt-3 space-y-2">

                {history.map(
                  (event, index) => (

                    <div
                      key={index}
                      className="rounded-lg bg-default-50 p-3 text-sm"
                    >
                      {String(event.type)}
                      {' · '}
                      {String(event.at)}
                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="mt-3 text-sm text-default-500">
                Todavía no hay eventos registrados.
              </p>

            )}


            <button
              type="button"
              onClick={() =>
                setDetail(null)
              }
              className="btn mt-6 w-full bg-primary text-white"
            >
              Cerrar
            </button>

          </div>

        </div>

      )}

    </div>
  );
}