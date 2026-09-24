import {
  useEffect,
  useState,
  type FormEvent
} from 'react';

import {
  LuDownload,
  LuFile,
  LuUpload
} from 'react-icons/lu';

import { backendApi } from '@/adapters/backendApi';
import { userStorage } from '@/services/authService';


type Row = Record<string, any>;

type Ticket = {
  id: number | string;
  title: string;
  status: string;
};


export default function OperationsPage({
  type
}: {
  type: 'history' | 'files' | 'surveys';
}) {

  const user = userStorage.get();

  const [rows, setRows] = useState<Row[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');

  const [file, setFile] =
    useState<File | null>(null);

  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState('');

  const [uploading, setUploading] =
    useState(false);


  // ============================================================
  // ENDPOINT SEGÚN TIPO DE PÁGINA
  // ============================================================

  const endpoint =
    type === 'history'
      ? '/service-history'
      : type === 'files'
        ? '/files'
        : '/surveys';


  // ============================================================
  // TÍTULO SEGÚN TIPO DE PÁGINA
  // ============================================================

  const title =
    type === 'history'
      ? 'Historial de servicios'
      : type === 'files'
        ? 'Archivos y evidencias'
        : 'Encuestas de satisfacción';


  // ============================================================
  // CARGAR INFORMACIÓN
  // ============================================================

  const load = () => {

    setError('');

    backendApi
      .get(endpoint, {
        params: {
          page: 1,
          limit: 100
        }
      })
      .then(response => {

        setRows(
          response.data.data ?? []
        );

      })
      .catch(() => {

        setError(
          'No se pudo cargar la información.'
        );

      });
  };


  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {

    load();

    backendApi
      .get('/tickets', {
        params: {
          page: 1,
          limit: 100
        }
      })
      .then(response => {

        setTickets(
          response.data.data ?? []
        );

      })
      .catch(() => {

        setTickets([]);

      });

  }, [type]);


  // ============================================================
  // SUBIR ARCHIVO
  // ============================================================

  const upload = async (
    event: FormEvent
  ) => {

    event.preventDefault();

    if (!file || !ticketId) {
      return;
    }

    setError('');
    setUploading(true);

    try {

      const data =
        await new Promise<string>(
          (resolve, reject) => {

            const reader =
              new FileReader();

            reader.onload = () =>
              resolve(
                String(reader.result)
              );

            reader.onerror = () =>
              reject(reader.error);

            reader.readAsDataURL(file);
          }
        );


      await backendApi.post(
        '/files',
        {
          ticketId,
          fileName: file.name,
          mimeType: file.type,
          data
        }
      );


      setFile(null);
      setTicketId('');

      const input =
        document.getElementById(
          'evidence-file'
        ) as HTMLInputElement | null;

      if (input) {
        input.value = '';
      }

      load();

    } catch (err: any) {

      setError(
        err?.response?.data?.error?.message ||
        'No se pudo subir el archivo. Máximo 5 MB.'
      );

    } finally {

      setUploading(false);

    }
  };


  // ============================================================
  // DESCARGAR ARCHIVO
  // ============================================================

  const downloadFile = async (
    row: Row
  ) => {

    if (!row.file_url) {

      setError(
        'Este registro no tiene un archivo disponible.'
      );

      return;
    }

    setError('');

    try {

      const response =
        await backendApi.get(
          `/files/${row.id}/download`,
          {
            responseType: 'blob'
          }
        );


      const blob = new Blob(
        [response.data],
        {
          type:
            row.mime_type ||
            'application/octet-stream'
        }
      );


      const url =
        window.URL.createObjectURL(
          blob
        );


      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        row.file_name ||
        `evidencia-${row.id}`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

    } catch (err: any) {

      setError(
        err?.response?.data?.error?.message ||
        'No se pudo descargar el archivo.'
      );

    }
  };


  // ============================================================
  // ENVIAR ENCUESTA
  // ============================================================

  const survey = async (
    event: FormEvent
  ) => {

    event.preventDefault();

    if (!ticketId) {

      setError(
        'Selecciona un servicio finalizado.'
      );

      return;
    }

    setError('');

    try {

      await backendApi.post(
        `/tickets/${ticketId}/survey`,
        {
          rating,
          comment
        }
      );


      setTicketId('');
      setRating(5);
      setComment('');

      load();

    } catch (err: any) {

      setError(
        err?.response?.data?.error?.message ||
        'No se pudo guardar la encuesta.'
      );

    }
  };


  // ============================================================
  // TICKETS FINALIZADOS
  // ============================================================

  const finished =
    tickets.filter(ticket =>
      ['finished', 'closed'].includes(
        ticket.status
      )
    );


  // ============================================================
  // TICKETS QUE YA TIENEN ENCUESTA
  // ============================================================

  const surveyedTicketIds =
    new Set(
      rows
        .filter(row => row.ticket_id)
        .map(row =>
          Number(row.ticket_id)
        )
    );


  // ============================================================
  // TICKETS PENDIENTES DE ENCUESTA
  // ============================================================

  const pendingSurveyTickets =
    type === 'surveys'
      ? finished.filter(
          ticket =>
            !surveyedTicketIds.has(
              Number(ticket.id)
            )
        )
      : finished;


  // ============================================================
  // FORMATEAR FECHA
  // ============================================================

  const formatDate = (
    value: any
  ) => {

    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleString(
      'es-GT',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  };


  // ============================================================
  // ESTRELLAS
  // ============================================================

  const renderStars = (
    value: any
  ) => {

    const numericRating =
      Math.max(
        0,
        Math.min(
          5,
          Number(value) || 0
        )
      );

    return (
      <>
        <span className="text-lg">
          {'★'.repeat(numericRating)}
          {'☆'.repeat(5 - numericRating)}
        </span>

        <div className="mt-1 text-xs text-default-500">
          {numericRating} de 5
        </div>
      </>
    );
  };


  // ============================================================
  // VISTA
  // ============================================================

  return (

    <main className="p-4 md:p-6">

      <h1 className="mb-1 text-2xl font-semibold">
        {title}
      </h1>

      <p className="mb-6 text-sm text-default-500">
        Cerrajería Ramírez, S.A.
      </p>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>

      )}


      {/* ======================================================
          ARCHIVOS Y EVIDENCIAS - FORMULARIO
      ====================================================== */}

      {type === 'files' && (

        <form
          onSubmit={upload}
          className="card mb-6 grid gap-3 p-5 md:grid-cols-3"
        >

          <select
            required
            value={ticketId}
            onChange={event =>
              setTicketId(
                event.target.value
              )
            }
            className="form-input"
          >

            <option value="">
              Selecciona ticket
            </option>

            {tickets.map(ticket => (

              <option
                key={ticket.id}
                value={ticket.id}
              >
                #{ticket.id} {ticket.title}
              </option>

            ))}

          </select>


          <input
            id="evidence-file"
            required
            type="file"
            onChange={event =>
              setFile(
                event.target.files?.[0] ||
                null
              )
            }
            className="form-input"
          />


          <button
            disabled={uploading}
            className="btn flex items-center justify-center gap-2 bg-primary text-white disabled:opacity-50"
          >

            <LuUpload />

            {uploading
              ? 'Subiendo...'
              : 'Subir evidencia'}

          </button>

        </form>

      )}


      {/* ======================================================
          FORMULARIO DE ENCUESTA PARA CLIENTE
      ====================================================== */}

      {type === 'surveys' &&
       user?.role === 'client' && (

        <div className="mb-6">

          <div className="card p-5">

            <div className="mb-4">

              <h4 className="text-lg font-semibold">
                Calificar servicio
              </h4>

              <p className="mt-1 text-sm text-default-500">
                Selecciona un servicio finalizado y comparte tu experiencia.
              </p>

            </div>


            {pendingSurveyTickets.length === 0 ? (

              <div className="rounded-lg bg-default-50 p-4 text-sm text-default-500">

                No tienes servicios finalizados pendientes de calificar.

              </div>

            ) : (

              <form
                onSubmit={survey}
                className="grid gap-3 md:grid-cols-4"
              >

                <select
                  required
                  value={ticketId}
                  onChange={event =>
                    setTicketId(
                      event.target.value
                    )
                  }
                  className="form-input"
                >

                  <option value="">
                    Selecciona servicio finalizado
                  </option>

                  {pendingSurveyTickets.map(
                    ticket => (

                      <option
                        key={ticket.id}
                        value={ticket.id}
                      >
                        #{ticket.id} {ticket.title}
                      </option>

                    )
                  )}

                </select>


                <select
                  value={rating}
                  onChange={event =>
                    setRating(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="form-input"
                >

                  {[5, 4, 3, 2, 1].map(
                    number => (

                      <option
                        key={number}
                        value={number}
                      >
                        {number} estrella
                        {number !== 1
                          ? 's'
                          : ''}
                      </option>

                    )
                  )}

                </select>


                <input
                  value={comment}
                  onChange={event =>
                    setComment(
                      event.target.value
                    )
                  }
                  placeholder="Comentario"
                  className="form-input"
                />


                <button
                  type="submit"
                  className="btn bg-primary text-white"
                >
                  Enviar encuesta
                </button>

              </form>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          TABLA DE ARCHIVOS
      ====================================================== */}

      {type === 'files' ? (

        <div className="card overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead>

              <tr className="bg-default-50">

                <th className="p-4">
                  ID
                </th>

                <th className="p-4">
                  Ticket
                </th>

                <th className="p-4">
                  Archivo
                </th>

                <th className="p-4">
                  Tipo
                </th>

                <th className="p-4">
                  Tamaño
                </th>

                <th className="p-4">
                  Fecha
                </th>

                <th className="p-4 text-center">
                  Acción
                </th>

              </tr>

            </thead>


            <tbody>

              {rows.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="p-10 text-center text-default-500"
                  >
                    No hay archivos o evidencias todavía.
                  </td>

                </tr>

              ) : (

                rows.map(row => (

                  <tr
                    key={row.id}
                    className="border-t border-default-100"
                  >

                    <td className="p-4">
                      {row.id}
                    </td>


                    <td className="p-4">
                      #{row.ticket_id ?? '—'}
                    </td>


                    <td className="p-4">

                      <div className="flex items-center gap-2">

                        <LuFile />

                        <span className="font-medium">
                          {row.file_name ||
                           'Archivo'}
                        </span>

                      </div>

                    </td>


                    <td className="p-4 text-default-500">
                      {row.mime_type || '—'}
                    </td>


                    <td className="p-4 text-default-500">

                      {row.file_size
                        ? `${(
                            Number(
                              row.file_size
                            ) / 1024
                          ).toFixed(1)} KB`
                        : '—'}

                    </td>


                    <td className="p-4 text-default-500">

                      {formatDate(
                        row.created_at
                      )}

                    </td>


                    <td className="p-4 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          void downloadFile(
                            row
                          )
                        }
                        className="btn inline-flex items-center gap-2 bg-primary text-white"
                      >

                        <LuDownload />

                        Descargar

                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      ) : type === 'surveys' ? (

        /* ====================================================
           TABLA DE ENCUESTAS
        ==================================================== */

        <div className="card overflow-x-auto">

          <div className="border-b border-default-100 p-5">

            <h4 className="text-lg font-semibold">

              {user?.role === 'client'
                ? 'Mis encuestas realizadas'
                : 'Encuestas registradas'}

            </h4>

            <p className="mt-1 text-sm text-default-500">

              {user?.role === 'client'
                ? 'Consulta las calificaciones y comentarios que has enviado.'
                : 'Consulta las calificaciones y comentarios realizados por los clientes.'}

            </p>

          </div>


          <table className="w-full text-left text-sm">

            <thead>

              <tr className="bg-default-50">

                {user?.role !== 'client' && (

                  <th className="p-4">
                    Cliente
                  </th>

                )}


                <th className="p-4">
                  Ticket / Servicio
                </th>


                <th className="p-4">
                  Calificación
                </th>


                <th className="p-4">
                  Comentario
                </th>


                <th className="p-4">
                  Fecha
                </th>

              </tr>

            </thead>


            <tbody>

              {rows.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      user?.role === 'client'
                        ? 4
                        : 5
                    }
                    className="p-10 text-center text-default-500"
                  >

                    {user?.role === 'client'
                      ? 'Todavía no has realizado ninguna encuesta.'
                      : 'No hay encuestas registradas todavía.'}

                  </td>

                </tr>

              ) : (

                rows.map(row => (

                  <tr
                    key={row.id}
                    className="border-t border-default-100 align-top"
                  >

                    {user?.role !== 'client' && (

                      <td className="p-4">

                        <div className="font-medium">

                          {row.client_name ||
                           'Cliente no disponible'}

                        </div>

                        {row.client_id && (

                          <div className="mt-1 text-xs text-default-500">
                            Cliente #{row.client_id}
                          </div>

                        )}

                      </td>

                    )}


                    <td className="p-4">

                      <div className="font-medium">

                        {row.ticket_title ||
                         'Ticket sin título'}

                      </div>

                      <div className="mt-1 text-xs text-default-500">
                        Ticket #{row.ticket_id}
                      </div>

                    </td>


                    <td className="p-4 whitespace-nowrap">

                      {renderStars(
                        row.rating
                      )}

                    </td>


                    <td className="p-4">

                      {row.comment ? (

                        <span>
                          {row.comment}
                        </span>

                      ) : (

                        <span className="text-default-400">
                          Sin comentario
                        </span>

                      )}

                    </td>


                    <td className="p-4 whitespace-nowrap text-default-500">

                      {formatDate(
                        row.submitted_at
                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      ) : (

        /* ====================================================
           TABLA DE HISTORIAL DE SERVICIOS
        ==================================================== */

        <div className="card overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead>

              <tr className="bg-default-50">

                <th className="p-4">
                  ID
                </th>

                <th className="p-4">
                  Detalle
                </th>

              </tr>

            </thead>


            <tbody>

              {rows.length === 0 ? (

                <tr>

                  <td
                    colSpan={2}
                    className="p-10 text-center text-default-500"
                  >
                    No hay registros todavía.
                  </td>

                </tr>

              ) : (

                rows.map(row => (

                  <tr
                    key={row.id}
                    className="border-t border-default-100"
                  >

                    <td className="p-4">
                      {row.id}
                    </td>


                    <td className="p-4">

                      {
                        Object
                          .entries(row)
                          .filter(
                            ([key]) =>
                              ![
                                'id',
                                'file_url'
                              ].includes(key)
                          )
                          .map(
                            ([key, value]) =>
                              `${key}: ${
                                value ?? '—'
                              }`
                          )
                          .join(' · ')
                      }

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      )}

    </main>
  );
}