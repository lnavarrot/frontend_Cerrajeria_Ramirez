import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuClock3,
  LuPencil,
  LuPlus,
  LuRefreshCw,
  LuUserRound,
  LuX,
} from 'react-icons/lu';

import { backendApi } from '@/adapters/backendApi';
import { userStorage } from '@/services/authService';

type Service = {
  id: string;
  ticket_id: string;
  technician_id?: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  notes?: string | null;
  ticket_title?: string;
  technician_first_name?: string;
  technician_last_name?: string;
};

type Option = {
  id: string;
  name?: string;
  title?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
};

type Form = {
  ticketId: string;
  technicianId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string;
};

const blank: Form = {
  ticketId: '',
  technicianId: '',
  startsAt: '',
  endsAt: '',
  status: 'scheduled',
  notes: '',
};

const statuses: Record<string, string> = {
  scheduled: 'Programado',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateFromString(value: string) {
  return new Date(`${value}T12:00:00`);
}

function startOfWeek(value: string) {
  const current = dateFromString(value);

  // Lunes = inicio de semana
  const day = current.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  current.setDate(current.getDate() + difference);

  return current;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function ServiceCalendarPage() {
  const currentUser = userStorage.get();
  const isAdmin = currentUser?.role === 'admin';

  const [services, setServices] = useState<Service[]>([]);
  const [tickets, setTickets] = useState<Option[]>([]);
  const [technicians, setTechnicians] = useState<Option[]>([]);

  const [date, setDate] = useState(
    localDateString(new Date())
  );

  const [form, setForm] = useState<Form>(blank);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Cargar servicios
   */
  const load = () => {
    setLoading(true);
    setError('');

    backendApi
      .get<{ data: Service[] }>('/services', {
        params: {
          page: 1,
          limit: 100,
        },
      })
      .then(({ data }) => {
        setServices(data.data ?? []);
      })
      .catch(() => {
        setError('No se pudo cargar la agenda.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();

    void backendApi
      .get<{ data: Option[] }>('/tickets', {
        params: {
          page: 1,
          limit: 100,
        },
      })
      .then(({ data }) => {
        setTickets(data.data ?? []);
      });

    if (isAdmin) {
      void backendApi
        .get<{ data: Option[] }>('/technicians', {
          params: {
            page: 1,
            limit: 100,
          },
        })
        .then(({ data }) => {
          setTechnicians(data.data ?? []);
        });
    }
  }, []);

  /*
   * Semana seleccionada
   */
  const weekStart = useMemo(
    () => startOfWeek(date),
    [date]
  );

  const weekDays = useMemo(() => {
    return Array.from(
      { length: 7 },
      (_, index) => addDays(weekStart, index)
    );
  }, [weekStart]);

  /*
   * Servicios correspondientes a toda la semana
   */
  const weekServices = useMemo(() => {
    const start = localDateString(weekStart);
    const end = localDateString(addDays(weekStart, 6));

    return services.filter((service) => {
      const serviceDate = service.starts_at.slice(0, 10);

      return serviceDate >= start && serviceDate <= end;
    });
  }, [services, weekStart]);

  /*
   * Estadísticas semanales
   */
  const confirmedCount = weekServices.filter(
    (service) => service.status === 'confirmed'
  ).length;

  const completedCount = weekServices.filter(
    (service) => service.status === 'completed'
  ).length;

  /*
   * Navegación
   */
  const previousWeek = () => {
    setDate(localDateString(addDays(weekStart, -7)));
  };

  const nextWeek = () => {
    setDate(localDateString(addDays(weekStart, 7)));
  };

  const currentWeek = () => {
    setDate(localDateString(new Date()));
  };

  /*
   * Guardar servicio
   */
  const save = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setError('');

      if (editing) {
        await backendApi.patch(
          `/services/${editing}`,
          form
        );
      } else {
        await backendApi.post('/services', form);
      }

      setOpen(false);
      setEditing(null);
      setForm({ ...blank });

      load();
    } catch {
      setError(
        'No se pudo guardar el servicio. Revisa las fechas y campos requeridos.'
      );
    }
  };

  /*
   * Editar servicio
   */
  const edit = (service: Service) => {
    setEditing(service.id);

    setForm({
      ticketId: service.ticket_id,
      technicianId: service.technician_id ?? '',
      startsAt: service.starts_at.slice(0, 16),
      endsAt: service.ends_at.slice(0, 16),
      status: service.status,
      notes: service.notes ?? '',
    });

    setOpen(true);
  };

  /*
   * Nuevo servicio
   */
  const newService = () => {
    setEditing(null);

    setForm({
      ...blank,
      startsAt: `${date}T08:00`,
      endsAt: `${date}T09:00`,
    });

    setOpen(true);
  };

  /*
   * Texto del rango semanal
   */
  const weekEnd = addDays(weekStart, 6);

  const weekLabel =
    `${weekStart.toLocaleDateString('es-GT', {
      day: 'numeric',
      month: 'long',
    })} - ${weekEnd.toLocaleDateString('es-GT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;

  return (
    <div className="p-4 md:p-6">

      {/* ENCABEZADO */}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

        <div>
          <p className="mb-1 text-sm text-default-500">
            Operación
          </p>

          <h1 className="text-2xl font-semibold">
            Calendario de servicios
          </h1>

          <p className="mt-1 text-sm text-default-500">
            Consulta la programación semanal de todos los
            servicios y técnicos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
            className="form-input"
          />

          <button
            type="button"
            onClick={load}
            className="btn border border-default-200"
            title="Actualizar"
          >
            <LuRefreshCw />
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={newService}
              className="btn flex items-center gap-2 bg-primary text-white"
            >
              <LuPlus />
              Programar servicio
            </button>
          )}

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* RESUMEN SEMANAL */}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">

        <div className="card p-5">
          <p className="text-sm text-default-500">
            Servicios de la semana
          </p>

          <p className="mt-1 text-3xl font-semibold">
            {weekServices.length}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-default-500">
            Confirmados
          </p>

          <p className="mt-1 text-3xl font-semibold text-blue-600">
            {confirmedCount}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-default-500">
            Completados
          </p>

          <p className="mt-1 text-3xl font-semibold text-emerald-600">
            {completedCount}
          </p>
        </div>

      </div>

      {/* NAVEGACIÓN SEMANAL */}

      <div className="card mb-5 p-4">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <button
            type="button"
            onClick={previousWeek}
            className="btn flex items-center gap-2 border border-default-200"
          >
            <LuChevronLeft />
            Semana anterior
          </button>

          <div className="text-center">

            <div className="flex items-center justify-center gap-2">
              <LuCalendarDays className="text-primary" />

              <h2 className="font-semibold capitalize">
                {weekLabel}
              </h2>
            </div>

            <button
              type="button"
              onClick={currentWeek}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Ir a semana actual
            </button>

          </div>

          <button
            type="button"
            onClick={nextWeek}
            className="btn flex items-center gap-2 border border-default-200"
          >
            Semana siguiente
            <LuChevronRight />
          </button>

        </div>

      </div>

      {/* CALENDARIO SEMANAL */}

      {loading ? (

        <div className="card p-10 text-center">
          Cargando agenda...
        </div>

      ) : (

        <div className="space-y-4">

          {weekDays.map((day) => {

            const dayString = localDateString(day);

            const dayServices = weekServices
              .filter(
                (service) =>
                  service.starts_at.slice(0, 10) ===
                  dayString
              )
              .sort((a, b) =>
                a.starts_at.localeCompare(b.starts_at)
              );

            return (
              <div
                key={dayString}
                className="card overflow-hidden"
              >

                {/* DÍA */}

                <div className="flex items-center justify-between border-b border-default-100 px-5 py-4">

                  <div>

                    <p className="font-semibold capitalize">
                      {day.toLocaleDateString('es-GT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>

                    <p className="text-xs text-default-500">
                      {dayServices.length}{' '}
                      {dayServices.length === 1
                        ? 'servicio'
                        : 'servicios'}
                    </p>

                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setDate(dayString);

                        setEditing(null);

                        setForm({
                          ...blank,
                          startsAt: `${dayString}T08:00`,
                          endsAt: `${dayString}T09:00`,
                        });

                        setOpen(true);
                      }}
                      className="btn flex items-center gap-2 border border-default-200"
                    >
                      <LuPlus />
                      Agregar
                    </button>
                  )}

                </div>

                {/* SERVICIOS */}

                {dayServices.length === 0 ? (

                  <div className="px-5 py-6 text-sm text-default-500">
                    No hay servicios programados.
                  </div>

                ) : (

                  <div className="divide-y divide-default-100">

                    {dayServices.map((service) => (

                      <div
                        key={service.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-default-50"
                      >

                        <div className="flex min-w-0 items-start gap-4">

                          <div className="rounded-lg bg-primary/10 p-3 text-primary">
                            <LuClock3 />
                          </div>

                          <div className="min-w-0">

                            <p className="font-semibold">
                              Ticket #{service.ticket_id}
                              {' · '}
                              {service.ticket_title ??
                                'Servicio programado'}
                            </p>

                            <p className="mt-1 text-sm text-default-500">
                              {new Date(
                                service.starts_at
                              ).toLocaleTimeString(
                                'es-GT',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                              {' - '}
                              {new Date(
                                service.ends_at
                              ).toLocaleTimeString(
                                'es-GT',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>

                            {service.notes && (
                              <p className="mt-2 text-sm text-default-600">
                                {service.notes}
                              </p>
                            )}

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                          <span className="flex items-center gap-1 text-sm text-default-500">

                            <LuUserRound />

                            {service.technician_first_name
                              ? `${service.technician_first_name} ${service.technician_last_name ?? ''}`
                              : service.technician_id
                              ? `Técnico #${service.technician_id}`
                              : 'Sin asignar'}

                          </span>

                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {statuses[service.status] ??
                              service.status}
                          </span>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                edit(service)
                              }
                              className="rounded p-2 hover:bg-primary/10"
                              title="Editar servicio"
                            >
                              <LuPencil />
                            </button>
                          )}

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>
            );
          })}

        </div>

      )}

      {/* MODAL */}

      {open && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-xl rounded-xl bg-card p-6 shadow-xl">

            <div className="mb-5 flex justify-between">

              <h2 className="text-xl font-semibold">
                {editing
                  ? 'Editar servicio'
                  : 'Programar servicio'}
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
              >
                <LuX />
              </button>

            </div>

            <form
              onSubmit={save}
              className="grid gap-4 sm:grid-cols-2"
            >

              <label className="text-sm">
                Ticket

                <select
                  required
                  value={form.ticketId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      ticketId: event.target.value,
                    })
                  }
                  className="form-input mt-1"
                >
                  <option value="">
                    Selecciona un ticket
                  </option>

                  {tickets.map((ticket) => (
                    <option
                      key={ticket.id}
                      value={ticket.id}
                    >
                      #{ticket.id} {ticket.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                Técnico

                <select
                  value={form.technicianId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      technicianId:
                        event.target.value,
                    })
                  }
                  className="form-input mt-1"
                >
                  <option value="">
                    Sin asignar
                  </option>

                  {technicians.map(
                    (technician) => (
                      <option
                        key={technician.id}
                        value={technician.id}
                      >
                        {technician.first_name}{' '}
                        {technician.last_name}
                      </option>
                    )
                  )}

                </select>
              </label>

              <label className="text-sm">
                Inicio

                <input
                  required
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      startsAt:
                        event.target.value,
                    })
                  }
                  className="form-input mt-1"
                />
              </label>

              <label className="text-sm">
                Fin

                <input
                  required
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      endsAt:
                        event.target.value,
                    })
                  }
                  className="form-input mt-1"
                />
              </label>

              <label className="text-sm">
                Estado

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target.value,
                    })
                  }
                  className="form-input mt-1"
                >
                  {Object.entries(statuses).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="text-sm sm:col-span-2">
                Notas del servicio

                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes:
                        event.target.value,
                    })
                  }
                  className="form-input mt-1"
                  placeholder="Instrucciones, contacto o información importante"
                />
              </label>

              <div className="flex justify-end gap-2 sm:col-span-2">

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="btn border border-default-200"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn bg-primary text-white"
                >
                  Guardar servicio
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
