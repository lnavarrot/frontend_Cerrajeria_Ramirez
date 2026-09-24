
import SpainFlag from '@/assets/images/flags/spain.jpg';
import { Link } from 'react-router';
import { TbSearch } from 'react-icons/tb';
import { LuBellRing, LuClock3, LuLogOut, LuTicket } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import SidenavToggle from './SidenavToggle';
import ThemeModeToggle from './ThemeModeToggle';
import { backendApi } from '@/adapters/backendApi';
import { userStorage } from '@/services/authService';

type Notification = {
  id: string;
  ticket_id?: string | null;
  subject?: string | null;
  message: string;
  status: string;
  event_type: string;
  created_at: string;
};

const roleName: Record<string, string> = {
  admin: 'Administrador',
  administrative: 'Personal administrativo',
  technician: 'Técnico',
  client: 'Cliente',
  user: 'Usuario',
};

const eventName: Record<string, string> = {
  ticket_created: 'Ticket creado',
  ticket_assigned: 'Técnico asignado',
  assignment_created: 'Técnico asignado',
  status_changed: 'Estado actualizado',
  service_scheduled: 'Servicio programado',
};

export default function Topbar() {
  const user = userStorage.get();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    backendApi
      .get<{ data: Notification[] }>('/notifications', {
        params: {
          page: 1,
          limit: 8,
        },
      })
      .then(({ data }) => setItems(data.data ?? []))
      .catch(() => setItems([]));
  }, []);

  // CERRAR SESIÓN Y REGRESAR AL LOGIN
  const handleLogout = () => {
    // Eliminar información de autenticación
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');

    // Regresar al login
    window.location.href = '/basic-login';
  };

  return (
    <div className="app-header min-h-topbar-height flex items-center sticky top-0 z-30 bg-(--topbar-background) border-b border-default-200">
      <div className="w-full flex items-center justify-between px-6">

        {/* IZQUIERDA */}
        <div className="flex items-center gap-5">
          <SidenavToggle />

          <div className="lg:flex hidden items-center relative">
            <TbSearch className="absolute start-3 text-base" />

            <input
              type="search"
              className="form-input ps-10 text-sm w-60"
              placeholder="Buscar..."
            />
          </div>
        </div>

        {/* DERECHA */}
        <div className="flex items-center gap-3">

          {/* IDIOMA */}
          <div
            className="btn btn-icon size-8 rounded-full"
            title="Idioma: Español"
          >
            <img
              src={SpainFlag}
              alt="Español"
              className="size-4.5 rounded"
            />
          </div>

          {/* TEMA */}
          <ThemeModeToggle />

          {/* NOTIFICACIONES */}
          <div className="topbar-item hs-dropdown [--auto-close:inside] relative inline-flex">

            <button
              type="button"
              className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative"
              aria-label="Notificaciones"
            >
              <LuBellRing className="size-4.5" />

              {items.length > 0 && (
                <span className="absolute -end-1 -top-1 min-w-4 h-4 px-1 bg-primary text-white rounded-full text-[10px] flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>

            <div className="hs-dropdown-menu w-[380px] max-w-[92vw] p-0">

              <div className="p-4 border-b border-default-200">
                <h3 className="font-semibold text-default-900">
                  Notificaciones
                </h3>

                <p className="text-xs text-default-500 mt-1">
                  Cambios importantes de tickets y servicios
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">

                {items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-default-500">
                    No tienes notificaciones recientes.
                  </div>
                ) : (
                  items.map((n) => (
                    <Link
                      key={n.id}
                      to={n.ticket_id ? '/tickets' : '/notifications'}
                      className="flex gap-3 p-4 border-b border-default-100 hover:bg-default-50"
                    >
                      <div className="mt-1 size-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <LuTicket />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <p className="font-semibold text-sm text-default-900">
                            {n.subject ||
                              eventName[n.event_type] ||
                              'Actualización del sistema'}
                          </p>

                          {n.ticket_id && (
                            <span className="text-xs text-primary whitespace-nowrap">
                              Ticket #{n.ticket_id}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-default-600 line-clamp-2">
                          {n.message}
                        </p>

                        <p className="mt-2 flex items-center gap-1 text-xs text-default-400">
                          <LuClock3 />

                          {new Date(n.created_at).toLocaleString('es-GT', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-default-200">
                <Link
                  to="/notifications"
                  className="btn bg-primary text-white w-full text-center"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            </div>
          </div>

          {/* USUARIO */}
          <div className="topbar-item hs-dropdown relative inline-flex">

            <button className="hs-dropdown-toggle size-9 rounded-full bg-primary/10 text-primary font-semibold">
              {(user?.firstName?.[0] || 'U').toUpperCase()}
            </button>

            <div className="hs-dropdown-menu min-w-56 p-2">

              <div className="px-3 py-2">

                <p className="font-semibold text-default-900">
                  {user
                    ? `${user.firstName} ${user.lastName}`
                    : 'Usuario'}
                </p>

                <p className="text-xs text-default-500">
                  {roleName[user?.role || ''] || 'Usuario'}
                </p>

                <p className="text-xs text-default-400 truncate">
                  {user?.email}
                </p>
              </div>

              <div className="border-t border-default-200 my-2" />

              {/* CERRAR SESIÓN */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-default-100 text-start"
              >
                <LuLogOut />
                Cerrar sesión
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}