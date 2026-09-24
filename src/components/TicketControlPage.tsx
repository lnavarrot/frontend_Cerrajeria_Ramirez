import { useEffect, useState } from 'react';
import {
  LuClipboardCheck,
  LuRefreshCw,
  LuUserMinus,
  LuUserPlus,
  LuUserRound,
} from 'react-icons/lu';

import { backendApi } from '@/adapters/backendApi';

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

type Technician = {
  id: string;
  first_name: string;
  last_name: string;
  is_available: boolean;
  active_assignments: number;
};

type Assignment = {
  id: string;
  ticket_id: string;
  technician_id: string;
  assigned_by?: string | null;
  assigned_at: string;
  unassigned_at?: string | null;
  first_name: string;
  last_name: string;
  email?: string;
};

const statusLabels: Record<string, string> = {
  open: 'Abierto',
  assigned: 'Asignado',
  in_progress: 'En proceso',
  finished: 'Finalizado',
  closed: 'Cerrado',
};

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function TicketControlPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [assignments, setAssignments] = useState<
    Record<string, Assignment | null>
  >({});

  const [selected, setSelected] = useState<Record<string, string>>({});

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  /*
   * ============================================================
   * CARGAR ASIGNACIÓN ACTUAL DE CADA TICKET
   * ============================================================
   */
  const loadAssignments = async (ticketList: Ticket[]) => {
    const assignmentMap: Record<string, Assignment | null> = {};
    const selectedMap: Record<string, string> = {};

    await Promise.all(
      ticketList.map(async (ticket) => {
        try {
          const { data } = await backendApi.get<{
            data: Assignment[];
          }>(`/tickets/${ticket.id}/assignments`);

          const history = data.data ?? [];

          /*
           * Buscar la asignación que sigue activa.
           * Una asignación activa tiene unassigned_at = NULL.
           */
          const active =
            history.find(
              (assignment) => !assignment.unassigned_at
            ) ?? null;

          assignmentMap[ticket.id] = active;

          /*
           * Dejar seleccionado automáticamente
           * el técnico actualmente asignado.
           */
          if (active) {
            selectedMap[ticket.id] = String(
              active.technician_id
            );
          }
        } catch {
          assignmentMap[ticket.id] = null;
        }
      })
    );

    setAssignments(assignmentMap);
    setSelected(selectedMap);
  };

  /*
   * ============================================================
   * CARGAR TICKETS, TÉCNICOS Y ASIGNACIONES
   * ============================================================
   */
  const load = async () => {
    setLoading(true);
    setMessage('');

    try {
      const [ticketResponse, technicianResponse] =
        await Promise.all([
          backendApi.get<{ data: Ticket[] }>('/tickets', {
            params: {
              page: 1,
              limit: 100,
            },
          }),

          backendApi.get<{ data: Technician[] }>(
            '/technicians',
            {
              params: {
                page: 1,
                limit: 100,
              },
            }
          ),
        ]);

      const ticketList = ticketResponse.data.data ?? [];
      const technicianList =
        technicianResponse.data.data ?? [];

      setTickets(ticketList);
      setTechnicians(technicianList);

      await loadAssignments(ticketList);
    } catch {
      setMessage(
        'No se pudo cargar la información de tickets y técnicos.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  /*
   * ============================================================
   * ASIGNAR O CAMBIAR TÉCNICO
   * ============================================================
   */
  const assign = async (ticketId: string) => {
    const technicianId = selected[ticketId];

    if (!technicianId) {
      setMessage(
        'Selecciona un técnico antes de realizar la asignación.'
      );
      return;
    }

    setSaving(ticketId);
    setMessage('');

    try {
      await backendApi.post(
        `/tickets/${ticketId}/assign`,
        {
          technicianId,
        }
      );

      setMessage(
        `Técnico asignado correctamente al ticket #${ticketId}.`
      );

      await load();
    } catch {
      setMessage(
        'No se pudo asignar el ticket. Verifica la disponibilidad del técnico.'
      );
    } finally {
      setSaving(null);
    }
  };

  /*
   * ============================================================
   * RETIRAR TÉCNICO
   * ============================================================
   */
  const unassign = async (ticketId: string) => {
    setSaving(ticketId);
    setMessage('');

    try {
      await backendApi.post(
        `/tickets/${ticketId}/unassign`
      );

      setMessage(
        `Asignación retirada del ticket #${ticketId}.`
      );

      await load();
    } catch {
      setMessage(
        'El ticket no tiene una asignación activa.'
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-4 md:p-6">

      {/* ENCABEZADO */}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-default-500">
            Operación
          </p>

          <h1 className="text-2xl font-semibold">
            Asignación y control de técnicos
          </h1>

          <p className="mt-1 text-sm text-default-500">
            Consulta el técnico responsable de cada ticket,
            cambia asignaciones y controla la carga de trabajo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="btn flex items-center gap-2 border border-default-200"
        >
          <LuRefreshCw />
          Actualizar
        </button>
      </div>

      {/* MENSAJES */}

      {message && (
        <div className="mb-4 rounded-lg bg-primary/10 p-3 text-primary">
          {message}
        </div>
      )}

      {/* TABLA */}

      <div className="card overflow-x-auto">

        {loading ? (
          <div className="p-10 text-center text-default-500">
            Cargando asignaciones...
          </div>
        ) : (
          <table className="w-full min-w-[1000px] text-left text-sm">

            <thead className="bg-default-50">
              <tr>
                <th className="p-4">
                  Ticket
                </th>

                <th className="p-4">
                  Estado
                </th>

                <th className="p-4">
                  Técnico asignado
                </th>

                <th className="p-4">
                  Seleccionar técnico
                </th>

                <th className="p-4">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {tickets.map((ticket) => {
                const currentAssignment =
                  assignments[ticket.id];

                return (
                  <tr
                    key={ticket.id}
                    className="border-t border-default-100"
                  >

                    {/* TICKET */}

                    <td className="p-4">

                      <p className="font-medium">
                        #{ticket.id} · {ticket.title}
                      </p>

                      <p className="mt-1 text-xs text-default-500">
                        Prioridad:{' '}
                        {priorityLabels[ticket.priority] ??
                          ticket.priority}
                      </p>

                    </td>

                    {/* ESTADO */}

                    <td className="p-4">

                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {statusLabels[ticket.status] ??
                          ticket.status}
                      </span>

                    </td>

                    {/* TÉCNICO ACTUAL */}

                    <td className="p-4">

                      {currentAssignment ? (

                        <div>

                          <div className="flex items-center gap-2 font-medium text-default-900">
                            <LuUserRound className="text-primary" />

                            {currentAssignment.first_name}{' '}
                            {currentAssignment.last_name}
                          </div>

                          {currentAssignment.email && (
                            <p className="mt-1 text-xs text-default-500">
                              {currentAssignment.email}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-emerald-600">
                            Técnico responsable
                          </p>

                        </div>

                      ) : (

                        <span className="text-default-400">
                          Sin técnico asignado
                        </span>

                      )}

                    </td>

                    {/* SELECT */}

                    <td className="p-4">

                      <select
                        value={
                          selected[ticket.id] ?? ''
                        }
                        onChange={(event) =>
                          setSelected((previous) => ({
                            ...previous,
                            [ticket.id]:
                              event.target.value,
                          }))
                        }
                        className="form-input min-w-60"
                      >

                        <option value="">
                          Selecciona técnico
                        </option>

                        {technicians
                          .filter(
                            (technician) =>
                              technician.is_available ||
                              String(technician.id) ===
                                String(
                                  currentAssignment?.technician_id
                                )
                          )
                          .map((technician) => (

                            <option
                              key={technician.id}
                              value={technician.id}
                            >
                              {technician.first_name}{' '}
                              {technician.last_name}
                              {' · '}
                              {technician.active_assignments}{' '}
                              activos
                            </option>

                          ))}

                      </select>

                    </td>

                    {/* ACCIONES */}

                    <td className="p-4">

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          disabled={
                            saving === ticket.id ||
                            !selected[ticket.id]
                          }
                          onClick={() =>
                            void assign(ticket.id)
                          }
                          className="btn flex items-center gap-1 bg-primary text-white disabled:opacity-50"
                        >
                          <LuUserPlus />

                          {currentAssignment
                            ? 'Cambiar'
                            : 'Asignar'}
                        </button>

                        <button
                          type="button"
                          disabled={
                            saving === ticket.id ||
                            !currentAssignment
                          }
                          onClick={() =>
                            void unassign(ticket.id)
                          }
                          className="btn flex items-center gap-1 border border-default-200 disabled:opacity-50"
                        >
                          <LuUserMinus />
                          Retirar
                        </button>

                        <button
                          type="button"
                          title="Registrar trabajo"
                          className="rounded p-2 hover:bg-primary/10"
                        >
                          <LuClipboardCheck />
                        </button>

                      </div>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}